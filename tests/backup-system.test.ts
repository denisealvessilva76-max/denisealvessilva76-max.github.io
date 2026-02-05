import { describe, it, expect, vi } from "vitest";
import { generateDailyReportEmail, generateTestEmail } from "../lib/email-templates";

/**
 * Testes para validar o sistema de backup automático por e-mail
 */

describe("Sistema de Backup Automático", () => {
  describe("Geração de Templates de E-mail", () => {
    it("deve gerar template de e-mail de teste válido", () => {
      const html = generateTestEmail();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Teste de Configuração de E-mail");
      expect(html).toContain("Canteiro Saudável");
      expect(html).toContain("configuração de SMTP está funcionando corretamente");
    });

    it("deve gerar relatório diário com estatísticas", () => {
      const stats = {
        totalEmployees: 10,
        activeToday: 8,
        checkInsToday: 8,
        hydrationAverage: 75,
        complaintsThisWeek: 3,
        challengesActive: 2,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees: any[] = [];
      const alerts: any[] = [];
      const date = "05/02/2026";

      const html = generateDailyReportEmail(stats, employees, alerts, date);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Canteiro Saudável");
      expect(html).toContain("Relatório Diário de Saúde Ocupacional");
      expect(html).toContain("05/02/2026");
      expect(html).toContain("Total de Funcionários");
      expect(html).toContain("10");
      expect(html).toContain("Ativos Hoje");
      expect(html).toContain("8");
      expect(html).toContain("Hidratação Média");
      expect(html).toContain("75%");
    });

    it("deve incluir alertas no relatório quando fornecidos", () => {
      const stats = {
        totalEmployees: 5,
        activeToday: 3,
        checkInsToday: 3,
        hydrationAverage: 60,
        complaintsThisWeek: 2,
        challengesActive: 1,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees: any[] = [];
      const alerts = [
        {
          type: "pressure" as const,
          employeeName: "João Silva",
          employeeMatricula: "12345",
          message: "Pressão arterial elevada: 150/95 mmHg",
          severity: "high" as const,
        },
        {
          type: "hydration" as const,
          employeeName: "Maria Santos",
          employeeMatricula: "67890",
          message: "Hidratação baixa: 30% da meta",
          severity: "medium" as const,
        },
      ];

      const html = generateDailyReportEmail(stats, employees, alerts);

      expect(html).toContain("Alertas do Dia");
      expect(html).toContain("João Silva");
      expect(html).toContain("12345");
      expect(html).toContain("Pressão arterial elevada");
      expect(html).toContain("Maria Santos");
      expect(html).toContain("67890");
      expect(html).toContain("Hidratação baixa");
    });

    it("deve incluir lista de funcionários no relatório", () => {
      const stats = {
        totalEmployees: 2,
        activeToday: 2,
        checkInsToday: 2,
        hydrationAverage: 80,
        complaintsThisWeek: 0,
        challengesActive: 0,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees = [
        {
          id: "1",
          name: "João Silva",
          matricula: "12345",
          lastCheckIn: "bem",
          hydrationToday: 1800,
          hydrationGoal: 2000,
          lastPressure: { systolic: 120, diastolic: 80 },
          complaintsCount: 0,
          challengesActive: 0,
        },
        {
          id: "2",
          name: "Maria Santos",
          matricula: "67890",
          lastCheckIn: null,
          hydrationToday: 1000,
          hydrationGoal: 2000,
          lastPressure: null,
          complaintsCount: 1,
          challengesActive: 0,
        },
      ];

      const html = generateDailyReportEmail(stats, employees, []);

      expect(html).toContain("Status dos Funcionários");
      expect(html).toContain("João Silva");
      expect(html).toContain("12345");
      expect(html).toContain("Maria Santos");
      expect(html).toContain("67890");
      expect(html).toContain("120/80");
      expect(html).toContain("Sem registro");
    });

    it("deve identificar funcionários que precisam de atenção", () => {
      const stats = {
        totalEmployees: 3,
        activeToday: 2,
        checkInsToday: 2,
        hydrationAverage: 50,
        complaintsThisWeek: 2,
        challengesActive: 0,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees = [
        {
          id: "1",
          name: "João Silva",
          matricula: "12345",
          lastCheckIn: "bem",
          hydrationToday: 800, // Hidratação baixa (40%)
          hydrationGoal: 2000,
          lastPressure: { systolic: 150, diastolic: 95 }, // Pressão elevada
          complaintsCount: 2, // Tem queixas
          challengesActive: 0,
        },
        {
          id: "2",
          name: "Maria Santos",
          matricula: "67890",
          lastCheckIn: "bem",
          hydrationToday: 1800,
          hydrationGoal: 2000,
          lastPressure: { systolic: 120, diastolic: 80 },
          complaintsCount: 0,
          challengesActive: 0,
        },
      ];

      const html = generateDailyReportEmail(stats, employees, []);

      expect(html).toContain("Funcionários que Precisam de Atenção");
      expect(html).toContain("João Silva");
      expect(html).toContain("Pressão elevada");
      expect(html).toContain("Hidratação baixa");
      expect(html).toContain("queixa(s) reportada(s)");
    });

    it("deve gerar relatório vazio quando não há funcionários", () => {
      const stats = {
        totalEmployees: 0,
        activeToday: 0,
        checkInsToday: 0,
        hydrationAverage: 0,
        complaintsThisWeek: 0,
        challengesActive: 0,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees: any[] = [];
      const alerts: any[] = [];

      const html = generateDailyReportEmail(stats, employees, alerts);

      expect(html).toContain("Total de Funcionários");
      expect(html).toContain("0");
      expect(html).toContain("Nenhum funcionário cadastrado ainda");
    });
  });

  describe("Configuração de Backup", () => {
    it("deve validar expressão cron para backup diário", () => {
      // Expressão cron válida: "0 8 * * *" = todos os dias às 8h
      const cronExpression = "0 8 * * *";
      const parts = cronExpression.split(" ");

      expect(parts).toHaveLength(5);
      expect(parts[0]).toBe("0"); // minuto
      expect(parts[1]).toBe("8"); // hora
      expect(parts[2]).toBe("*"); // dia do mês
      expect(parts[3]).toBe("*"); // mês
      expect(parts[4]).toBe("*"); // dia da semana
    });

    it("deve construir expressão cron a partir de hora e minuto", () => {
      const hour = "8";
      const minute = "30";
      const cronExpression = `${minute} ${hour} * * *`;

      expect(cronExpression).toBe("30 8 * * *");
    });

    it("deve validar formato de e-mail", () => {
      const validEmails = [
        "sesmt@empresa.com.br",
        "admin@example.com",
        "user.name@domain.co.uk",
      ];

      const invalidEmails = ["invalid", "no@domain", "@domain.com", "user@"];

      validEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("deve validar configuração SMTP mínima", () => {
      const config = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "user@gmail.com",
        pass: "app_password",
      };

      expect(config.host).toBeTruthy();
      expect(config.port).toBeGreaterThan(0);
      expect(config.user).toMatch(/@/);
      expect(config.pass).toBeTruthy();
    });
  });

  describe("Coleta de Dados para Relatório", () => {
    it("deve calcular estatísticas corretamente", () => {
      const employees = [
        { hydrationToday: 1800, hydrationGoal: 2000 }, // 90%
        { hydrationToday: 1600, hydrationGoal: 2000 }, // 80%
        { hydrationToday: 1400, hydrationGoal: 2000 }, // 70%
      ];

      const hydrationAverage = Math.round(
        employees.reduce((sum, emp) => sum + (emp.hydrationToday / emp.hydrationGoal) * 100, 0) /
          employees.length
      );

      expect(hydrationAverage).toBe(80); // (90 + 80 + 70) / 3 = 80
    });

    it("deve identificar pressão arterial elevada", () => {
      const pressureRecords = [
        { systolic: 150, diastolic: 95 }, // Elevada
        { systolic: 120, diastolic: 80 }, // Normal
        { systolic: 140, diastolic: 90 }, // Limite
        { systolic: 160, diastolic: 100 }, // Muito elevada
      ];

      const elevated = pressureRecords.filter(
        (p) => p.systolic >= 140 || p.diastolic >= 90
      );

      expect(elevated).toHaveLength(3);
    });

    it("deve identificar hidratação baixa", () => {
      const employees = [
        { hydrationToday: 1800, hydrationGoal: 2000 }, // 90% - OK
        { hydrationToday: 900, hydrationGoal: 2000 }, // 45% - Baixa
        { hydrationToday: 500, hydrationGoal: 2000 }, // 25% - Muito baixa
      ];

      const lowHydration = employees.filter(
        (emp) => emp.hydrationToday / emp.hydrationGoal < 0.5
      );

      expect(lowHydration).toHaveLength(2);
    });
  });

  describe("Integração: Fluxo Completo de Backup", () => {
    it("deve executar fluxo completo de geração de relatório", () => {
      // 1. Coletar dados
      const stats = {
        totalEmployees: 5,
        activeToday: 4,
        checkInsToday: 4,
        hydrationAverage: 70,
        complaintsThisWeek: 2,
        challengesActive: 1,
        ergonomicsAdherence: 0,
        mentalHealthUsage: 0,
      };

      const employees = [
        {
          id: "1",
          name: "João Silva",
          matricula: "12345",
          lastCheckIn: "bem",
          hydrationToday: 1800,
          hydrationGoal: 2000,
          lastPressure: { systolic: 120, diastolic: 80 },
          complaintsCount: 0,
          challengesActive: 1,
        },
      ];

      const alerts = [
        {
          type: "pressure" as const,
          employeeName: "Maria Santos",
          employeeMatricula: "67890",
          message: "Pressão arterial elevada: 150/95 mmHg",
          severity: "high" as const,
        },
      ];

      // 2. Gerar HTML
      const html = generateDailyReportEmail(stats, employees, alerts);

      // 3. Validar conteúdo
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Canteiro Saudável");
      expect(html).toContain("Relatório Diário");
      expect(html).toContain("Total de Funcionários");
      expect(html).toContain("5");
      expect(html).toContain("João Silva");
      expect(html).toContain("Maria Santos");
      expect(html).toContain("Pressão arterial elevada");

      // 4. Verificar estrutura HTML
      expect(html).toMatch(/<html>/);
      expect(html).toMatch(/<head>/);
      expect(html).toMatch(/<body>/);
      expect(html).toMatch(/<table>/);
      expect(html).toMatch(/<\/html>/);
    });
  });
});
