import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import { emailService } from "../../services/email-service";
import { generateDailyReportEmail, generateTestEmail } from "../../../lib/email-templates";

export const emailRouter = router({
  /**
   * Testa a configuração de e-mail
   */
  testConnection: publicProcedure.query(async () => {
    const result = await emailService.testConnection();
    return result;
  }),

  /**
   * Envia um e-mail de teste
   */
  sendTestEmail: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      if (!emailService.isConfigured()) {
        return {
          success: false,
          error: "Serviço de e-mail não configurado. Configure as variáveis de ambiente SMTP.",
        };
      }

      const html = generateTestEmail();

      const result = await emailService.sendEmail({
        to: input.to,
        subject: "Teste - Canteiro Saudável",
        html,
      });

      return result;
    }),

  /**
   * Envia relatório diário por e-mail
   */
  sendDailyReport: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
        stats: z.object({
          totalEmployees: z.number(),
          activeToday: z.number(),
          checkInsToday: z.number(),
          hydrationAverage: z.number(),
          complaintsThisWeek: z.number(),
          challengesActive: z.number(),
          ergonomicsAdherence: z.number(),
          mentalHealthUsage: z.number(),
        }),
        employees: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            matricula: z.string(),
            lastCheckIn: z.string().nullable(),
            hydrationToday: z.number(),
            hydrationGoal: z.number(),
            lastPressure: z
              .object({
                systolic: z.number(),
                diastolic: z.number(),
              })
              .nullable(),
            complaintsCount: z.number(),
            challengesActive: z.number(),
          })
        ),
        alerts: z
          .array(
            z.object({
              type: z.enum(["pressure", "hydration", "complaint"]),
              employeeName: z.string(),
              employeeMatricula: z.string(),
              message: z.string(),
              severity: z.enum(["low", "medium", "high"]),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!emailService.isConfigured()) {
        return {
          success: false,
          error: "Serviço de e-mail não configurado. Configure as variáveis de ambiente SMTP.",
        };
      }

      const date = new Date().toLocaleDateString("pt-BR");
      const html = generateDailyReportEmail(input.stats, input.employees, input.alerts, date);

      const result = await emailService.sendEmail({
        to: input.to,
        subject: `Relatório Diário - Canteiro Saudável - ${date}`,
        html,
      });

      return result;
    }),

  /**
   * Configura o serviço de e-mail (apenas para admin)
   */
  configure: publicProcedure
    .input(
      z.object({
        host: z.string(),
        port: z.number(),
        secure: z.boolean(),
        user: z.string(),
        pass: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        emailService.initialize({
          host: input.host,
          port: input.port,
          secure: input.secure,
          auth: {
            user: input.user,
            pass: input.pass,
          },
        });

        const testResult = await emailService.testConnection();

        return testResult;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao configurar serviço de e-mail",
        };
      }
    }),

  /**
   * Verifica se o serviço de e-mail está configurado
   */
  isConfigured: publicProcedure.query(async () => {
    return {
      configured: emailService.isConfigured(),
    };
  }),
});
