import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
} from "../../db";
import { employees } from "../../../drizzle/schema";
import { getDb } from "../../db";
import { eq } from "drizzle-orm";

/**
 * API tRPC para gerenciamento de funcionários
 */

export const employeesRouter = router({
  /**
   * Criar novo funcionário
   */
  create: publicProcedure
    .input(
      z.object({
        cpf: z.string().length(11),
        matricula: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
        workType: z.enum(["leve", "moderado", "pesado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Gerar workerId único (anônimo)
      const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const employeeId = await createEmployee({
        ...input,
        workerId,
        isActive: 1,
      });

      return {
        success: true,
        employeeId,
        workerId,
      };
    }),

  /**
   * Buscar funcionário por CPF
   */
  getByCpf: publicProcedure
    .input(z.object({ cpf: z.string().length(11) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.cpf, input.cpf))
        .limit(1);

      return employee || null;
    }),

  /**
   * Buscar funcionário por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const employee = await getEmployeeById(input.id);
      return employee || null;
    }),

  /**
   * Atualizar dados do funcionário
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
        workType: z.enum(["leve", "moderado", "pesado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await updateEmployee(id, updateData);
      return { success: true };
    }),

  /**
   * Listar todos os funcionários ativos
   */
  list: publicProcedure.query(async () => {
    const allEmployees = await getAllEmployees();
    return allEmployees;
  }),

  /**
   * Atualizar último login
   */
  updateLastLogin: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateEmployee(input.id, { lastLogin: new Date() });
      return { success: true };
    }),
});
