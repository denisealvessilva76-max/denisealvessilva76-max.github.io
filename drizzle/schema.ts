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

// TODO: Add your tables here
