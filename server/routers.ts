import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { checkIns, userHydration, bloodPressureRecords, challengeProgress, complaints, gamificationData } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Routers de sincronização
  sync: router({
    checkIns: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          mood: z.string(),
          symptoms: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          const [checkIn] = await db
            .insert(checkIns)
            .values({
              userId: ctx.user.id,
              date: new Date(input.date),
              mood: input.mood,
              symptoms: input.symptoms || [],
              notes: input.notes,
            })
            .$returningId();

          return {
            success: true,
            id: checkIn.id,
          };
        } catch (error) {
          console.error("Erro ao sincronizar check-in:", error);
          return {
            success: false,
            error: "Falha ao sincronizar check-in",
          };
        }
      }),

    hydration: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          cupsConsumed: z.number(),
          totalMl: z.number(),
          goalMl: z.number(),
          weight: z.number().optional(),
          height: z.number().optional(),
          workType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          // Verificar se já existe registro para esta data
          const results = await db
            .select()
            .from(userHydration)
            .where(
              and(
                eq(userHydration.userId, ctx.user.id),
                sql`${userHydration.date} = ${input.date}`
              )
            )
            .limit(1);

          const existing = results.length > 0 ? results[0] : null;

          if (existing) {
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
              .where(eq(userHydration.id, existing.id));

            return {
              success: true,
              id: existing.id,
              updated: true,
            };
          } else {
            // Criar novo registro
            const [hydration] = await db
              .insert(userHydration)
              .values({
                userId: ctx.user.id,
                date: new Date(input.date),
                cupsConsumed: input.cupsConsumed,
                totalMl: input.totalMl,
                goalMl: input.goalMl,
                weight: input.weight,
                height: input.height,
                workType: input.workType,
              })
              .$returningId();

            return {
              success: true,
              id: hydration.id,
              updated: false,
            };
          }
        } catch (error) {
          console.error("Erro ao sincronizar hidratação:", error);
          return {
            success: false,
            error: "Falha ao sincronizar hidratação",
          };
        }
      }),

    bloodPressure: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          systolic: z.number(),
          diastolic: z.number(),
          notes: z.string().optional(),
          classification: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          const [record] = await db
            .insert(bloodPressureRecords)
            .values({
              userId: ctx.user.id,
              date: new Date(input.date),
              systolic: input.systolic,
              diastolic: input.diastolic,
              notes: input.notes,
              classification: input.classification,
            })
            .$returningId();

          return {
            success: true,
            id: record.id,
          };
        } catch (error) {
          console.error("Erro ao sincronizar pressão arterial:", error);
          return {
            success: false,
            error: "Falha ao sincronizar pressão arterial",
          };
        }
      }),

    challengeProgress: protectedProcedure
      .input(
        z.object({
          challengeId: z.string(),
          currentValue: z.number(),
          targetValue: z.number(),
          completed: z.boolean(),
          photoUri: z.string().optional(),
          startDate: z.string(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          // Verificar se já existe progresso para este desafio
          const results = await db
            .select()
            .from(challengeProgress)
            .where(
              and(
                eq(challengeProgress.userId, ctx.user.id),
                eq(challengeProgress.challengeId, input.challengeId)
              )
            )
            .limit(1);

          const existing = results.length > 0 ? results[0] : null;

          if (existing) {
            // Atualizar progresso existente
            await db
              .update(challengeProgress)
              .set({
                currentValue: input.currentValue,
                completed: input.completed ? 1 : 0,
                photoUri: input.photoUri,
                endDate: input.endDate ? new Date(input.endDate) : null,
                completedAt: input.completed ? new Date() : null,
              })
              .where(eq(challengeProgress.id, existing.id));

            return {
              success: true,
              id: existing.id,
              updated: true,
            };
          } else {
            // Criar novo progresso
            const [progress] = await db
              .insert(challengeProgress)
              .values({
                userId: ctx.user.id,
                challengeId: input.challengeId,
                currentValue: input.currentValue,
                targetValue: input.targetValue,
                completed: input.completed ? 1 : 0,
                photoUri: input.photoUri,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                completedAt: input.completed ? new Date() : null,
              })
              .$returningId();

            return {
              success: true,
              id: progress.id,
              updated: false,
            };
          }
        } catch (error) {
          console.error("Erro ao sincronizar progresso de desafio:", error);
          return {
            success: false,
            error: "Falha ao sincronizar progresso de desafio",
           }
        }
      }),

    complaints: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          complaint: z.string(),
          severity: z.string(),
          resolved: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          const [complaint] = await db
            .insert(complaints)
            .values({
              userId: ctx.user.id,
              date: new Date(input.date),
              complaint: input.complaint,
              severity: input.severity,
              resolved: input.resolved ? 1 : 0,
              notes: input.notes,
            })
            .$returningId();

          return {
            success: true,
            id: complaint.id,
          };
        } catch (error) {
          console.error("Erro ao sincronizar queixa:", error);
          return {
            success: false,
            error: "Falha ao sincronizar queixa",
          };
        }
      }),

    gamification: protectedProcedure
      .input(
        z.object({
          totalPoints: z.number(),
          currentStreak: z.number(),
          longestStreak: z.number(),
          lastCheckInDate: z.string().optional(),
          achievements: z.array(z.any()).optional(),
          badges: z.array(z.any()).optional(),
          consistencyPoints: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return {
              success: false,
              error: "Banco de dados não disponível",
            };
          }

          // Verificar se já existe registro de gamificação
          const results = await db
            .select()
            .from(gamificationData)
            .where(eq(gamificationData.userId, ctx.user.id))
            .limit(1);

          const existing = results.length > 0 ? results[0] : null;

          if (existing) {
            // Atualizar registro existente
            await db
              .update(gamificationData)
              .set({
                totalPoints: input.totalPoints,
                currentStreak: input.currentStreak,
                longestStreak: input.longestStreak,
                lastCheckInDate: input.lastCheckInDate ? new Date(input.lastCheckInDate) : null,
                achievements: input.achievements || [],
                badges: input.badges || [],
                consistencyPoints: input.consistencyPoints || 0,
              })
              .where(eq(gamificationData.id, existing.id));

            return {
              success: true,
              id: existing.id,
              updated: true,
            };
          } else {
            // Criar novo registro
            const [gamification] = await db
              .insert(gamificationData)
              .values({
                userId: ctx.user.id,
                totalPoints: input.totalPoints,
                currentStreak: input.currentStreak,
                longestStreak: input.longestStreak,
                lastCheckInDate: input.lastCheckInDate ? new Date(input.lastCheckInDate) : null,
                achievements: input.achievements || [],
                badges: input.badges || [],
                consistencyPoints: input.consistencyPoints || 0,
              })
              .$returningId();

            return {
              success: true,
              id: gamification.id,
              updated: false,
            };
          }
        } catch (error) {
          console.error("Erro ao sincronizar gamificação:", error);
          return {
            success: false,
            error: "Falha ao sincronizar gamificação",
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
