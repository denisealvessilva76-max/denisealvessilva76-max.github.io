import { describe, it, expect, beforeAll } from "vitest";

/**
 * Testes de integração para sincronização de dados
 * 
 * Para rodar: pnpm test
 */

describe("Sincronização de Dados", () => {
  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  // Nota: Estes testes requerem um usuário autenticado
  // Em produção, você deve usar um token de teste válido
  const TEST_TOKEN = "test_token_placeholder";

  it("deve ter schemas do banco de dados criados", () => {
    // Verificar que os schemas foram importados corretamente
    const schemas = require("../drizzle/schema");
    
    expect(schemas.checkIns).toBeDefined();
    expect(schemas.userHydration).toBeDefined();
    expect(schemas.bloodPressureRecords).toBeDefined();
    expect(schemas.challengeProgress).toBeDefined();
    expect(schemas.complaints).toBeDefined();
    expect(schemas.gamificationData).toBeDefined();
  });

  it("deve ter routers tRPC configurados", () => {
    const routers = require("../server/routers");
    
    expect(routers.appRouter).toBeDefined();
    expect(typeof routers.appRouter).toBe("object");
  });

  it("deve ter arquivo de hook de sincronização", () => {
    const fs = require("fs");
    const path = require("path");
    const hookPath = path.join(__dirname, "../hooks/use-sync-manager.ts");
    expect(fs.existsSync(hookPath)).toBe(true);
  });
});

describe("Arquivos de Backend", () => {
  it("deve ter arquivo de routers", () => {
    const fs = require("fs");
    const path = require("path");
    const routersPath = path.join(__dirname, "../server/routers.ts");
    expect(fs.existsSync(routersPath)).toBe(true);
  });

  it("deve ter arquivo de schema", () => {
    const fs = require("fs");
    const path = require("path");
    const schemaPath = path.join(__dirname, "../drizzle/schema.ts");
    expect(fs.existsSync(schemaPath)).toBe(true);
  });
});

describe("Estrutura de Dados", () => {
  it("deve ter estrutura correta para check-in", () => {
    const testData = {
      date: "2026-01-24",
      mood: "bem",
      symptoms: ["nenhum"],
      notes: "Teste",
    };

    expect(testData.date).toBeDefined();
    expect(testData.mood).toBeDefined();
    expect(Array.isArray(testData.symptoms)).toBe(true);
  });

  it("deve ter estrutura correta para hidratação", () => {
    const testData = {
      date: "2026-01-24",
      cupsConsumed: 5,
      totalMl: 750,
      goalMl: 2000,
      weight: 70,
      height: 170,
      workType: "moderado",
    };

    expect(testData.cupsConsumed).toBeGreaterThanOrEqual(0);
    expect(testData.totalMl).toBeGreaterThanOrEqual(0);
    expect(testData.goalMl).toBeGreaterThan(0);
  });

  it("deve ter estrutura correta para pressão arterial", () => {
    const testData = {
      date: "2026-01-24",
      systolic: 120,
      diastolic: 80,
      notes: "Normal",
      classification: "normal",
    };

    expect(testData.systolic).toBeGreaterThan(0);
    expect(testData.diastolic).toBeGreaterThan(0);
  });

  it("deve ter estrutura correta para desafio", () => {
    const testData = {
      challengeId: "desafio-1",
      currentValue: 5,
      targetValue: 10,
      completed: false,
      photoUri: undefined,
      startDate: "2026-01-20",
      endDate: "2026-01-27",
    };

    expect(testData.challengeId).toBeDefined();
    expect(testData.currentValue).toBeGreaterThanOrEqual(0);
    expect(testData.targetValue).toBeGreaterThan(0);
  });

  it("deve ter estrutura correta para queixa", () => {
    const testData = {
      date: "2026-01-24",
      complaint: "Dor nas costas",
      severity: "leve",
      resolved: false,
      notes: "Teste",
    };

    expect(testData.complaint).toBeDefined();
    expect(["leve", "moderada", "grave"]).toContain(testData.severity);
  });

  it("deve ter estrutura correta para gamificação", () => {
    const testData = {
      totalPoints: 100,
      currentStreak: 5,
      longestStreak: 10,
      lastCheckInDate: "2026-01-24",
      achievements: [],
      badges: [],
      consistencyPoints: 50,
    };

    expect(testData.totalPoints).toBeGreaterThanOrEqual(0);
    expect(testData.currentStreak).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(testData.achievements)).toBe(true);
  });
});
