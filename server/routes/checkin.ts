import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { checkIns, employees } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const checkinRouter = router({
  /**
   * Salvar check-in diário
   * Aceita matrícula para identificar o empregado
   */
  saveCheckIn: publicProcedure
    .input(
      z.object({
        matricula: z.string().min(1, "Matrícula é obrigatória"),
        mood: z.enum(["bem", "dor-leve", "dor-forte"]),
        symptoms: z.array(z.string()).optional(),
        notes: z.string().optional(),
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

        // Verificar se já existe check-in para hoje
        const [existingCheckIn] = await db
          .select()
          .from(checkIns)
          .where(
            and(
              eq(checkIns.userId, employee.id),
              sql`DATE(${checkIns.date}) = DATE(${today})`
            )
          )
          .limit(1);

        if (existingCheckIn) {
          // Atualizar check-in existente
          await db
            .update(checkIns)
            .set({
              mood: input.mood,
              symptoms: input.symptoms || [],
              notes: input.notes || "",
            })
            .where(eq(checkIns.id, existingCheckIn.id));

          return {
            success: true,
            message: "Check-in atualizado com sucesso",
            checkIn: {
              ...existingCheckIn,
              mood: input.mood,
              symptoms: input.symptoms || [],
              notes: input.notes || "",
            },
          };
        } else {
          // Criar novo check-in
          const [result] = await db.insert(checkIns).values({
            userId: employee.id,
            date: today,
            mood: input.mood,
            symptoms: input.symptoms || [],
            notes: input.notes || "",
          });

          return {
            success: true,
            message: "Check-in salvo com sucesso",
            checkIn: {
              id: Number(result.insertId),
              userId: employee.id,
              date: today,
              mood: input.mood,
              symptoms: input.symptoms || [],
              notes: input.notes || "",
            },
          };
        }
      } catch (error) {
        console.error("Erro ao salvar check-in:", error);
        throw new Error(
          error instanceof Error ? error.message : "Falha ao salvar check-in"
        );
      }
    }),

  /**
   * Carregar check-ins de um empregado
   */
  getCheckIns: publicProcedure
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

        // Buscar check-ins do empregado
        const checkInsList = await db
          .select()
          .from(checkIns)
          .where(eq(checkIns.userId, employee.id))
          .orderBy(sql`${checkIns.date} DESC`)
          .limit(input.limit);

        return {
          success: true,
          checkIns: checkInsList,
        };
      } catch (error) {
        console.error("Erro ao carregar check-ins:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Falha ao carregar check-ins"
        );
      }
    }),

  /**
   * Obter check-in de hoje
   */
  getTodayCheckIn: publicProcedure
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

        // Buscar check-in de hoje
        const [todayCheckIn] = await db
          .select()
          .from(checkIns)
          .where(
            and(
              eq(checkIns.userId, employee.id),
              sql`DATE(${checkIns.date}) = DATE(${today})`
            )
          )
          .limit(1);

        return {
          success: true,
          checkIn: todayCheckIn || null,
        };
      } catch (error) {
        console.error("Erro ao carregar check-in de hoje:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Falha ao carregar check-in de hoje"
        );
      }
    }),
});
