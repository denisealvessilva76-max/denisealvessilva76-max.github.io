import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router para gerenciar perfil de empregados
 * 
 * Permite:
 * - Criar/atualizar perfil com matrícula e nome
 * - Carregar perfil existente por matrícula
 * - Salvar dados adicionais (cargo, departamento, peso, altura)
 */

const employeeProfileSchema = z.object({
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  department: z.string().optional(),
  position: z.string().optional(), // cargo
  weight: z.number().optional(),
  height: z.number().optional(),
  workType: z.enum(["leve", "moderado", "pesado"]).optional(),
});

export const employeeProfileRouter = router({
  /**
   * Salvar ou atualizar perfil do empregado
   */
  saveProfile: publicProcedure
    .input(employeeProfileSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // Verificar se já existe um empregado com essa matrícula
        const existing = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        if (existing.length > 0) {
          // Atualizar empregado existente
          const employeeId = existing[0].id;
          await db
            .update(employees)
            .set({
              name: input.name,
              cpf: input.cpf,
              email: input.email || existing[0].email,
              department: input.department || existing[0].department,
              position: input.position || existing[0].position,
              weight: input.weight || existing[0].weight,
              height: input.height || existing[0].height,
              workType: input.workType || existing[0].workType,
              lastLogin: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(employees.id, employeeId));

          return {
            success: true,
            employee: {
              id: employeeId,
              ...input,
              workerId: existing[0].workerId,
            },
            isNew: false,
          };
        } else {
          // Criar novo empregado
          // Gerar workerId único (ID anônimo)
          const workerId = `WRK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          await db.insert(employees).values({
            matricula: input.matricula,
            name: input.name,
            cpf: input.cpf,
            email: input.email || null,
            department: input.department || null,
            position: input.position || null,
            weight: input.weight || null,
            height: input.height || null,
            workType: input.workType || null,
            workerId,
            lastLogin: new Date(),
          });

          // Buscar o empregado recém-criado
          const newEmployee = await db
            .select()
            .from(employees)
            .where(eq(employees.matricula, input.matricula))
            .limit(1);

          return {
            success: true,
            employee: newEmployee[0],
            isNew: true,
          };
        }
      } catch (error) {
        console.error("[EmployeeProfile] Error saving profile:", error);
        throw new Error("Failed to save profile");
      }
    }),

  /**
   * Carregar perfil do empregado por matrícula
   */
  getProfile: publicProcedure
    .input(z.object({ matricula: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return null;
      }

      try {
        const result = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        if (result.length === 0) {
          return null;
        }

        return result[0];
      } catch (error) {
        console.error("[EmployeeProfile] Error getting profile:", error);
        return null;
      }
    }),

  /**
   * Verificar se matrícula existe
   */
  checkMatricula: publicProcedure
    .input(z.object({ matricula: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { exists: false };
      }

      try {
        const result = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        return {
          exists: result.length > 0,
          employee: result.length > 0 ? result[0] : null,
        };
      } catch (error) {
        console.error("[EmployeeProfile] Error checking matricula:", error);
        return { exists: false };
      }
    }),
});
