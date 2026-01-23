import { Router } from "express";
import { getDb } from "../db";
import { hydrationRecords } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

const router = Router();

/**
 * Sincronizar registro de hidratação
 */
router.post("/sync", async (req, res) => {
  try {
    const { date, waterIntake, glassesConsumed, dailyGoal, weight, height, workType } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (!date || waterIntake === undefined || glassesConsumed === undefined || !dailyGoal) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Erro ao conectar ao banco" });
    }

    // Verificar se já existe registro para esta data
    const existing = await db
      .select()
      .from(hydrationRecords)
      .where(and(eq(hydrationRecords.workerId, userId.toString()), eq(hydrationRecords.date, date)))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar registro existente
      await db
        .update(hydrationRecords)
        .set({
          waterIntake,
          glassesConsumed,
          dailyGoal,
          weight: weight || null,
          height: height || null,
          workType: workType || null,
        })
        .where(eq(hydrationRecords.id, existing[0].id));
    } else {
      // Criar novo registro
      await db.insert(hydrationRecords).values({
        workerId: userId.toString(),
        date,
        waterIntake,
        glassesConsumed,
        dailyGoal,
        weight: weight || null,
        height: height || null,
        workType: workType || null,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao sincronizar hidratação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * Obter relatório mensal de hidratação (admin)
 */
router.get("/monthly-report", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Mês e ano são obrigatórios" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Erro ao conectar ao banco" });
    }

    // Calcular primeiro e último dia do mês
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    // Buscar todos os registros do mês
    const records = await db
      .select()
      .from(hydrationRecords)
      .where(
        sql`${hydrationRecords.date} >= ${startDate} AND ${hydrationRecords.date} <= ${endDate}`
      )
      .orderBy(desc(hydrationRecords.date));

    // Agrupar por trabalhador
    const workerStats: Record<
      string,
      {
        workerId: string;
        totalDays: number;
        totalWater: number;
        avgWater: number;
        avgGoal: number;
        compliance: number; // % de dias que atingiu a meta
        weight?: number;
        height?: number;
        workType?: string;
        records: any[];
      }
    > = {};

    records.forEach((record: any) => {
      if (!workerStats[record.workerId]) {
        workerStats[record.workerId] = {
          workerId: record.workerId,
          totalDays: 0,
          totalWater: 0,
          avgWater: 0,
          avgGoal: 0,
          compliance: 0,
          weight: record.weight || undefined,
          height: record.height || undefined,
          workType: record.workType || undefined,
          records: [],
        };
      }

      const stats = workerStats[record.workerId];
      stats.totalDays++;
      stats.totalWater += record.waterIntake;
      stats.records.push(record);
    });

    // Calcular médias e compliance
    Object.values(workerStats).forEach((stats) => {
      stats.avgWater = Math.round(stats.totalWater / stats.totalDays);
      stats.avgGoal = Math.round(
        stats.records.reduce((sum, r) => sum + r.dailyGoal, 0) / stats.records.length
      );
      const daysMetGoal = stats.records.filter((r) => r.waterIntake >= r.dailyGoal).length;
      stats.compliance = Math.round((daysMetGoal / stats.totalDays) * 100);
    });

    // Ordenar por compliance (pior primeiro)
    const sortedWorkers = Object.values(workerStats).sort((a, b) => a.compliance - b.compliance);

    // Estatísticas gerais
    const totalWorkers = sortedWorkers.length;
    const avgCompliance = Math.round(
      sortedWorkers.reduce((sum, w) => sum + w.compliance, 0) / totalWorkers
    );
    const workersAtRisk = sortedWorkers.filter((w) => w.compliance < 50).length;

    res.json({
      month,
      year,
      startDate,
      endDate,
      summary: {
        totalWorkers,
        avgCompliance,
        workersAtRisk,
      },
      workers: sortedWorkers,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
