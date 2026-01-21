import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  healthDataSync,
  aggregatedHealthData,
  weeklyReports,
  monthlyReports,
} from "../../drizzle/schema";
import { eq, gte, lte, desc } from "drizzle-orm";

const router = Router();

/**
 * POST /api/health-data/sync
 * Receber dados de saúde do app e sincronizar com banco de dados
 */
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { workerId, data } = req.body;

    if (!workerId || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Inserir dados de sincronização
    for (const item of data) {
      await db.insert(healthDataSync).values({
        workerId,
        timestamp: new Date(item.timestamp),
        checkInStatus: item.checkIn?.status,
        checkInDate: item.checkIn?.date,
        pressureSystolic: item.pressure?.systolic,
        pressureDiastolic: item.pressure?.diastolic,
        pressureDate: item.pressure?.date,
        symptoms: item.symptoms?.symptoms ? JSON.stringify(item.symptoms.symptoms) : null,
        symptomsDate: item.symptoms?.date,
      });
    }

    // Recalcular dados agregados
    await recalculateAggregatedData();

    res.json({ success: true, message: "Dados sincronizados com sucesso" });
  } catch (error) {
    console.error("Erro ao sincronizar dados:", error);
    res.status(500).json({ error: "Erro ao sincronizar dados" });
  }
});

/**
 * GET /api/health-data/dashboard
 * Obter dados do dashboard para SESMT
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obter dados agregados dos últimos 30 dias
    const data = await db
      .select()
      .from(aggregatedHealthData)
      .where(gte(aggregatedHealthData.date, thirtyDaysAgo))
      .orderBy(desc(aggregatedHealthData.date));

    // Calcular estatísticas
    const totalCheckIns = data.reduce((sum: number, d: any) => sum + d.totalCheckIns, 0);
    const totalWorkers = Math.max(...data.map((d: any) => d.totalWorkers));

    // Calcular distribuição de bem-estar
    const wellnessDistribution = {
      bem: data.reduce((sum: number, d: any) => sum + (d.checkInBem || 0), 0),
      dorLeve: data.reduce((sum: number, d: any) => sum + (d.checkInDorLeve || 0), 0),
      dorForte: data.reduce((sum: number, d: any) => sum + (d.checkInDorForte || 0), 0),
    };

    // Calcular pressão média
    const avgPressure = {
      systolic:
        data.reduce((sum: number, d: any) => sum + (d.avgPressureSystolic || 0), 0) / data.length || 0,
      diastolic:
        data.reduce((sum: number, d: any) => sum + (d.avgPressureDiastolic || 0), 0) / data.length || 0,
    };

    // Calcular score de engajamento
    const engagementScore = totalWorkers > 0 ? (totalCheckIns / (totalWorkers * 30)) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: today.toISOString(),
        },
        stats: {
          totalActiveWorkers: totalWorkers,
          totalCheckIns,
          averageEngagement: Math.min(100, engagementScore),
          wellnessDistribution,
          averagePressure: avgPressure,
        },
        dailyData: data,
      },
    });
  } catch (error) {
    console.error("Erro ao obter dados do dashboard:", error);
    res.status(500).json({ error: "Erro ao obter dados do dashboard" });
  }
});

/**
 * GET /api/health-data/report/weekly
 * Obter relatório semanal
 */
router.get("/report/weekly", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const reports = await db
      .select()
      .from(weeklyReports)
      .orderBy(desc(weeklyReports.createdAt))
      .limit(12); // Últimas 12 semanas

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Erro ao obter relatório semanal:", error);
    res.status(500).json({ error: "Erro ao obter relatório semanal" });
  }
});

/**
 * GET /api/health-data/report/monthly
 * Obter relatório mensal
 */
router.get("/report/monthly", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const reports = await db
      .select()
      .from(monthlyReports)
      .orderBy(desc(monthlyReports.createdAt))
      .limit(12); // Últimos 12 meses

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Erro ao obter relatório mensal:", error);
    res.status(500).json({ error: "Erro ao obter relatório mensal" });
  }
});

/**
 * Função auxiliar para recalcular dados agregados
 */
async function recalculateAggregatedData() {
  try {
    const db = await getDb();
    if (!db) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obter todos os dados do dia
    const todayData = await db
      .select()
      .from(healthDataSync)
      .where(gte(healthDataSync.timestamp, today));

    if (todayData.length === 0) return;

    // Contar workers únicos
    const uniqueWorkers = new Set(todayData.map((d: any) => d.workerId)).size;

    // Contar check-ins
    const checkIns = todayData.filter((d: any) => d.checkInStatus);
    const checkInBem = checkIns.filter((d: any) => d.checkInStatus === "bem").length;
    const checkInDorLeve = checkIns.filter((d: any) => d.checkInStatus === "dor-leve").length;
    const checkInDorForte = checkIns.filter((d: any) => d.checkInStatus === "dor-forte").length;

    // Calcular pressão média
    const pressureReadings = todayData.filter((d) => d.pressureSystolic);
    const avgPressureSystolic =
      pressureReadings.reduce((sum: number, d: any) => sum + (d.pressureSystolic || 0), 0) /
        pressureReadings.length || 0;
    const avgPressureDiastolic =
      pressureReadings.reduce((sum: number, d: any) => sum + (d.pressureDiastolic || 0), 0) /
        pressureReadings.length || 0;

    // Inserir ou atualizar dados agregados
    try {
      await db
        .insert(aggregatedHealthData)
        .values({
          date: today,
          totalWorkers: uniqueWorkers,
          totalCheckIns: checkIns.length,
          checkInBem,
          checkInDorLeve,
          checkInDorForte,
          avgPressureSystolic: avgPressureSystolic.toString(),
          avgPressureDiastolic: avgPressureDiastolic.toString(),
        })
        .onDuplicateKeyUpdate({
          set: {
            totalWorkers: uniqueWorkers,
            totalCheckIns: checkIns.length,
            checkInBem,
            checkInDorLeve,
            checkInDorForte,
            avgPressureSystolic: avgPressureSystolic.toString(),
            avgPressureDiastolic: avgPressureDiastolic.toString(),
          },
        });
    } catch (error) {
      console.error("Erro ao inserir/atualizar dados agregados:", error);
    }
  } catch (error) {
    console.error("Erro ao recalcular dados agregados:", error);
  }
}

export default router;
