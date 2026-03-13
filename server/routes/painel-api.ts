/**
 * API REST para o Painel SESMT
 * Fornece dados em tempo real do banco PostgreSQL para o painel admin HTML.
 * Todas as rotas começam com /api/painel/
 */
import { Router, Request, Response } from "express";
import {
  employees,
  checkIns,
  userHydration,
  complaints,
  challengeProgress,
  bloodPressureRecords,
  gamificationData,
  users,
} from "../../drizzle/schema";
import { eq, desc, gte, and, sql, lte } from "drizzle-orm";
import { getDb } from "../db";

const router = Router();

// ========== CREDENCIAIS DO PAINEL ==========
const PAINEL_CREDENTIALS = [
  { email: "admin@canteiro.com", password: "admin123", name: "Administrador", role: "admin" },
  { email: "sesmt@empresa.com", password: "sesmt2024", name: "SESMT", role: "sesmt" },
  { email: "denise.silva@mip.com.br", password: "Canteiro@2024", name: "Denise Silva", role: "sesmt" },
  { email: "estefane.mendes@mip.com.br", password: "Canteiro@2024", name: "Estefane Mendes", role: "sesmt" },
];

// Tokens de sessão em memória (simples, sem JWT)
const activeSessions: Map<string, { email: string; name: string; role: string; createdAt: number }> = new Map();

function generateToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random().toString(36)}`).toString("base64");
}

function validateToken(token: string): boolean {
  const session = activeSessions.get(token);
  if (!session) return false;
  // Token válido por 24h
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function authMiddleware(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
  if (!token || !validateToken(token)) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// ========== LOGIN ==========
router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = PAINEL_CREDENTIALS.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }
  const token = generateToken();
  activeSessions.set(token, { email: user.email, name: user.name, role: user.role, createdAt: Date.now() });
  res.json({ success: true, token, name: user.name, role: user.role, email: user.email });
});

// ========== DASHBOARD RESUMO ==========
router.get("/dashboard", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { startDate, endDate, turno } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Funcionários ativos (com filtro de turno)
    let empQuery: any = db.select().from(employees).where(eq(employees.isActive, 1));
    const allEmployees = await empQuery;
    const filteredEmployees = turno && turno !== "todos"
      ? allEmployees.filter((e: any) => e.turno === turno)
      : allEmployees;
    const employeeIds = filteredEmployees.map((e: any) => e.userId).filter(Boolean);
    const employeeCount = filteredEmployees.length;

    // Check-ins no período
    let checkInData: any[] = [];
    if (employeeIds.length > 0) {
      checkInData = await db.select().from(checkIns)
        .where(and(
          gte(checkIns.date as any, start.toISOString().split("T")[0]),
          lte(checkIns.date as any, end.toISOString().split("T")[0])
        ));
      if (turno && turno !== "todos") {
        checkInData = checkInData.filter((c: any) => employeeIds.includes(c.userId));
      }
    } else if (!turno || turno === "todos") {
      checkInData = await db.select().from(checkIns)
        .where(and(
          gte(checkIns.date as any, start.toISOString().split("T")[0]),
          lte(checkIns.date as any, end.toISOString().split("T")[0])
        ));
    }

    // Hidratação
    let hydrationData: any[] = [];
    if (!turno || turno === "todos") {
      hydrationData = await db.select().from(userHydration)
        .where(and(
          gte(userHydration.date as any, start.toISOString().split("T")[0]),
          lte(userHydration.date as any, end.toISOString().split("T")[0])
        ));
    } else if (employeeIds.length > 0) {
      hydrationData = await db.select().from(userHydration)
        .where(and(
          gte(userHydration.date as any, start.toISOString().split("T")[0]),
          lte(userHydration.date as any, end.toISOString().split("T")[0])
        ));
      hydrationData = hydrationData.filter((h: any) => employeeIds.includes(h.userId));
    }

    // Queixas
    let complaintsData: any[] = [];
    if (!turno || turno === "todos") {
      complaintsData = await db.select().from(complaints)
        .where(and(
          gte(complaints.date as any, start.toISOString().split("T")[0]),
          lte(complaints.date as any, end.toISOString().split("T")[0])
        ));
    } else if (employeeIds.length > 0) {
      complaintsData = await db.select().from(complaints)
        .where(and(
          gte(complaints.date as any, start.toISOString().split("T")[0]),
          lte(complaints.date as any, end.toISOString().split("T")[0])
        ));
      complaintsData = complaintsData.filter((c: any) => employeeIds.includes(c.userId));
    }

    // Pressão arterial
    let bpData: any[] = [];
    if (!turno || turno === "todos") {
      bpData = await db.select().from(bloodPressureRecords)
        .where(and(
          gte(bloodPressureRecords.date as any, start.toISOString().split("T")[0]),
          lte(bloodPressureRecords.date as any, end.toISOString().split("T")[0])
        ));
    } else if (employeeIds.length > 0) {
      bpData = await db.select().from(bloodPressureRecords)
        .where(and(
          gte(bloodPressureRecords.date as any, start.toISOString().split("T")[0]),
          lte(bloodPressureRecords.date as any, end.toISOString().split("T")[0])
        ));
      bpData = bpData.filter((b: any) => employeeIds.includes(b.userId));
    }

    // Desafios ativos
    let challengeData: any[] = [];
    if (!turno || turno === "todos") {
      challengeData = await db.select().from(challengeProgress)
        .where(eq(challengeProgress.completed, 0));
    } else if (employeeIds.length > 0) {
      challengeData = await db.select().from(challengeProgress)
        .where(eq(challengeProgress.completed, 0));
      challengeData = challengeData.filter((c: any) => employeeIds.includes(c.userId));
    }

    // Calcular hidratação média
    const hydAvg = hydrationData.length > 0
      ? Math.round(hydrationData.reduce((sum: number, h: any) => sum + (h.totalMl / h.goalMl * 100), 0) / hydrationData.length)
      : 0;

    // Check-ins de hoje
    const today = new Date().toISOString().split("T")[0];
    const todayCheckIns = checkInData.filter((c: any) => {
      const d = typeof c.date === "string" ? c.date.split("T")[0] : new Date(c.date).toISOString().split("T")[0];
      return d === today;
    });

    res.json({
      success: true,
      employeeCount,
      checkInsTotal: checkInData.length,
      checkInsToday: todayCheckIns.length,
      hydrationAvg: hydAvg,
      complaintsTotal: complaintsData.length,
      bpMonitored: bpData.length,
      challengesActive: challengeData.length,
      checkInsByMood: {
        bem: checkInData.filter((c: any) => c.mood === "bem").length,
        dorLeve: checkInData.filter((c: any) => c.mood === "dor-leve").length,
        dorForte: checkInData.filter((c: any) => c.mood === "dor-forte").length,
      },
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

// ========== LISTA DE FUNCIONÁRIOS ==========
router.get("/employees", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { turno } = req.query;
    let empList: any[] = await db.select().from(employees)
      .where(eq(employees.isActive, 1))
      .orderBy(desc(employees.createdAt));

    if (turno && turno !== "todos") {
      empList = empList.filter((e: any) => e.turno === turno);
    }

    // Buscar dados de gamificação para cada funcionário
    const result = await Promise.all(empList.map(async (emp: any) => {
      let points = 0;
      let streak = 0;
      if (emp.userId) {
        const gamData = await db.select().from(gamificationData)
          .where(eq(gamificationData.userId, emp.userId)).limit(1);
        if (gamData[0]) {
          points = gamData[0].totalPoints || 0;
          streak = gamData[0].currentStreak || 0;
        }
      }
      return {
        id: emp.id,
        userId: emp.userId,
        name: emp.name,
        matricula: emp.matricula,
        department: emp.department,
        position: emp.position,
        turno: emp.turno,
        workType: emp.workType,
        lastLogin: emp.lastLogin,
        createdAt: emp.createdAt,
        points,
        streak,
      };
    }));

    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error("Erro ao listar funcionários:", error);
    res.status(500).json({ error: "Erro ao listar funcionários" });
  }
});

// ========== DETALHE DO FUNCIONÁRIO ==========
router.get("/employees/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const empId = parseInt(req.params.id);
    const empList = await db.select().from(employees).where(eq(employees.id, empId)).limit(1);
    const emp = empList[0];
    if (!emp) return res.status(404).json({ error: "Funcionário não encontrado" });

    let checkInHistory: any[] = [];
    let hydrationHistory: any[] = [];
    let complaintHistory: any[] = [];
    let bpHistory: any[] = [];
    let challengeHistory: any[] = [];
    let gamData: any = null;

    if (emp.userId) {
      checkInHistory = await db.select().from(checkIns)
        .where(eq(checkIns.userId, emp.userId))
        .orderBy(desc(checkIns.date)).limit(30);

      hydrationHistory = await db.select().from(userHydration)
        .where(eq(userHydration.userId, emp.userId))
        .orderBy(desc(userHydration.date)).limit(30);

      complaintHistory = await db.select().from(complaints)
        .where(eq(complaints.userId, emp.userId))
        .orderBy(desc(complaints.date)).limit(20);

      bpHistory = await db.select().from(bloodPressureRecords)
        .where(eq(bloodPressureRecords.userId, emp.userId))
        .orderBy(desc(bloodPressureRecords.date)).limit(20);

      challengeHistory = await db.select().from(challengeProgress)
        .where(eq(challengeProgress.userId, emp.userId))
        .orderBy(desc(challengeProgress.createdAt)).limit(10);

      const gamList = await db.select().from(gamificationData)
        .where(eq(gamificationData.userId, emp.userId)).limit(1);
      gamData = gamList[0] || null;
    }

    res.json({
      success: true,
      employee: {
        ...emp,
        checkIns: checkInHistory,
        hydration: hydrationHistory,
        complaints: complaintHistory,
        bloodPressure: bpHistory,
        challenges: challengeHistory,
        gamification: gamData,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar funcionário:", error);
    res.status(500).json({ error: "Erro ao buscar funcionário" });
  }
});

// ========== CHECK-INS ==========
router.get("/checkins", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { startDate, endDate, turno } = req.query;
    const start = startDate ? (startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const end = endDate ? (endDate as string) : new Date().toISOString().split("T")[0];

    let checkInData = await db.select({
      id: checkIns.id,
      userId: checkIns.userId,
      date: checkIns.date,
      mood: checkIns.mood,
      symptoms: checkIns.symptoms,
      notes: checkIns.notes,
      createdAt: checkIns.createdAt,
      employeeName: employees.name,
      employeeMatricula: employees.matricula,
      employeeTurno: employees.turno,
    })
      .from(checkIns)
      .leftJoin(employees, eq(checkIns.userId, employees.userId))
      .where(and(
        gte(checkIns.date as any, start),
        lte(checkIns.date as any, end)
      ))
      .orderBy(desc(checkIns.date));

    if (turno && turno !== "todos") {
      checkInData = checkInData.filter((c: any) => c.employeeTurno === turno);
    }

    res.json({ success: true, data: checkInData, total: checkInData.length });
  } catch (error) {
    console.error("Erro ao listar check-ins:", error);
    res.status(500).json({ error: "Erro ao listar check-ins" });
  }
});

// ========== HIDRATAÇÃO ==========
router.get("/hydration", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { startDate, endDate, turno } = req.query;
    const start = startDate ? (startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const end = endDate ? (endDate as string) : new Date().toISOString().split("T")[0];

    let hydData = await db.select({
      id: userHydration.id,
      userId: userHydration.userId,
      date: userHydration.date,
      cupsConsumed: userHydration.cupsConsumed,
      totalMl: userHydration.totalMl,
      goalMl: userHydration.goalMl,
      employeeName: employees.name,
      employeeMatricula: employees.matricula,
      employeeTurno: employees.turno,
    })
      .from(userHydration)
      .leftJoin(employees, eq(userHydration.userId, employees.userId))
      .where(and(
        gte(userHydration.date as any, start),
        lte(userHydration.date as any, end)
      ))
      .orderBy(desc(userHydration.date));

    if (turno && turno !== "todos") {
      hydData = hydData.filter((h: any) => h.employeeTurno === turno);
    }

    res.json({ success: true, data: hydData, total: hydData.length });
  } catch (error) {
    console.error("Erro ao listar hidratação:", error);
    res.status(500).json({ error: "Erro ao listar hidratação" });
  }
});

// ========== QUEIXAS ==========
router.get("/complaints", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { startDate, endDate, turno } = req.query;
    const start = startDate ? (startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const end = endDate ? (endDate as string) : new Date().toISOString().split("T")[0];

    let complaintData = await db.select({
      id: complaints.id,
      userId: complaints.userId,
      date: complaints.date,
      complaint: complaints.complaint,
      severity: complaints.severity,
      resolved: complaints.resolved,
      notes: complaints.notes,
      createdAt: complaints.createdAt,
      employeeName: employees.name,
      employeeMatricula: employees.matricula,
      employeeTurno: employees.turno,
    })
      .from(complaints)
      .leftJoin(employees, eq(complaints.userId, employees.userId))
      .where(and(
        gte(complaints.date as any, start),
        lte(complaints.date as any, end)
      ))
      .orderBy(desc(complaints.date));

    if (turno && turno !== "todos") {
      complaintData = complaintData.filter((c: any) => c.employeeTurno === turno);
    }

    res.json({ success: true, data: complaintData, total: complaintData.length });
  } catch (error) {
    console.error("Erro ao listar queixas:", error);
    res.status(500).json({ error: "Erro ao listar queixas" });
  }
});

// ========== DESAFIOS ==========
router.get("/challenges", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { turno } = req.query;

    let challengeData = await db.select({
      id: challengeProgress.id,
      userId: challengeProgress.userId,
      challengeId: challengeProgress.challengeId,
      currentValue: challengeProgress.currentValue,
      targetValue: challengeProgress.targetValue,
      completed: challengeProgress.completed,
      startDate: challengeProgress.startDate,
      endDate: challengeProgress.endDate,
      completedAt: challengeProgress.completedAt,
      employeeName: employees.name,
      employeeMatricula: employees.matricula,
      employeeTurno: employees.turno,
    })
      .from(challengeProgress)
      .leftJoin(employees, eq(challengeProgress.userId, employees.userId))
      .orderBy(desc(challengeProgress.createdAt));

    if (turno && turno !== "todos") {
      challengeData = challengeData.filter((c: any) => c.employeeTurno === turno);
    }

    res.json({ success: true, data: challengeData, total: challengeData.length });
  } catch (error) {
    console.error("Erro ao listar desafios:", error);
    res.status(500).json({ error: "Erro ao listar desafios" });
  }
});

// ========== RANKING ==========
router.get("/ranking", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { turno } = req.query;

    let empList: any[] = await db.select().from(employees).where(eq(employees.isActive, 1));
    if (turno && turno !== "todos") {
      empList = empList.filter((e: any) => e.turno === turno);
    }

    const ranking = await Promise.all(empList.map(async (emp: any) => {
      let points = 0;
      let streak = 0;
      let checkInCount = 0;
      let challengeCount = 0;

      if (emp.userId) {
        const gamList = await db.select().from(gamificationData)
          .where(eq(gamificationData.userId, emp.userId)).limit(1);
        if (gamList[0]) {
          points = gamList[0].totalPoints || 0;
          streak = gamList[0].currentStreak || 0;
        }

        const ciList = await db.select().from(checkIns)
          .where(eq(checkIns.userId, emp.userId));
        checkInCount = ciList.length;

        const chList = await db.select().from(challengeProgress)
          .where(and(eq(challengeProgress.userId, emp.userId), eq(challengeProgress.completed, 1)));
        challengeCount = chList.length;
      }

      return {
        id: emp.id,
        name: emp.name,
        matricula: emp.matricula,
        department: emp.department,
        turno: emp.turno,
        points,
        streak,
        checkInCount,
        challengeCount,
      };
    }));

    ranking.sort((a, b) => b.points - a.points);

    res.json({ success: true, data: ranking.slice(0, 20), total: ranking.length });
  } catch (error) {
    console.error("Erro ao gerar ranking:", error);
    res.status(500).json({ error: "Erro ao gerar ranking" });
  }
});

// ========== PRESSÃO ARTERIAL ==========
router.get("/blood-pressure", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { startDate, endDate, turno } = req.query;
    const start = startDate ? (startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const end = endDate ? (endDate as string) : new Date().toISOString().split("T")[0];

    let bpData = await db.select({
      id: bloodPressureRecords.id,
      userId: bloodPressureRecords.userId,
      date: bloodPressureRecords.date,
      systolic: bloodPressureRecords.systolic,
      diastolic: bloodPressureRecords.diastolic,
      classification: bloodPressureRecords.classification,
      employeeName: employees.name,
      employeeMatricula: employees.matricula,
      employeeTurno: employees.turno,
    })
      .from(bloodPressureRecords)
      .leftJoin(employees, eq(bloodPressureRecords.userId, employees.userId))
      .where(and(
        gte(bloodPressureRecords.date as any, start),
        lte(bloodPressureRecords.date as any, end)
      ))
      .orderBy(desc(bloodPressureRecords.date));

    if (turno && turno !== "todos") {
      bpData = bpData.filter((b: any) => b.employeeTurno === turno);
    }

    res.json({ success: true, data: bpData, total: bpData.length });
  } catch (error) {
    console.error("Erro ao listar pressão:", error);
    res.status(500).json({ error: "Erro ao listar pressão arterial" });
  }
});

// ========== REGISTRO DE FUNCIONÁRIO (chamado pelo app ao cadastrar) ==========
// Esta rota é pública (sem authMiddleware) pois é chamada pelo app do trabalhador
router.post("/register-employee", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, name, turno, weight, height, workType, position, department } = req.body;

    if (!matricula || !name) {
      return res.status(400).json({ error: "Matrícula e nome são obrigatórios" });
    }

    // Verificar se já existe
    const existing = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);

    if (existing[0]) {
      // Atualizar dados existentes
      await db.update(employees)
        .set({
          name: name.trim(),
          turno: turno || existing[0].turno,
          weight: weight ? parseInt(weight) : existing[0].weight,
          height: height ? parseInt(height) : existing[0].height,
          workType: workType || existing[0].workType,
          position: position || existing[0].position,
          department: department || existing[0].department,
          lastLogin: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(employees.matricula, matricula.trim()));

      return res.json({
        success: true,
        action: "updated",
        employeeId: existing[0].id,
        message: "Dados do funcionário atualizados",
      });
    }

    // Criar workerId único anônimo
    const workerId = `worker_${matricula.trim()}_${Date.now()}`;

    // Inserir novo funcionário
    const result = await db.insert(employees).values({
      matricula: matricula.trim(),
      workerId,
      name: name.trim(),
      turno: turno || "diurno",
      weight: weight ? parseInt(weight) : null,
      height: height ? parseInt(height) : null,
      workType: workType || "moderado",
      position: position || "",
      department: department || "",
      isActive: 1,
      lastLogin: new Date(),
    });

    const newId = (result as any).insertId || (result as any)[0]?.insertId;

    console.log(`[API] Novo funcionário cadastrado: ${name} (matrícula: ${matricula})`);

    res.json({
      success: true,
      action: "created",
      employeeId: newId,
      workerId,
      message: "Funcionário cadastrado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao registrar funcionário:", error);
    res.status(500).json({ error: "Erro ao registrar funcionário" });
  }
});

// ========== EVOLUÇÃO MENSAL (para gráfico de linha) ==========
router.get("/monthly-evolution", authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { turno, months = "6" } = req.query;
    const monthsBack = parseInt(months as string) || 6;

    // Gerar array dos últimos N meses
    const monthsData: any[] = [];
    const now = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.toISOString().split("T")[0];
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

      // Buscar funcionários (com filtro de turno)
      let empList: any[] = await db.select().from(employees).where(eq(employees.isActive, 1));
      if (turno && turno !== "todos") {
        empList = empList.filter((e: any) => e.turno === turno);
      }
      const empIds = empList.map((e: any) => e.userId).filter(Boolean);

      // Check-ins no mês
      let ciData = await db.select().from(checkIns)
        .where(and(
          gte(checkIns.date as any, monthStart),
          lte(checkIns.date as any, monthEnd)
        ));
      if (turno && turno !== "todos" && empIds.length > 0) {
        ciData = ciData.filter((c: any) => empIds.includes(c.userId));
      }

      // Hidratação no mês
      let hydData = await db.select().from(userHydration)
        .where(and(
          gte(userHydration.date as any, monthStart),
          lte(userHydration.date as any, monthEnd)
        ));
      if (turno && turno !== "todos" && empIds.length > 0) {
        hydData = hydData.filter((h: any) => empIds.includes(h.userId));
      }
      const hydAvg = hydData.length > 0
        ? Math.round(hydData.reduce((s: number, h: any) => s + (h.totalMl / (h.goalMl || 2000) * 100), 0) / hydData.length)
        : 0;

      // Queixas no mês
      let compData = await db.select().from(complaints)
        .where(and(
          gte(complaints.date as any, monthStart),
          lte(complaints.date as any, monthEnd)
        ));
      if (turno && turno !== "todos" && empIds.length > 0) {
        compData = compData.filter((c: any) => empIds.includes(c.userId));
      }

      monthsData.push({
        month: monthLabel,
        monthStart,
        monthEnd,
        checkIns: ciData.length,
        hydrationAvg: hydAvg,
        complaints: compData.length,
        employees: empList.length,
      });
    }

    res.json({ success: true, data: monthsData });
  } catch (error) {
    console.error("Erro na evolução mensal:", error);
    res.status(500).json({ error: "Erro ao calcular evolução mensal" });
  }
});

// ========== SINCRONIZAÇÃO DE CHECK-IN (chamado pelo app ao fazer check-in) ==========
// Esta rota é pública (sem authMiddleware) pois é chamada pelo app do trabalhador
router.post("/sync-checkin", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, date, status, mood, symptoms, notes } = req.body;
    if (!matricula || !date) {
      return res.status(400).json({ error: "Matrícula e data são obrigatórias" });
    }

    // Buscar o funcionário pelo número de matrícula
    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp || !emp.userId) {
      return res.status(404).json({ error: "Funcionário não encontrado. Faça login primeiro." });
    }

    // Verificar se já existe check-in para essa data
    const existing = await db.select().from(checkIns)
      .where(and(eq(checkIns.userId, emp.userId), eq(checkIns.date as any, date))).limit(1);

    if (existing[0]) {
      // Atualizar check-in existente
      await db.update(checkIns)
        .set({
          mood: mood || status || existing[0].mood,
          symptoms: symptoms ? JSON.stringify(symptoms) : existing[0].symptoms,
          notes: notes || existing[0].notes,
        })
        .where(and(eq(checkIns.userId, emp.userId), eq(checkIns.date as any, date)));
      return res.json({ success: true, action: "updated", message: "Check-in atualizado" });
    }

    // Inserir novo check-in
    await db.insert(checkIns).values({
      userId: emp.userId,
      date,
      mood: mood || status || "ok",
      symptoms: symptoms ? JSON.stringify(symptoms) : null,
      notes: notes || null,
    });

    console.log(`[API] Check-in sincronizado: ${emp.name} (${date}) - ${mood || status}`);
    res.json({ success: true, action: "created", message: "Check-in sincronizado" });
  } catch (error) {
    console.error("Erro ao sincronizar check-in:", error);
    res.status(500).json({ error: "Erro ao sincronizar check-in" });
  }
});

// ========== SINCRONIZAÇÃO DE HIDRATAÇÃO (chamado pelo app ao registrar água) ==========
router.post("/sync-hydration", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, date, waterIntake, glassesConsumed, goal } = req.body;
    if (!matricula || !date) {
      return res.status(400).json({ error: "Matrícula e data são obrigatórias" });
    }

    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp || !emp.userId) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    // Verificar se já existe registro para essa data
    const existing = await db.select().from(userHydration)
      .where(and(eq(userHydration.userId, emp.userId), eq(userHydration.date as any, date))).limit(1);

    if (existing[0]) {
      await db.update(userHydration)
        .set({
          cupsConsumed: glassesConsumed || existing[0].cupsConsumed,
          totalMl: waterIntake || existing[0].totalMl,
          goalMl: goal || existing[0].goalMl,
          updatedAt: new Date(),
        })
        .where(and(eq(userHydration.userId, emp.userId), eq(userHydration.date as any, date)));
      return res.json({ success: true, action: "updated", message: "Hidratação atualizada" });
    }

    await db.insert(userHydration).values({
      userId: emp.userId,
      date,
      cupsConsumed: glassesConsumed || 0,
      totalMl: waterIntake || 0,
      goalMl: goal || 2000,
    });

    console.log(`[API] Hidratação sincronizada: ${emp.name} (${date}) - ${waterIntake}ml`);
    res.json({ success: true, action: "created", message: "Hidratação sincronizada" });
  } catch (error) {
    console.error("Erro ao sincronizar hidratação:", error);
    res.status(500).json({ error: "Erro ao sincronizar hidratação" });
  }
});

// ========== SINCRONIZAÇÃO DE QUEIXAS (chamado pelo app ao reportar sintomas) ==========
router.post("/sync-complaint", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, date, symptoms, details, severity } = req.body;
    if (!matricula || !date || !symptoms) {
      return res.status(400).json({ error: "Matrícula, data e sintomas são obrigatórios" });
    }

    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp || !emp.userId) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    const symptomList = Array.isArray(symptoms) ? symptoms : [symptoms];
    const complaintText = symptomList.join(", ");

    await db.insert(complaints).values({
      userId: emp.userId,
      date,
      complaint: complaintText,
      severity: severity || "leve",
      notes: details || null,
      resolved: 0,
    });

    console.log(`[API] Queixa sincronizada: ${emp.name} (${date}) - ${complaintText}`);
    res.json({ success: true, action: "created", message: "Queixa sincronizada" });
  } catch (error) {
    console.error("Erro ao sincronizar queixa:", error);
    res.status(500).json({ error: "Erro ao sincronizar queixa" });
  }
});

// ========== SINCRONIZAÇÃO DE PRESSÃO ARTERIAL (chamado pelo app ao registrar pressão) ==========
router.post("/sync-pressure", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, date, systolic, diastolic, classification } = req.body;
    if (!matricula || !date || !systolic || !diastolic) {
      return res.status(400).json({ error: "Matrícula, data e valores de pressão são obrigatórios" });
    }

    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp || !emp.userId) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    await db.insert(bloodPressureRecords).values({
      userId: emp.userId,
      date,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      classification: classification || "normal",
    });

    console.log(`[API] Pressão sincronizada: ${emp.name} (${date}) - ${systolic}/${diastolic}`);
    res.json({ success: true, action: "created", message: "Pressão arterial sincronizada" });
  } catch (error) {
    console.error("Erro ao sincronizar pressão:", error);
    res.status(500).json({ error: "Erro ao sincronizar pressão arterial" });
  }
});

// ========== SINCRONIZAÇÃO DE DESAFIOS (chamado pelo app ao aceitar/concluir desafio) ==========
router.post("/sync-challenge", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, challengeId, title, status, progress, currentValue, goalValue, startDate, completedDate } = req.body;
    if (!matricula || !challengeId) {
      return res.status(400).json({ error: "Matrícula e ID do desafio são obrigatórios" });
    }

    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp || !emp.userId) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    const existing = await db.select().from(challengeProgress)
      .where(and(eq(challengeProgress.userId, emp.userId), eq(challengeProgress.challengeId, challengeId)))
      .limit(1);

    const isCompleted = status === 'completed' ? 1 : 0;
    if (existing.length > 0) {
      await db.update(challengeProgress)
        .set({
          currentValue: currentValue || 0,
          completed: isCompleted,
          completedAt: completedDate ? new Date(completedDate) : null,
        })
        .where(and(eq(challengeProgress.userId, emp.userId), eq(challengeProgress.challengeId, challengeId)));
      res.json({ success: true, action: "updated", message: "Desafio atualizado" });
    } else {
      const endDateObj = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const startDateObj = startDate ? new Date(startDate) : new Date();
      await db.insert(challengeProgress).values({
        userId: emp.userId,
        challengeId,
        currentValue: currentValue || 0,
        targetValue: goalValue || 100,
        completed: isCompleted,
        startDate: startDateObj,
        endDate: endDateObj,
        completedAt: completedDate ? new Date(completedDate) : null,
      });
      res.json({ success: true, action: "created", message: "Desafio registrado" });
    }
  } catch (error) {
    console.error("Erro ao sincronizar desafio:", error);
    res.status(500).json({ error: "Erro ao sincronizar desafio" });
  }
});

// ========== COMUNICADOS — CRUD para o painel admin ==========
// Armazenamento em memória (pode ser migrado para banco futuramente)
interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  category: "urgente" | "informativo" | "desafio" | "saude" | "geral";
  createdAt: string;
  createdBy?: string;
  expiresAt?: string;
}

const announcementsStore: Announcement[] = [
  {
    id: "welcome-1",
    title: "Bem-vindo ao Canteiro Saudável!",
    body: "Este espaço é dedicado a comunicados importantes da equipe de saúde. Aqui você receberá avisos sobre campanhas de vacinação, lembretes de saúde e novidades do programa.",
    category: "informativo",
    createdAt: new Date().toISOString(),
    createdBy: "SESMT",
  },
];

// GET — listar comunicados (acessível pelo app sem autenticação)
router.get("/announcements", (req: Request, res: Response) => {
  const active = announcementsStore.filter(a => {
    if (!a.expiresAt) return true;
    return new Date(a.expiresAt) > new Date();
  });
  res.json({ announcements: active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

// POST — criar comunicado (apenas admin)
router.post("/announcements", authMiddleware, (req: Request, res: Response) => {
  const { title, body, category, imageUrl, expiresAt } = req.body;
  if (!title || !body || !category) {
    return res.status(400).json({ error: "Título, corpo e categoria são obrigatórios" });
  }
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
  const session = activeSessions.get(token);
  const newAnnouncement: Announcement = {
    id: `ann-${Date.now()}`,
    title,
    body,
    category,
    imageUrl: imageUrl || undefined,
    expiresAt: expiresAt || undefined,
    createdAt: new Date().toISOString(),
    createdBy: session?.name || "Admin",
  };
  announcementsStore.unshift(newAnnouncement);
  console.log(`[API] Comunicado criado: "${title}" por ${newAnnouncement.createdBy}`);
  res.json({ success: true, announcement: newAnnouncement });
});

// DELETE — remover comunicado (apenas admin)
router.delete("/announcements/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = announcementsStore.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Comunicado não encontrado" });
  announcementsStore.splice(idx, 1);
  res.json({ success: true, message: "Comunicado removido" });
});

// POST — marcar comunicado como lido (chamado pelo app)
router.post("/sync-announcement-read", async (req: Request, res: Response) => {
  const { matricula, announcementId, readAt } = req.body;
  // Apenas loga — pode ser expandido para tabela de leituras
  console.log(`[API] Comunicado lido: ${matricula} leu ${announcementId} em ${readAt}`);
  res.json({ success: true });
});

// ========== SINCRONIZAÇÃO DE COMORBIDADES (triagem de saúde) ==========
router.post("/sync-comorbidity", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados não disponível" });

    const { matricula, date, weight, height, imc, imcStatus, glucoseLevel, riskFlags } = req.body;
    if (!matricula) return res.status(400).json({ error: "Matrícula é obrigatória" });

    const empList = await db.select().from(employees)
      .where(eq(employees.matricula, matricula.trim())).limit(1);
    const emp = empList[0];
    if (!emp) return res.status(404).json({ error: "Funcionário não encontrado" });

    // Atualizar dados de saúde no perfil do funcionário
    const updateData: Record<string, unknown> = {};
    if (weight) updateData.weight = weight;
    if (height) updateData.height = height;
    if (imc) updateData.imc = imc;
    if (imcStatus) updateData.imcStatus = imcStatus;
    if (riskFlags) updateData.riskFlags = JSON.stringify(riskFlags);

    if (Object.keys(updateData).length > 0) {
      await db.update(employees).set(updateData).where(eq(employees.matricula, matricula.trim()));
    }

    console.log(`[API] Triagem sincronizada: ${emp.name} - IMC: ${imc} (${imcStatus})`);
    res.json({ success: true, message: "Triagem de saúde sincronizada" });
  } catch (error) {
    console.error("Erro ao sincronizar triagem:", error);
    res.status(500).json({ error: "Erro ao sincronizar triagem" });
  }
});

export default router;
