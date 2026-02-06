import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import {
  getHydrationByEmployee,
  getAllHydration,
  createHydration,
  updateHydration,
  getBloodPressureByEmployee,
  getAllBloodPressure,
  createBloodPressure,
  getComplaintsByEmployee,
  getAllComplaints,
  createComplaint,
  updateComplaint,
} from "../../db";

/**
 * API tRPC para gerenciamento de dados de saúde (hidratação, pressão, queixas)
 */

export const healthRouter = router({
  // ==================== HIDRATAÇÃO ====================
  hydration: router({
    /**
     * Criar/atualizar registro de hidratação
     */
    upsert: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          date: z.string(), // YYYY-MM-DD
          cupsConsumed: z.number(),
          totalMl: z.number(),
          goalMl: z.number(),
          weight: z.number().optional(),
          height: z.number().optional(),
          workType: z.enum(["leve", "moderado", "pesado"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const hydrationId = await createHydration({
          userId: input.userId,
          date: new Date(input.date),
          cupsConsumed: input.cupsConsumed,
          totalMl: input.totalMl,
          goalMl: input.goalMl,
          weight: input.weight,
          height: input.height,
          workType: input.workType,
        });

        return {
          success: true,
          hydrationId,
        };
      }),

    /**
     * Buscar hidratação de um funcionário
     */
    getByEmployee: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const hydration = await getHydrationByEmployee(input.employeeId);
        return hydration;
      }),

    /**
     * Buscar hidratação de hoje
     */
    getToday: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const today = new Date().toISOString().split("T")[0];
        const hydration = await getHydrationByEmployee(input.employeeId);
        const todayHydration = hydration.find((h) => {
          const hydrationDate = h.date instanceof Date ? h.date.toISOString().split("T")[0] : h.date;
          return hydrationDate === today;
        });
        return todayHydration || null;
      }),

    /**
     * Listar toda a hidratação
     */
    list: publicProcedure.query(async () => {
      const allHydration = await getAllHydration();
      return allHydration;
    }),
  }),

  // ==================== PRESSÃO ARTERIAL ====================
  bloodPressure: router({
    /**
     * Criar registro de pressão arterial
     */
    create: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          date: z.string(), // YYYY-MM-DD
          systolic: z.number(),
          diastolic: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Classificar pressão
        let classification = "normal";
        if (input.systolic >= 160 || input.diastolic >= 100) {
          classification = "hipertensao";
        } else if (input.systolic >= 140 || input.diastolic >= 90) {
          classification = "pre-hipertensao";
        }

        const pressureId = await createBloodPressure({
          userId: input.userId,
          date: new Date(input.date),
          systolic: input.systolic,
          diastolic: input.diastolic,
          notes: input.notes,
          classification,
        });

        return {
          success: true,
          pressureId,
          classification,
        };
      }),

    /**
     * Buscar pressão arterial de um funcionário
     */
    getByEmployee: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const pressure = await getBloodPressureByEmployee(input.employeeId);
        return pressure;
      }),

    /**
     * Buscar última pressão arterial
     */
    getLatest: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const pressure = await getBloodPressureByEmployee(input.employeeId);
        return pressure[0] || null;
      }),

    /**
     * Listar toda a pressão arterial
     */
    list: publicProcedure.query(async () => {
      const allPressure = await getAllBloodPressure();
      return allPressure;
    }),
  }),

  // ==================== QUEIXAS DE SAÚDE ====================
  complaints: router({
    /**
     * Criar queixa de saúde
     */
    create: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          date: z.string(), // YYYY-MM-DD
          complaint: z.string(),
          severity: z.enum(["leve", "moderada", "grave"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const complaintId = await createComplaint({
          userId: input.userId,
          date: new Date(input.date),
          complaint: input.complaint,
          severity: input.severity,
          notes: input.notes,
          resolved: 0,
        });

        return {
          success: true,
          complaintId,
        };
      }),

    /**
     * Buscar queixas de um funcionário
     */
    getByEmployee: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const complaints = await getComplaintsByEmployee(input.employeeId);
        return complaints;
      }),

    /**
     * Marcar queixa como resolvida
     */
    resolve: publicProcedure
      .input(z.object({ complaintId: z.number() }))
      .mutation(async ({ input }) => {
        await updateComplaint(input.complaintId, { resolved: 1 });
        return { success: true };
      }),

    /**
     * Listar todas as queixas
     */
    list: publicProcedure.query(async () => {
      const allComplaints = await getAllComplaints();
      return allComplaints;
    }),
  }),
});
