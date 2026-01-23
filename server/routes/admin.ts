import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { healthReferrals, adminUsers, healthDataSync, aggregatedHealthData } from "../../drizzle/schema";
import { eq, desc, gte } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

/**
 * POST /api/admin/login
 * Autenticar administrador
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password são obrigatórios" });
    }

    // Credenciais padrão (em produção, usar banco de dados com bcrypt)
    const ADMIN_EMAIL = "admin@obra.com";
    const ADMIN_PASSWORD = "senha123";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    // Gerar token simples
    const token = Buffer.from(`admin:${Date.now()}`).toString("base64");

    res.json({
      success: true,
      token,
      email,
      message: "Login realizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

/**
 * GET /api/admin/dashboard
 * Obter dados agregados do dashboard
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Obter dados agregados
    const aggregated = await db
      .select()
      .from(aggregatedHealthData)
      .orderBy(desc(aggregatedHealthData.updatedAt))
      .limit(1);

    const latestData = aggregated[0] || {
      totalWorkers: 0,
      totalCheckIns: 0,
      avgPressureSystolic: "0",
      avgPressureDiastolic: "0",
      checkInBem: 0,
      checkInDorLeve: 0,
      checkInDorForte: 0,
    };

    // Contar empregados em risco
    const allReferrals = await db
      .select()
      .from(healthReferrals);
    
    const atRiskReferrals = allReferrals.filter((r: any) => r.status !== "resolvido");

    const uniqueAtRiskEmployees = new Set(
      atRiskReferrals.map((r: any) => r.workerId)
    ).size;

    // Contar encaminhamentos desta semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thisWeekReferrals = await db
      .select()
      .from(healthReferrals)
      .where(gte(healthReferrals.createdAt as any, sevenDaysAgo.toISOString() as any));

    res.json({
      success: true,
      totalEmployees: latestData.totalWorkers || 0,
      totalCheckIns: latestData.totalCheckIns || 0,
      averagePressure: {
        systolic: parseFloat(latestData.avgPressureSystolic as any) || 0,
        diastolic: parseFloat(latestData.avgPressureDiastolic as any) || 0,
      },
      wellnessDistribution: {
        good: latestData.checkInBem || 0,
        mild: latestData.checkInDorLeve || 0,
        severe: latestData.checkInDorForte || 0,
      },
      atRiskEmployees: uniqueAtRiskEmployees,
      referralsThisWeek: thisWeekReferrals.length,
      medalsBadges: 0,
    });
  } catch (error) {
    console.error("Erro ao obter dashboard:", error);
    res.status(500).json({ error: "Erro ao obter dashboard" });
  }
});

/**
 * GET /api/admin/referrals
 * Obter todas as queixas/encaminhamentos
 */
router.get("/referrals", async (req: Request, res: Response) => {
  try {
    // Verificar autenticação (simplificado)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const { status, severity, limit = 50 } = req.query;

    let query: any = db.select().from(healthReferrals);

    if (status) {
      query = query.where(eq(healthReferrals.status, status as string));
    }

    if (severity) {
      query = query.where(eq(healthReferrals.severity, severity as string));
    }

    const referrals = await query
      .orderBy(desc(healthReferrals.createdAt))
      .limit(parseInt(limit as string) || 50);

    res.json({
      success: true,
      data: referrals,
      total: referrals.length,
    });
  } catch (error) {
    console.error("Erro ao obter encaminhamentos:", error);
    res.status(500).json({ error: "Erro ao obter encaminhamentos" });
  }
});

/**
 * GET /api/admin/referrals/pending
 * Obter encaminhamentos pendentes
 */
router.get("/referrals/pending", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const pendingReferrals = await db
      .select()
      .from(healthReferrals)
      .where(eq(healthReferrals.status, "pendente"))
      .orderBy(desc(healthReferrals.createdAt));

    // Agrupar por severidade
    const grouped = {
      grave: pendingReferrals.filter((r) => r.severity === "grave"),
      moderada: pendingReferrals.filter((r) => r.severity === "moderada"),
      leve: pendingReferrals.filter((r) => r.severity === "leve"),
    };

    res.json({
      success: true,
      data: grouped,
      total: pendingReferrals.length,
    });
  } catch (error) {
    console.error("Erro ao obter encaminhamentos pendentes:", error);
    res.status(500).json({ error: "Erro ao obter encaminhamentos pendentes" });
  }
});

/**
 * GET /api/admin/referrals/stats
 * Obter estatísticas de encaminhamentos
 */
router.get("/referrals/stats", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allReferrals = await db
      .select()
      .from(healthReferrals)
      .where(gte(healthReferrals.createdAt as any, thirtyDaysAgo.toISOString() as any));

    const stats = {
      total: allReferrals.length,
      pending: allReferrals.filter((r) => r.status === "pendente").length,
      inProgress: allReferrals.filter((r) => r.status === "em-atendimento").length,
      resolved: allReferrals.filter((r) => r.status === "resolvido").length,
      bySeverity: {
        leve: allReferrals.filter((r) => r.severity === "leve").length,
        moderada: allReferrals.filter((r) => r.severity === "moderada").length,
        grave: allReferrals.filter((r) => r.severity === "grave").length,
      },
      byType: {
        dorLeve: allReferrals.filter((r) => r.complaintType === "dor-leve").length,
        dorForte: allReferrals.filter((r) => r.complaintType === "dor-forte").length,
        outro: allReferrals.filter((r) => r.complaintType === "outro").length,
      },
    };

    res.json({
      success: true,
      data: stats,
      period: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas" });
  }
});

/**
 * PATCH /api/admin/referrals/:id
 * Atualizar status de encaminhamento
 */
router.patch("/referrals/:id", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { id } = req.params;
    const { status, notes, referredTo } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (referredTo) updateData.referredTo = referredTo;

    // Atualizar encaminhamento
    const result = await db
      .update(healthReferrals)
      .set(updateData)
      .where(eq(healthReferrals.id, parseInt(id)));

    res.json({
      success: true,
      message: "Encaminhamento atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar encaminhamento:", error);
    res.status(500).json({ error: "Erro ao atualizar encaminhamento" });
  }
});

/**
 * GET /api/admin/employees-at-risk
 * Obter empregados que precisam de atenção
 */
router.get("/employees-at-risk", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Obter encaminhamentos não resolvidos
    const atRiskReferrals = await db
      .select()
      .from(healthReferrals)
      .orderBy(desc(healthReferrals.severity));

    // Filtrar os que não estão resolvidos
    const filteredReferrals = atRiskReferrals.filter((r: any) => r.status !== "resolvido" && r.status !== "Resolvido");

    // Agrupar por workerId
    const employeeMap = new Map<string, any>();
    filteredReferrals.forEach((ref: any) => {
      if (!employeeMap.has(ref.workerId)) {
        employeeMap.set(ref.workerId, {
          workerId: ref.workerId,
          referrals: [],
          lastComplaint: ref.createdAt,
          severity: ref.severity,
        });
      }
      const emp = employeeMap.get(ref.workerId);
      emp.referrals.push(ref);
      if (new Date(ref.createdAt) > new Date(emp.lastComplaint)) {
        emp.lastComplaint = ref.createdAt;
        emp.severity = ref.severity;
      }
    });

    const employees = Array.from(employeeMap.values()).sort((a, b) => {
      const severityOrder = { grave: 0, moderada: 1, leve: 2 };
      return severityOrder[a.severity as keyof typeof severityOrder] -
        severityOrder[b.severity as keyof typeof severityOrder];
    });

    res.json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error("Erro ao obter empregados em risco:", error);
    res.status(500).json({ error: "Erro ao obter empregados em risco" });
  }
});

export default router;


/**
 * GET /api/admin/analytics
 * Obter dados agregados para gráficos e análises
 * Query params: period (week|month|quarter)
 */
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const { period = "month" } = req.query;
    
    // Calcular data inicial baseado no período
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Buscar todos os encaminhamentos do período
    const referrals = await db
      .select()
      .from(healthReferrals)
      .where(gte(healthReferrals.createdAt as any, startDate.toISOString() as any))
      .orderBy(healthReferrals.createdAt);

    // 1. Queixas mais comuns (top 10)
    const complaintCounts: Record<string, number> = {};
    referrals.forEach((r: any) => {
      const type = r.type || "Outros";
      complaintCounts[type] = (complaintCounts[type] || 0) + 1;
    });
    
    const topComplaints = Object.entries(complaintCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count], index) => ({
        x: index + 1,
        y: count as number,
        label: name,
      }));

    // 2. Estados emocionais (distribuição)
    const emotionalStates = {
      bem: 0,
      levemente_preocupado: 0,
      muito_preocupado: 0,
      estressado: 0,
      ansioso: 0,
    };
    
    referrals.forEach((r: any) => {
      if (r.emotionalState && emotionalStates.hasOwnProperty(r.emotionalState)) {
        (emotionalStates as any)[r.emotionalState]++;
      }
    });

    const emotionalDistribution = Object.entries(emotionalStates).map(([state, count], index) => ({
      x: index + 1,
      y: count as number,
      label: state.replace(/_/g, " "),
    }));

    // 3. Tendência de check-ins ao longo do tempo
    const checkInTrend: Record<string, { bem: number; dorLeve: number; dorForte: number }> = {};
    
    referrals.forEach((r: any) => {
      const date = new Date(r.createdAt).toISOString().split("T")[0];
      if (!checkInTrend[date]) {
        checkInTrend[date] = { bem: 0, dorLeve: 0, dorForte: 0 };
      }
      
      if (r.severity === "leve") checkInTrend[date].dorLeve++;
      else if (r.severity === "grave") checkInTrend[date].dorForte++;
      else checkInTrend[date].bem++;
    });

    const checkInTimeSeries = Object.entries(checkInTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts], index) => ({
        x: index + 1,
        y: counts.bem + counts.dorLeve + counts.dorForte,
        label: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));

    // 4. Riscos ergonômicos relatados
    const ergonomicRisks = {
      postura_inadequada: 0,
      levantamento_peso: 0,
      movimentos_repetitivos: 0,
      trabalho_altura: 0,
      exposicao_calor: 0,
    };

    referrals.forEach((r: any) => {
      if (r.riskFactors && Array.isArray(r.riskFactors)) {
        r.riskFactors.forEach((risk: string) => {
          if (ergonomicRisks.hasOwnProperty(risk)) {
            (ergonomicRisks as any)[risk]++;
          }
        });
      }
    });

    const ergonomicRiskData = Object.entries(ergonomicRisks).map(([risk, count], index) => ({
      x: index + 1,
      y: count as number,
      label: risk.replace(/_/g, " "),
    }));

    // 5. Indicadores gerais
    const totalReferrals = referrals.length;
    const resolvedReferrals = referrals.filter((r: any) => r.status === "resolvido").length;
    const pendingReferrals = referrals.filter((r: any) => r.status === "pendente").length;
    const uniqueWorkers = new Set(referrals.map((r: any) => r.workerId)).size;
    
    // Calcular absenteísmo (simplificado: % de trabalhadores com queixas graves)
    const severeComplaints = referrals.filter((r: any) => r.severity === "grave").length;
    const absenteeismRate = uniqueWorkers > 0 ? (severeComplaints / uniqueWorkers) * 100 : 0;

    res.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalReferrals,
        resolvedReferrals,
        pendingReferrals,
        uniqueWorkers,
        absenteeismRate: Math.round(absenteeismRate * 10) / 10,
      },
      charts: {
        topComplaints,
        emotionalDistribution,
        checkInTimeSeries,
        ergonomicRiskData,
      },
    });
  } catch (error) {
    console.error("Erro ao obter analytics:", error);
    res.status(500).json({ error: "Erro ao obter analytics" });
  }
});
