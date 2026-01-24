import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabelas para sincronização de dados de saúde
 */
export const healthDataSync = mysqlTable("health_data_sync", {
  id: int("id").autoincrement().primaryKey(),
  workerId: varchar("workerId", { length: 64 }).notNull(), // ID anônimo do trabalhador
  timestamp: timestamp("timestamp").notNull(),
  // Check-in
  checkInStatus: varchar("checkInStatus", { length: 20 }), // bem, dor-leve, dor-forte
  checkInDate: date("checkInDate"),
  // Pressão arterial
  pressureSystolic: int("pressureSystolic"),
  pressureDiastolic: int("pressureDiastolic"),
  pressureDate: date("pressureDate"),
  // Sintomas
  symptoms: json("symptoms"),
  symptomsDate: date("symptomsDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aggregatedHealthData = mysqlTable("aggregated_health_data", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull().unique(),
  totalWorkers: int("totalWorkers").notNull(),
  totalCheckIns: int("totalCheckIns").notNull(),
  checkInBem: int("checkInBem").default(0),
  checkInDorLeve: int("checkInDorLeve").default(0),
  checkInDorForte: int("checkInDorForte").default(0),
  avgPressureSystolic: decimal("avgPressureSystolic", { precision: 5, scale: 2 }).default("0"),
  avgPressureDiastolic: decimal("avgPressureDiastolic", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const weeklyReports = mysqlTable("weekly_reports", {
  id: int("id").autoincrement().primaryKey(),
  week: int("week").notNull(),
  year: int("year").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalWorkers: int("totalWorkers").notNull(),
  totalCheckIns: int("totalCheckIns").notNull(),
  avgEngagement: decimal("avgEngagement", { precision: 5, scale: 2 }).default("0"),
  avgPressureSystolic: decimal("avgPressureSystolic", { precision: 5, scale: 2 }).default("0"),
  avgPressureDiastolic: decimal("avgPressureDiastolic", { precision: 5, scale: 2 }).default("0"),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalWorkers: int("totalWorkers").notNull(),
  totalCheckIns: int("totalCheckIns").notNull(),
  avgEngagement: decimal("avgEngagement", { precision: 5, scale: 2 }).default("0"),
  avgPressureSystolic: decimal("avgPressureSystolic", { precision: 5, scale: 2 }).default("0"),
  avgPressureDiastolic: decimal("avgPressureDiastolic", { precision: 5, scale: 2 }).default("0"),
  recommendations: json("recommendations"),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HealthDataSync = typeof healthDataSync.$inferSelect;
export type InsertHealthDataSync = typeof healthDataSync.$inferInsert;
export type AggregatedHealthData = typeof aggregatedHealthData.$inferSelect;
export type InsertAggregatedHealthData = typeof aggregatedHealthData.$inferInsert;
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type InsertWeeklyReport = typeof weeklyReports.$inferInsert;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;

/**
 * Tabela para registro de hidratação dos trabalhadores
 */
export const hydrationRecords = mysqlTable("hydration_records", {
  id: int("id").autoincrement().primaryKey(),
  workerId: varchar("workerId", { length: 64 }).notNull(), // ID anônimo do trabalhador
  date: date("date").notNull(),
  waterIntake: int("waterIntake").notNull(), // ml
  glassesConsumed: int("glassesConsumed").notNull(),
  dailyGoal: int("dailyGoal").notNull(), // ml
  weight: int("weight"), // kg
  height: int("height"), // cm
  workType: varchar("workType", { length: 20 }), // leve, moderado, pesado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HydrationRecord = typeof hydrationRecords.$inferSelect;
export type InsertHydrationRecord = typeof hydrationRecords.$inferInsert;

/**
 * Tabelas para encaminhamentos e hidratação
 */
export const healthReferrals = mysqlTable("health_referrals", {
  id: int("id").autoincrement().primaryKey(),
  workerId: varchar("workerId", { length: 64 }).notNull(),
  complaintType: varchar("complaintType", { length: 50 }).notNull(), // dor-leve, dor-forte, outro
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // leve, moderada, grave
  status: varchar("status", { length: 20 }).default("pendente").notNull(), // pendente, em-atendimento, resolvido
  referredTo: varchar("referredTo", { length: 100 }), // SESMT, Médico, Fisioterapeuta
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const hydrationTracking = mysqlTable("hydration_tracking", {
  id: int("id").autoincrement().primaryKey(),
  workerId: varchar("workerId", { length: 64 }).notNull(),
  date: date("date").notNull(),
  waterIntake: int("waterIntake").default(0), // em ml
  glassesConsumed: int("glassesConsumed").default(0), // número de copos
  lastReminderTime: timestamp("lastReminderTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: varchar("role", { length: 50 }).default("sesmt").notNull(), // sesmt, gerente, admin
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthReferral = typeof healthReferrals.$inferSelect;
export type InsertHealthReferral = typeof healthReferrals.$inferInsert;
export type HydrationTracking = typeof hydrationTracking.$inferSelect;
export type InsertHydrationTracking = typeof hydrationTracking.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Tabela para notificações do admin
 */
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // pain-report, referral-created, critical-alert
  severity: varchar("severity", { length: 20 }).default("normal").notNull(), // low, normal, high, critical
  message: text("message").notNull(),
  data: json("data"), // dados adicionais em JSON
  isRead: int("isRead").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

// TODO: Add your tables here

/**
 * Tabela para check-ins diários dos usuários
 */
export const checkIns = mysqlTable("check_ins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Referência ao users.id
  date: date("date").notNull(),
  mood: varchar("mood", { length: 20 }).notNull(), // bem, dor-leve, dor-forte
  symptoms: json("symptoms"), // Array de sintomas
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Tabela para registros de pressão arterial
 */
export const bloodPressureRecords = mysqlTable("blood_pressure_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  systolic: int("systolic").notNull(), // Pressão sistólica
  diastolic: int("diastolic").notNull(), // Pressão diastólica
  notes: text("notes"),
  classification: varchar("classification", { length: 30 }), // normal, pre-hipertensao, hipertensao
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BloodPressureRecord = typeof bloodPressureRecords.$inferSelect;
export type InsertBloodPressureRecord = typeof bloodPressureRecords.$inferInsert;

/**
 * Tabela para progresso de desafios
 */
export const challengeProgress = mysqlTable("challenge_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: varchar("challengeId", { length: 100 }).notNull(),
  currentValue: int("currentValue").default(0),
  targetValue: int("targetValue").notNull(),
  completed: int("completed").default(0), // 0 = não completado, 1 = completado
  photoUri: text("photoUri"), // URI da foto de evidência
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;

/**
 * Tabela para queixas de saúde
 */
export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  complaint: text("complaint").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // leve, moderada, grave
  resolved: int("resolved").default(0), // 0 = não resolvido, 1 = resolvido
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

/**
 * Tabela para dados de gamificação (pontos, conquistas, sequências)
 */
export const gamificationData = mysqlTable("gamification_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPoints: int("totalPoints").default(0),
  currentStreak: int("currentStreak").default(0),
  longestStreak: int("longestStreak").default(0),
  lastCheckInDate: date("lastCheckInDate"),
  achievements: json("achievements"), // Array de conquistas desbloqueadas
  badges: json("badges"), // Array de badges
  consistencyPoints: int("consistencyPoints").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GamificationData = typeof gamificationData.$inferSelect;
export type InsertGamificationData = typeof gamificationData.$inferInsert;

/**
 * Tabela para hidratação por usuário (substituindo hydrationRecords)
 */
export const userHydration = mysqlTable("user_hydration", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  cupsConsumed: int("cupsConsumed").default(0),
  totalMl: int("totalMl").default(0),
  goalMl: int("goalMl").notNull(),
  weight: int("weight"), // kg
  height: int("height"), // cm
  workType: varchar("workType", { length: 20 }), // leve, moderado, pesado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserHydration = typeof userHydration.$inferSelect;
export type InsertUserHydration = typeof userHydration.$inferInsert;
