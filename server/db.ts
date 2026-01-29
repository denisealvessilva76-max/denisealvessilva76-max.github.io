import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, users,
  employees, InsertEmployee,
  checkIns, InsertCheckIn,
  userHydration, InsertUserHydration,
  bloodPressureRecords, InsertBloodPressureRecord,
  complaints, InsertComplaint,
  challengeProgress, InsertChallengeProgress,
  ergonomicsRecords, InsertErgonomicsRecord,
  mentalHealthRecords, InsertMentalHealthRecord,
  pushTokens, InsertPushToken,
  challengeNotifications, InsertChallengeNotification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== EMPLOYEES ====================

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.isActive, 1));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function getEmployeeByWorkerId(workerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.workerId, workerId)).limit(1);
  return result[0];
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(data);
  return result[0].insertId;
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(data).where(eq(employees.id, id));
}

// ==================== CHECK-INS ====================

export async function getCheckInsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns).where(eq(checkIns.userId, employeeId)).orderBy(desc(checkIns.createdAt));
}

export async function getAllCheckIns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns).orderBy(desc(checkIns.createdAt));
}

export async function createCheckIn(data: InsertCheckIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(checkIns).values(data);
  return result[0].insertId;
}

// ==================== HYDRATION ====================

export async function getHydrationByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userHydration).where(eq(userHydration.userId, employeeId)).orderBy(desc(userHydration.createdAt));
}

export async function getAllHydration() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userHydration).orderBy(desc(userHydration.createdAt));
}

export async function createHydration(data: InsertUserHydration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userHydration).values(data);
  return result[0].insertId;
}

export async function updateHydration(id: number, data: Partial<InsertUserHydration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userHydration).set(data).where(eq(userHydration.id, id));
}

// ==================== BLOOD PRESSURE ====================

export async function getBloodPressureByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bloodPressureRecords).where(eq(bloodPressureRecords.userId, employeeId)).orderBy(desc(bloodPressureRecords.createdAt));
}

export async function getAllBloodPressure() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bloodPressureRecords).orderBy(desc(bloodPressureRecords.createdAt));
}

export async function createBloodPressure(data: InsertBloodPressureRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bloodPressureRecords).values(data);
  return result[0].insertId;
}

// ==================== COMPLAINTS ====================

export async function getComplaintsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaints).where(eq(complaints.userId, employeeId)).orderBy(desc(complaints.createdAt));
}

export async function getAllComplaints() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaints).orderBy(desc(complaints.createdAt));
}

export async function createComplaint(data: InsertComplaint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(complaints).values(data);
  return result[0].insertId;
}

export async function updateComplaint(id: number, data: Partial<InsertComplaint>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(complaints).set(data).where(eq(complaints.id, id));
}

// ==================== CHALLENGES ====================

export async function getChallengesByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeProgress).where(eq(challengeProgress.userId, employeeId)).orderBy(desc(challengeProgress.createdAt));
}

export async function getAllChallenges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeProgress).orderBy(desc(challengeProgress.createdAt));
}

export async function createChallenge(data: InsertChallengeProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(challengeProgress).values(data);
  return result[0].insertId;
}

export async function updateChallenge(id: number, data: Partial<InsertChallengeProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(challengeProgress).set(data).where(eq(challengeProgress.id, id));
}

// ==================== ERGONOMICS ====================

export async function getErgonomicsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ergonomicsRecords).where(eq(ergonomicsRecords.employeeId, employeeId)).orderBy(desc(ergonomicsRecords.createdAt));
}

export async function getAllErgonomics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ergonomicsRecords).orderBy(desc(ergonomicsRecords.createdAt));
}

export async function createErgonomics(data: InsertErgonomicsRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ergonomicsRecords).values(data);
  return result[0].insertId;
}

// ==================== MENTAL HEALTH ====================

export async function getMentalHealthByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mentalHealthRecords).where(eq(mentalHealthRecords.employeeId, employeeId)).orderBy(desc(mentalHealthRecords.createdAt));
}

export async function getAllMentalHealth() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mentalHealthRecords).orderBy(desc(mentalHealthRecords.createdAt));
}

export async function createMentalHealth(data: InsertMentalHealthRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mentalHealthRecords).values(data);
  return result[0].insertId;
}

// ==================== PUSH TOKENS ====================

export async function getPushTokensByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(
    and(eq(pushTokens.employeeId, employeeId), eq(pushTokens.isActive, 1))
  );
}

export async function getAllActivePushTokens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(eq(pushTokens.isActive, 1));
}

export async function upsertPushToken(employeeId: number, token: string, platform: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if token exists
  const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token)).limit(1);
  
  if (existing.length > 0) {
    await db.update(pushTokens).set({ 
      employeeId, 
      platform, 
      isActive: 1, 
      lastUsed: new Date() 
    }).where(eq(pushTokens.token, token));
    return existing[0].id;
  } else {
    const result = await db.insert(pushTokens).values({ employeeId, token, platform });
    return result[0].insertId;
  }
}

export async function deactivatePushToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pushTokens).set({ isActive: 0 }).where(eq(pushTokens.token, token));
}

// ==================== CHALLENGE NOTIFICATIONS ====================

export async function createChallengeNotification(data: InsertChallengeNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(challengeNotifications).values(data);
  return result[0].insertId;
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeNotifications).where(eq(challengeNotifications.sent, 0));
}

export async function markNotificationSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(challengeNotifications).set({ 
    sent: 1, 
    sentAt: new Date() 
  }).where(eq(challengeNotifications.id, id));
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [allEmployees, allCheckIns, allHydration, allPressure, allComplaints, allChallenges, allErgonomics, allMentalHealth] = await Promise.all([
    getAllEmployees(),
    getAllCheckIns(),
    getAllHydration(),
    getAllBloodPressure(),
    getAllComplaints(),
    getAllChallenges(),
    getAllErgonomics(),
    getAllMentalHealth(),
  ]);
  
  const today = new Date().toISOString().split("T")[0];
  const checkInsToday = allCheckIns.filter(c => {
    const checkInDate = c.date instanceof Date ? c.date.toISOString().split("T")[0] : String(c.date);
    return checkInDate === today;
  }).length;
  
  const hydrationAvg = allHydration.length > 0 
    ? Math.round(allHydration.reduce((sum, h) => sum + (h.totalMl || 0), 0) / allHydration.length)
    : 0;
  
  const activeChallenges = allChallenges.filter(c => c.completed === 0).length;
  const completedChallenges = allChallenges.filter(c => c.completed === 1).length;
  
  const totalPauses = allErgonomics.reduce((sum, e) => sum + (e.pausesCompleted || 0), 0);
  const totalStretches = allErgonomics.reduce((sum, e) => sum + (e.stretchesCompleted || 0), 0);
  
  const totalBreathing = allMentalHealth.reduce((sum, m) => sum + (m.breathingExercises || 0), 0);
  const totalPsychologist = allMentalHealth.reduce((sum, m) => sum + (m.psychologistContacts || 0), 0);
  
  return {
    totalEmployees: allEmployees.length,
    checkInsToday,
    totalCheckIns: allCheckIns.length,
    hydrationAverage: hydrationAvg,
    complaintsCount: allComplaints.length,
    activeChallenges,
    completedChallenges,
    ergonomics: { totalPauses, totalStretches },
    mentalHealth: { totalBreathing, totalPsychologist },
    employees: allEmployees,
    checkIns: allCheckIns,
    hydration: allHydration,
    pressure: allPressure,
    complaints: allComplaints,
    challenges: allChallenges,
    ergonomicsRecords: allErgonomics,
    mentalHealthRecords: allMentalHealth,
  };
}

// TODO: add feature queries here as your schema grows.
