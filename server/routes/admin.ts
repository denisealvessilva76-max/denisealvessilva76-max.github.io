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
