import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import {
  getCheckInsByEmployee,
  getAllCheckIns,
  createCheckIn,
} from "../../db";

/**
 * API tRPC para gerenciamento de check-ins diários
 */

export const checkInsRouter = router({
  /**
   * Criar novo check-in
   */
  create: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        date: z.string(), // formato: YYYY-MM-DD
        mood: z.enum(["bem", "dor_leve", "dor_forte"]),
        symptoms: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const checkInId = await createCheckIn({
        userId: input.userId,
        date: new Date(input.date),
        mood: input.mood,
        symptoms: input.symptoms ? JSON.stringify(input.symptoms) : null,
        notes: input.notes,
      });

      return {
        success: true,
        checkInId,
      };
    }),

  /**
   * Buscar check-ins de um funcionário
   */
  getByEmployee: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const checkIns = await getCheckInsByEmployee(input.employeeId);
      return checkIns;
    }),

  /**
   * Buscar check-in de hoje de um funcionário
   */
  getToday: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const today = new Date().toISOString().split("T")[0];
      const checkIns = await getCheckInsByEmployee(input.employeeId);
      const todayCheckIn = checkIns.find((c) => {
        const checkInDate = c.date instanceof Date ? c.date.toISOString().split("T")[0] : c.date;
        return checkInDate === today;
      });
      return todayCheckIn || null;
    }),

  /**
   * Listar todos os check-ins
   */
  list: publicProcedure.query(async () => {
    const allCheckIns = await getAllCheckIns();
    return allCheckIns;
  }),
});
