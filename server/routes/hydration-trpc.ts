import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { userHydration, employees } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const hydrationTrpcRouter = router({
  /**
   * Salvar registro de hidratação
   * Aceita matrícula para identificar o empregado
   */
  saveHydration: publicProcedure
    .input(
      z.object({
        matricula: z.string().min(1, "Matrícula é obrigatória"),
        cupsConsumed: z.number().min(0),
        totalMl: z.number().min(0),
        goalMl: z.number().min(0),
        weight: z.number().optional(),
        height: z.number().optional(),
        workType: z.enum(["leve", "moderado", "pesado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Banco de dados não disponível");
        }

        // Buscar empregado pela matrícula
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        if (!employee) {
          throw new Error("Empregado não encontrado");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Verificar se já existe registro de hidratação para hoje
        const [existingHydration] = await db
          .select()
          .from(userHydration)
          .where(
            and(
              eq(userHydration.userId, employee.id),
              sql`DATE(${userHydration.date}) = DATE(${today})`
            )
          )
          .limit(1);

        if (existingHydration) {
          // Atualizar registro existente
          await db
            .update(userHydration)
            .set({
              cupsConsumed: input.cupsConsumed,
              totalMl: input.totalMl,
              goalMl: input.goalMl,
              weight: input.weight,
              height: input.height,
              workType: input.workType,
            })
            .where(eq(userHydration.id, existingHydration.id));

          return {
            success: true,
            message: "Hidratação atualizada com sucesso",
            hydration: {
              ...existingHydration,
              cupsConsumed: input.cupsConsumed,
              totalMl: input.totalMl,
              goalMl: input.goalMl,
              weight: input.weight,
              height: input.height,
              workType: input.workType,
            },
          };
        } else {
          // Criar novo registro
          const [result] = await db.insert(userHydration).values({
            userId: employee.id,
            date: today,
            cupsConsumed: input.cupsConsumed,
            totalMl: input.totalMl,
            goalMl: input.goalMl,
            weight: input.weight,
            height: input.height,
            workType: input.workType,
          });

          return {
            success: true,
            message: "Hidratação salva com sucesso",
            hydration: {
              id: Number(result.insertId),
              userId: employee.id,
              date: today,
              cupsConsumed: input.cupsConsumed,
              totalMl: input.totalMl,
              goalMl: input.goalMl,
              weight: input.weight,
              height: input.height,
              workType: input.workType,
            },
          };
        }
      } catch (error) {
        console.error("Erro ao salvar hidratação:", error);
        throw new Error(
          error instanceof Error ? error.message : "Falha ao salvar hidratação"
        );
      }
    }),

  /**
   * Carregar registros de hidratação de um empregado
   */
  getHydration: publicProcedure
    .input(
      z.object({
        matricula: z.string().min(1, "Matrícula é obrigatória"),
        limit: z.number().optional().default(30), // Últimos 30 dias por padrão
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Banco de dados não disponível");
        }

        // Buscar empregado pela matrícula
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        if (!employee) {
          throw new Error("Empregado não encontrado");
        }

        // Buscar registros de hidratação do empregado
        const hydrationList = await db
          .select()
          .from(userHydration)
          .where(eq(userHydration.userId, employee.id))
          .orderBy(sql`${userHydration.date} DESC`)
          .limit(input.limit);

        return {
          success: true,
          hydration: hydrationList,
        };
      } catch (error) {
        console.error("Erro ao carregar hidratação:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Falha ao carregar hidratação"
        );
      }
    }),

  /**
   * Obter hidratação de hoje
   */
  getTodayHydration: publicProcedure
    .input(
      z.object({
        matricula: z.string().min(1, "Matrícula é obrigatória"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Banco de dados não disponível");
        }

        // Buscar empregado pela matrícula
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.matricula, input.matricula))
          .limit(1);

        if (!employee) {
          throw new Error("Empregado não encontrado");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar hidratação de hoje
        const [todayHydration] = await db
          .select()
          .from(userHydration)
          .where(
            and(
              eq(userHydration.userId, employee.id),
              sql`DATE(${userHydration.date}) = DATE(${today})`
            )
          )
          .limit(1);

        return {
          success: true,
          hydration: todayHydration || null,
        };
      } catch (error) {
        console.error("Erro ao carregar hidratação de hoje:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Falha ao carregar hidratação de hoje"
        );
      }
    }),
});
