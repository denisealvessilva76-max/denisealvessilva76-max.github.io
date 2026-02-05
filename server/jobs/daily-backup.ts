import * as cron from "node-cron";
import { emailService } from "../services/email-service";
import { generateDailyReportEmail } from "../../lib/email-templates";
import { getDb } from "../db";
import { employees, checkIns, userHydration, bloodPressureRecords, complaints } from "../../drizzle/schema";
import { eq, and, sql, gte } from "drizzle-orm";

interface BackupConfig {
  enabled: boolean;
  emailTo: string;
  schedule: string; // Cron expression (ex: "0 8 * * *" = todos os dias às 8h)
}

let backupJob: ReturnType<typeof cron.schedule> | null = null;
let currentConfig: BackupConfig | null = null;

/**
 * Coleta dados do dia para o relatório
 */
async function collectDailyData() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar todos os funcionários
    const allEmployees = await db.select().from(employees).where(eq(employees.isActive, 1));

    // Buscar check-ins de hoje
    const todayCheckIns = await db
      .select()
      .from(checkIns)
      .where(gte(checkIns.date, today));

    // Buscar hidratação de hoje
    const todayHydration = await db
      .select()
      .from(userHydration)
      .where(gte(userHydration.date, today));

    // Buscar pressão arterial de hoje
    const todayPressure = await db
      .select()
      .from(bloodPressureRecords)
      .where(gte(bloodPressureRecords.createdAt, today));

    // Buscar queixas da semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekComplaints = await db
      .select()
      .from(complaints)
      .where(gte(complaints.createdAt, weekAgo));

    // Calcular estatísticas
    const stats = {
      totalEmployees: allEmployees.length,
      activeToday: todayCheckIns.length,
      checkInsToday: todayCheckIns.length,
      hydrationAverage:
        todayHydration.length > 0
          ? Math.round(
              todayHydration.reduce((sum, h) => sum + ((h.totalMl ?? 0) / (h.goalMl ?? 2000)) * 100, 0) / todayHydration.length
            )
          : 0,
      complaintsThisWeek: weekComplaints.length,
      challengesActive: 0, // TODO: Implementar quando houver tabela de desafios
      ergonomicsAdherence: 0,
      mentalHealthUsage: 0,
    };

    // Montar lista de funcionários com dados do dia
    const employeeRecords = allEmployees.map((emp) => {
      const checkIn = todayCheckIns.find((c) => c.userId === emp.id);
      const hydration = todayHydration.find((h) => h.userId === emp.id);
      const pressure = todayPressure.find((p) => p.userId === emp.id);
      const empComplaints = weekComplaints.filter((c) => c.userId === emp.id);

      return {
        id: emp.id.toString(),
        name: emp.name || "Sem nome",
        matricula: emp.matricula || "Sem matrícula",
        lastCheckIn: checkIn ? checkIn.mood : null,
        hydrationToday: hydration?.totalMl ?? 0,
        hydrationGoal: hydration ? hydration.goalMl : 2000,
        lastPressure: pressure
          ? {
              systolic: pressure.systolic,
              diastolic: pressure.diastolic,
            }
          : null,
        complaintsCount: empComplaints.length,
        challengesActive: 0,
      };
    });

    // Gerar alertas
    const alerts = [];

    for (const emp of employeeRecords) {
      // Alerta de pressão elevada
      if (emp.lastPressure && (emp.lastPressure.systolic >= 140 || emp.lastPressure.diastolic >= 90)) {
        alerts.push({
          type: "pressure" as const,
          employeeName: emp.name,
          employeeMatricula: emp.matricula,
          message: `Pressão arterial elevada: ${emp.lastPressure.systolic}/${emp.lastPressure.diastolic} mmHg`,
          severity: emp.lastPressure.systolic >= 160 || emp.lastPressure.diastolic >= 100 ? ("high" as const) : ("medium" as const),
        });
      }

      // Alerta de hidratação baixa
      if (emp.hydrationToday / emp.hydrationGoal < 0.5) {
        alerts.push({
          type: "hydration" as const,
          employeeName: emp.name,
          employeeMatricula: emp.matricula,
          message: `Hidratação baixa: ${Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}% da meta`,
          severity: emp.hydrationToday / emp.hydrationGoal < 0.3 ? ("high" as const) : ("medium" as const),
        });
      }

      // Alerta de queixas
      if (emp.complaintsCount > 0) {
        alerts.push({
          type: "complaint" as const,
          employeeName: emp.name,
          employeeMatricula: emp.matricula,
          message: `${emp.complaintsCount} queixa(s) reportada(s) esta semana`,
          severity: emp.complaintsCount >= 3 ? ("high" as const) : ("low" as const),
        });
      }
    }

    return { stats, employees: employeeRecords, alerts };
  } catch (error) {
    console.error("[DailyBackup] Erro ao coletar dados:", error);
    throw error;
  }
}

/**
 * Executa o backup diário
 */
async function executeDailyBackup() {
  try {
    if (!currentConfig || !currentConfig.enabled) {
      console.log("[DailyBackup] Backup desabilitado, pulando execução");
      return;
    }

    if (!emailService.isConfigured()) {
      console.error("[DailyBackup] Serviço de e-mail não configurado");
      return;
    }

    console.log("[DailyBackup] Iniciando backup diário...");

    // Coletar dados
    const { stats, employees, alerts } = await collectDailyData();

    // Gerar HTML do relatório
    const date = new Date().toLocaleDateString("pt-BR");
    const html = generateDailyReportEmail(stats, employees, alerts, date);

    // Enviar e-mail
    const result = await emailService.sendEmail({
      to: currentConfig.emailTo,
      subject: `Relatório Diário - Canteiro Saudável - ${date}`,
      html,
    });

    if (result.success) {
      console.log(`[DailyBackup] Backup enviado com sucesso para ${currentConfig.emailTo}`);
    } else {
      console.error(`[DailyBackup] Erro ao enviar backup: ${result.error}`);
    }
  } catch (error) {
    console.error("[DailyBackup] Erro ao executar backup diário:", error);
  }
}

/**
 * Inicia o agendador de backup diário
 */
export function startDailyBackup(config: BackupConfig) {
  try {
    // Parar job anterior se existir
    if (backupJob) {
      backupJob.stop();
      backupJob = null;
    }

    currentConfig = config;

    if (!config.enabled) {
      console.log("[DailyBackup] Backup automático desabilitado");
      return;
    }

    // Validar cron expression
    if (!cron.validate(config.schedule)) {
      throw new Error(`Expressão cron inválida: ${config.schedule}`);
    }

    // Criar novo job
    backupJob = cron.schedule(config.schedule, executeDailyBackup, {
      timezone: "America/Sao_Paulo",
    });

    console.log(`[DailyBackup] Backup automático agendado: ${config.schedule} (${config.emailTo})`);
  } catch (error) {
    console.error("[DailyBackup] Erro ao iniciar backup automático:", error);
    throw error;
  }
}

/**
 * Para o agendador de backup diário
 */
export function stopDailyBackup() {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
    currentConfig = null;
    console.log("[DailyBackup] Backup automático parado");
  }
}

/**
 * Retorna a configuração atual
 */
export function getBackupConfig(): BackupConfig | null {
  return currentConfig;
}

/**
 * Executa backup manualmente (para testes)
 */
export async function executeManualBackup(emailTo: string) {
  try {
    console.log("[DailyBackup] Executando backup manual...");

    const { stats, employees, alerts } = await collectDailyData();
    const date = new Date().toLocaleDateString("pt-BR");
    const html = generateDailyReportEmail(stats, employees, alerts, date);

    const result = await emailService.sendEmail({
      to: emailTo,
      subject: `Relatório Manual - Canteiro Saudável - ${date}`,
      html,
    });

    return result;
  } catch (error) {
    console.error("[DailyBackup] Erro ao executar backup manual:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Configuração padrão (pode ser sobrescrita)
const defaultConfig: BackupConfig = {
  enabled: process.env.BACKUP_ENABLED === "true",
  emailTo: process.env.BACKUP_EMAIL || "",
  schedule: process.env.BACKUP_SCHEDULE || "0 8 * * *", // 8h da manhã todos os dias
};

// Inicializar automaticamente se configurado
if (defaultConfig.enabled && defaultConfig.emailTo) {
  startDailyBackup(defaultConfig);
  console.log("[DailyBackup] Backup automático inicializado via variáveis de ambiente");
} else {
  console.log("[DailyBackup] Backup automático não configurado. Configure via app ou variáveis de ambiente.");
}
