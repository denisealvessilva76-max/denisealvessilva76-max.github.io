import { describe, it, expect, beforeEach, afterEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateTestData,
  clearTestData,
  hasTestData,
  loadTestData,
} from "../lib/test-data-generator";

/**
 * Testes para o gerador de dados de teste
 */

describe("Gerador de Dados de Teste", () => {
  // Limpar AsyncStorage antes de cada teste
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // Limpar AsyncStorage após cada teste
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe("Geração de Dados", () => {
    it("deve gerar dados de teste com sucesso", async () => {
      const result = await generateTestData(10);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.employees).toBe(10);
      expect(result.stats?.checkIns).toBeGreaterThan(0);
      expect(result.stats?.hydration).toBeGreaterThan(0);
    });

    it("deve gerar 15 funcionários por padrão", async () => {
      const result = await generateTestData();

      expect(result.success).toBe(true);
      expect(result.stats?.employees).toBe(15);
    });

    it("deve gerar funcionários com dados válidos", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      expect(data.employees).toHaveLength(5);

      data.employees.forEach((emp: any) => {
        expect(emp.id).toBeDefined();
        expect(emp.cpf).toBeDefined();
        expect(emp.cpf).toHaveLength(11);
        expect(emp.matricula).toMatch(/^MAT\d{5}$/);
        expect(emp.name).toBeDefined();
        expect(emp.department).toBeDefined();
        expect(emp.position).toBeDefined();
        expect(emp.weight).toBeGreaterThan(0);
        expect(emp.height).toBeGreaterThan(0);
        expect(["leve", "moderado", "pesado"]).toContain(emp.workType);
      });
    });

    it("deve gerar check-ins dos últimos 7 dias", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      expect(data.checkIns.length).toBeGreaterThan(0);

      data.checkIns.forEach((checkIn: any) => {
        expect(checkIn.employeeId).toBeDefined();
        expect(checkIn.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(["bem", "dor_leve", "dor_forte"]).toContain(checkIn.status);
        expect(checkIn.timestamp).toBeDefined();
      });
    });

    it("deve gerar registros de hidratação variados", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      expect(data.hydration.length).toBeGreaterThan(0);

      data.hydration.forEach((hydration: any) => {
        expect(hydration.employeeId).toBeDefined();
        expect(hydration.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(hydration.totalMl).toBeGreaterThan(0);
        expect(hydration.goalMl).toBeGreaterThan(0);
        expect(hydration.timestamp).toBeDefined();
      });
    });

    it("deve gerar registros de pressão arterial", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      expect(data.pressure.length).toBeGreaterThan(0);

      data.pressure.forEach((pressure: any) => {
        expect(pressure.employeeId).toBeDefined();
        expect(pressure.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(pressure.systolic).toBeGreaterThan(0);
        expect(pressure.diastolic).toBeGreaterThan(0);
        expect(pressure.systolic).toBeGreaterThan(pressure.diastolic);
        expect(pressure.timestamp).toBeDefined();
      });
    });

    it("deve gerar queixas de saúde aleatórias", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      // Nem todos os funcionários terão queixas, mas deve haver pelo menos algumas
      expect(data.complaints.length).toBeGreaterThanOrEqual(0);

      data.complaints.forEach((complaint: any) => {
        expect(complaint.employeeId).toBeDefined();
        expect(complaint.type).toBeDefined();
        expect(complaint.description).toBeDefined();
        expect(complaint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(complaint.timestamp).toBeDefined();
      });
    });

    it("deve marcar flag de dados de teste gerados", async () => {
      await generateTestData(5);
      const hasTest = await hasTestData();

      expect(hasTest).toBe(true);
    });
  });

  describe("Limpeza de Dados", () => {
    it("deve limpar todos os dados de teste", async () => {
      // Gerar dados primeiro
      await generateTestData(5);
      let hasTest = await hasTestData();
      expect(hasTest).toBe(true);

      // Limpar dados
      const result = await clearTestData();
      expect(result.success).toBe(true);

      // Verificar que foram limpos
      hasTest = await hasTestData();
      expect(hasTest).toBe(false);

      const data = await loadTestData();
      expect(data.employees).toHaveLength(0);
      expect(data.checkIns).toHaveLength(0);
      expect(data.hydration).toHaveLength(0);
      expect(data.pressure).toHaveLength(0);
      expect(data.complaints).toHaveLength(0);
    });
  });

  describe("Verificação de Dados", () => {
    it("deve retornar false quando não há dados de teste", async () => {
      const hasTest = await hasTestData();
      expect(hasTest).toBe(false);
    });

    it("deve retornar true quando há dados de teste", async () => {
      await generateTestData(5);
      const hasTest = await hasTestData();
      expect(hasTest).toBe(true);
    });
  });

  describe("Carregamento de Dados", () => {
    it("deve carregar dados de teste vazios quando não há dados", async () => {
      const data = await loadTestData();

      expect(data.employees).toHaveLength(0);
      expect(data.checkIns).toHaveLength(0);
      expect(data.hydration).toHaveLength(0);
      expect(data.pressure).toHaveLength(0);
      expect(data.complaints).toHaveLength(0);
    });

    it("deve carregar dados de teste gerados", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      expect(data.employees).toHaveLength(5);
      expect(data.checkIns.length).toBeGreaterThan(0);
      expect(data.hydration.length).toBeGreaterThan(0);
    });
  });

  describe("Validação de Dados Gerados", () => {
    it("deve gerar matrículas únicas", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      const matriculas = data.employees.map((emp: any) => emp.matricula);
      const uniqueMatriculas = new Set(matriculas);

      expect(uniqueMatriculas.size).toBe(matriculas.length);
    });

    it("deve gerar CPFs únicos", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      const cpfs = data.employees.map((emp: any) => emp.cpf);
      const uniqueCpfs = new Set(cpfs);

      expect(uniqueCpfs.size).toBe(cpfs.length);
    });

    it("deve gerar IDs únicos", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      const ids = data.employees.map((emp: any) => emp.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("deve gerar peso e altura realistas", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      data.employees.forEach((emp: any) => {
        expect(emp.weight).toBeGreaterThanOrEqual(55);
        expect(emp.weight).toBeLessThanOrEqual(100);
        expect(emp.height).toBeGreaterThanOrEqual(150);
        expect(emp.height).toBeLessThanOrEqual(190);
      });
    });

    it("deve gerar datas válidas nos últimos 7 dias", async () => {
      await generateTestData(5);
      const data = await loadTestData();

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      [...data.checkIns, ...data.hydration, ...data.pressure, ...data.complaints].forEach(
        (record: any) => {
          const recordDate = new Date(record.date);
          expect(recordDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
          expect(recordDate.getTime()).toBeLessThanOrEqual(today.getTime());
        }
      );
    });

    it("deve gerar pressão arterial realista", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      data.pressure.forEach((pressure: any) => {
        // Sistólica entre 110 e 160
        expect(pressure.systolic).toBeGreaterThanOrEqual(110);
        expect(pressure.systolic).toBeLessThanOrEqual(160);

        // Diastólica entre 70 e 105
        expect(pressure.diastolic).toBeGreaterThanOrEqual(70);
        expect(pressure.diastolic).toBeLessThanOrEqual(105);

        // Sistólica sempre maior que diastólica
        expect(pressure.systolic).toBeGreaterThan(pressure.diastolic);
      });
    });

    it("deve gerar hidratação com variação realista", async () => {
      await generateTestData(10);
      const data = await loadTestData();

      data.hydration.forEach((hydration: any) => {
        // Variação entre 40% e 120% da meta
        const percentage = (hydration.totalMl / hydration.goalMl) * 100;
        expect(percentage).toBeGreaterThanOrEqual(40);
        expect(percentage).toBeLessThanOrEqual(120);
      });
    });
  });

  describe("Integração: Fluxo Completo", () => {
    it("deve executar fluxo completo de gerar, carregar e limpar dados", async () => {
      // 1. Verificar que não há dados
      let hasTest = await hasTestData();
      expect(hasTest).toBe(false);

      // 2. Gerar dados
      const generateResult = await generateTestData(10);
      expect(generateResult.success).toBe(true);
      expect(generateResult.stats?.employees).toBe(10);

      // 3. Verificar que há dados
      hasTest = await hasTestData();
      expect(hasTest).toBe(true);

      // 4. Carregar dados
      const data = await loadTestData();
      expect(data.employees).toHaveLength(10);
      expect(data.checkIns.length).toBeGreaterThan(0);

      // 5. Limpar dados
      const clearResult = await clearTestData();
      expect(clearResult.success).toBe(true);

      // 6. Verificar que não há mais dados
      hasTest = await hasTestData();
      expect(hasTest).toBe(false);

      const emptyData = await loadTestData();
      expect(emptyData.employees).toHaveLength(0);
    });
  });
});
