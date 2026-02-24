import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { users, checkIns, userHydration, bloodPressureRecords, challengeProgress, complaints, gamificationData, challengePhotos, employees } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { employeeProfileRouter } from "./routes/employee-profile";
import { checkinRouter } from "./routes/checkin";
import { hydrationTrpcRouter } from "./routes/hydration-trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  employeeProfile: employeeProfileRouter,
  checkin: checkinRouter,
  hydration: hydrationTrpcRouter,
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

  // Router de autenticação de funcionários
  employeeAuth: router({
    // Registrar novo funcionário
    register: publicProcedure
      .input(
        z.object({
          name: z.string(),
          cpf: z.string().length(11), // CPF sem pontos/traços
          matricula: z.string(),
          weight: z.number(),
          height: z.number(),
          setor: z.string(),
          cargo: z.string(),
          workType: z.enum(["leve", "moderado", "pesado"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return { success: false, error: "Banco de dados não disponível" };
          }

          // Verificar se CPF já existe
          const existingEmployeeResult = await db.select().from(employees).where(eq(employees.cpf, input.cpf)).limit(1);
          const existingEmployee = existingEmployeeResult[0];

          if (existingEmployee) {
            return { success: false, error: "CPF já cadastrado" };
          }

          // Verificar se matrícula já existe
          const existingMatriculaResult = await db.select().from(employees).where(eq(employees.matricula, input.matricula)).limit(1);
          const existingMatricula = existingMatriculaResult[0];

          if (existingMatricula) {
            return { success: false, error: "Matrícula já cadastrada" };
          }

          // Gerar workerId único
          const workerId = `EMP-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          // Calcular meta de hidratação
          let hydrationGoal = input.weight * 35;
          const workMultiplier = {
            leve: 1.0,
            moderado: 1.3,
            pesado: 1.6,
          };
          hydrationGoal *= workMultiplier[input.workType];
          if (input.height > 180) hydrationGoal *= 1.1;
          else if (input.height < 160) hydrationGoal *= 0.95;
          hydrationGoal = Math.round(hydrationGoal / 150) * 150;

          // Criar funcionário
          const [newEmployee] = await db
            .insert(employees)
            .values({
              cpf: input.cpf,
              matricula: input.matricula,
              workerId,
              name: input.name,
              department: input.setor,
              position: input.cargo,
              weight: input.weight,
              height: input.height,
              workType: input.workType,
            });

          return {
            success: true,
            message: "Cadastro realizado com sucesso!",
            employee: {
              id: newEmployee.insertId,
              cpf: input.cpf,
              matricula: input.matricula,
              name: input.name,
              setor: input.setor,
              cargo: input.cargo,
              workerId,
              hydrationGoal,
            },
          };
        } catch (error) {
          console.error("Erro ao registrar funcionário:", error);
          return { success: false, error: "Erro ao registrar funcionário" };
        }
      }),

    // Login de funcionário
    login: publicProcedure
      .input(
        z.object({
          cpf: z.string().length(11),
          matricula: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) {
            return { success: false, error: "Banco de dados não disponível" };
          }

          // Buscar funcionário por CPF e matrícula
          const result = await db.select().from(employees).where(
            and(eq(employees.cpf, input.cpf), eq(employees.matricula, input.matricula))
          ).limit(1);
          const employee = result[0];

          if (!employee) {
            return { success: false, error: "CPF ou matrícula inválidos" };
          }

          if (!employee.isActive) {
            return { success: false, error: "Funcionário inativo" };
          }

          // Atualizar lastLogin
          await db
            .update(employees)
            .set({ lastLogin: new Date() })
            .where(eq(employees.id, employee.id));

          return {
            success: true,
            employee: {
              id: employee.id,
              cpf: employee.cpf,
              matricula: employee.matricula,
              workerId: employee.workerId,
              nome: employee.name,
              setor: employee.department,
              cargo: employee.position,
              email: employee.email,
              peso: employee.weight,
              altura: employee.height,
            },
          };
        } catch (error) {
          console.error("Erro ao fazer login:", error);
          return { success: false, error: "Erro ao fazer login" };
        }
      }),

    // Buscar funcionário por ID
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Banco de dados não disponível" };
        }

        const employeeResult = await db.select().from(employees).where(eq(employees.id, input.id)).limit(1);
        const employee = employeeResult[0];

        if (!employee) {
          return { success: false, error: "Funcionário não encontrado" };
        }

        return {
          success: true,
          employee: {
            id: employee.id,
            cpf: employee.cpf,
            matricula: employee.matricula,
            workerId: employee.workerId,
            nome: employee.name,
            setor: employee.department,
            cargo: employee.position,
            email: employee.email,
            peso: employee.weight,
            altura: employee.height,
          },
        };
      } catch (error) {
        console.error("Erro ao buscar funcionário:", error);
        return { success: false, error: "Erro ao buscar funcionário" };
      }
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

  // Endpoint de estatísticas do dashboard admin
  admin: router({
    dashboardStats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Banco de dados não disponível");
        }

        // TODO: Verificar se usuário é admin (ctx.user.role === 'admin')
        // Por enquanto, qualquer usuário autenticado pode acessar

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // 1. Total de check-ins
        const [checkInsToday] = await db
          .select({ count: sql<number>`count(*)` })
          .from(checkIns)
          .where(sql`DATE(${checkIns.date}) = DATE(${today})`);

        const [checkInsWeek] = await db
          .select({ count: sql<number>`count(*)` })
          .from(checkIns)
          .where(sql`${checkIns.date} >= ${weekAgo}`);

        const [checkInsMonth] = await db
          .select({ count: sql<number>`count(*)` })
          .from(checkIns)
          .where(sql`${checkIns.date} >= ${monthAgo}`);

        // 2. Média de hidratação da equipe (últimos 7 dias)
        const [avgHydration] = await db
          .select({ avg: sql<number>`AVG(${userHydration.totalMl})` })
          .from(userHydration)
          .where(sql`${userHydration.date} >= ${weekAgo}`);

        // 3. Alertas de pressão arterial elevada (últimos 30 dias)
        const pressureAlerts = await db
          .select({
            userId: bloodPressureRecords.userId,
            systolic: bloodPressureRecords.systolic,
            diastolic: bloodPressureRecords.diastolic,
            date: bloodPressureRecords.date,
          })
          .from(bloodPressureRecords)
          .where(
            and(
              sql`${bloodPressureRecords.date} >= ${monthAgo}`,
              sql`(${bloodPressureRecords.systolic} >= 140 OR ${bloodPressureRecords.diastolic} >= 90)`
            )
          )
          .orderBy(sql`${bloodPressureRecords.date} DESC`)
          .limit(20);

        // 4. Queixas pendentes (sem resposta)
        const [pendingComplaints] = await db
          .select({ count: sql<number>`count(*)` })
          .from(complaints)
          .where(eq(complaints.resolved, 0));

        // 5. Taxa de conclusão de desafios (últimos 30 dias)
        const [challengeStats] = await db
          .select({
            total: sql<number>`count(*)`,
            completed: sql<number>`SUM(CASE WHEN ${challengeProgress.completed} = 1 THEN 1 ELSE 0 END)`,
          })
          .from(challengeProgress)
          .where(sql`${challengeProgress.startDate} >= ${monthAgo}`);

        const completionRate =
          challengeStats && challengeStats.total > 0
            ? (Number(challengeStats.completed) / Number(challengeStats.total)) * 100
            : 0;

        // 6. Ranking de pontuação (top 10)
        const topUsers = await db
          .select({
            userId: gamificationData.userId,
            totalPoints: gamificationData.totalPoints,
            currentStreak: gamificationData.currentStreak,
          })
          .from(gamificationData)
          .orderBy(sql`${gamificationData.totalPoints} DESC`)
          .limit(10);

        return {
          checkIns: {
            today: Number(checkInsToday?.count || 0),
            week: Number(checkInsWeek?.count || 0),
            month: Number(checkInsMonth?.count || 0),
          },
          hydration: {
            averageWeekly: Math.round(Number(avgHydration?.avg || 0)),
          },
          pressureAlerts: {
            count: pressureAlerts.length,
            recent: pressureAlerts.slice(0, 5).map((alert) => ({
              userId: alert.userId,
              systolic: alert.systolic,
              diastolic: alert.diastolic,
              date: alert.date,
            })),
          },
          complaints: {
            pending: Number(pendingComplaints?.count || 0),
          },
          challenges: {
            completionRate: Math.round(completionRate),
            total: Number(challengeStats?.total || 0),
            completed: Number(challengeStats?.completed || 0),
          },
          ranking: topUsers.map((user, index) => ({
            position: index + 1,
            userId: user.userId,
            points: user.totalPoints,
            streak: user.currentStreak,
          })),
        };
      } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error);
        throw new Error("Falha ao buscar estatísticas");
      }
    }),

    // Listar todos os funcionários cadastrados
    listEmployees: publicProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Banco de dados não disponível");
        }

        const employeesList = await db
          .select({
            id: employees.id,
            workerId: employees.workerId,
            name: employees.name,
            matricula: employees.matricula,
            department: employees.department,
            position: employees.position,
            isActive: employees.isActive,
            lastLogin: employees.lastLogin,
          })
          .from(employees)
          .where(eq(employees.isActive, 1))
          .orderBy(sql`${employees.name} ASC`);

        return {
          success: true,
          employees: employeesList,
        };
      } catch (error) {
        console.error("Erro ao listar funcionários:", error);
        throw new Error("Falha ao listar funcionários");
      }
    }),

    // Buscar dados detalhados de um funcionário
    getEmployeeDetails: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error("Banco de dados não disponível");
          }

          // Buscar dados do funcionário
          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, input.employeeId))
            .limit(1);

          if (!employee) {
            throw new Error("Funcionário não encontrado");
          }

          // Buscar check-ins (últimos 30 dias)
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);

          const employeeCheckIns = await db
            .select()
            .from(checkIns)
            .where(
              and(
                eq(checkIns.userId, input.employeeId),
                sql`${checkIns.date} >= ${monthAgo}`
              )
            )
            .orderBy(sql`${checkIns.date} DESC`);

          // Buscar hidratação (últimos 7 dias)
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const hydrationData = await db
            .select()
            .from(userHydration)
            .where(
              and(
                eq(userHydration.userId, input.employeeId),
                sql`${userHydration.date} >= ${weekAgo}`
              )
            )
            .orderBy(sql`${userHydration.date} DESC`);

          // Buscar pressão arterial (últimos 30 dias)
          const pressureData = await db
            .select()
            .from(bloodPressureRecords)
            .where(
              and(
                eq(bloodPressureRecords.userId, input.employeeId),
                sql`${bloodPressureRecords.date} >= ${monthAgo}`
              )
            )
            .orderBy(sql`${bloodPressureRecords.date} DESC`);

          // Buscar queixas (últimas 10)
          const complaintsData = await db
            .select()
            .from(complaints)
            .where(eq(complaints.userId, input.employeeId))
            .orderBy(sql`${complaints.date} DESC`)
            .limit(10);

          // Buscar desafios ativos
          const activeChallenges = await db
            .select()
            .from(challengeProgress)
            .where(
              and(
                eq(challengeProgress.userId, input.employeeId),
                eq(challengeProgress.completed, 0)
              )
            );

          // Buscar gamificação
          const [gamification] = await db
            .select()
            .from(gamificationData)
            .where(eq(gamificationData.userId, input.employeeId))
            .limit(1);

          return {
            success: true,
            employee: {
              id: employee.id,
              workerId: employee.workerId,
              name: employee.name,
              matricula: employee.matricula,
              cpf: employee.cpf,
              department: employee.department,
              position: employee.position,
              weight: employee.weight,
              height: employee.height,
              workType: employee.workType,
              email: employee.email,
              isActive: employee.isActive,
              lastLogin: employee.lastLogin,
            },
            checkIns: employeeCheckIns,
            hydration: hydrationData,
            pressure: pressureData,
            complaints: complaintsData,
            challenges: activeChallenges,
            gamification: gamification || null,
          };
        } catch (error) {
          console.error("Erro ao buscar detalhes do funcionário:", error);
          throw new Error("Falha ao buscar detalhes do funcionário");
        }
      }),

    // Endpoint para enviar notificações push
    sendNotification: protectedProcedure
      .input(
        z.object({
          targetUserId: z.number().optional(), // ID do usuário específico
          targetGroup: z.enum(["all", "high_pressure", "pending_complaints", "inactive"]).optional(), // Grupo de usuários
          title: z.string().min(1).max(100),
          body: z.string().min(1).max(500),
          data: z.record(z.string(), z.any()).optional(), // Dados extras
          template: z.enum(["exam_reminder", "appointment", "safety_alert", "custom"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error("Banco de dados não disponível");
          }

          // TODO: Verificar se usuário é admin (ctx.user.role === 'admin')
          // Por enquanto, qualquer usuário autenticado pode enviar

          // TODO: Implementar rate limiting (máx 100 notificações/hora)

          let targetUserIds: number[] = [];

          // 1. Determinar usuários alvo
          if (input.targetUserId) {
            // Enviar para usuário específico
            targetUserIds = [input.targetUserId];
          } else if (input.targetGroup) {
            // Enviar para grupo
            switch (input.targetGroup) {
              case "all":
                // Todos os usuários
                const allUsers = await db.select({ id: users.id }).from(users);
                targetUserIds = allUsers.map((u) => u.id);
                break;

              case "high_pressure":
                // Usuários com pressão alta recente
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                const highPressureUsers = await db
                  .select({ userId: bloodPressureRecords.userId })
                  .from(bloodPressureRecords)
                  .where(
                    and(
                      sql`${bloodPressureRecords.date} >= ${monthAgo}`,
                      sql`(${bloodPressureRecords.systolic} >= 140 OR ${bloodPressureRecords.diastolic} >= 90)`
                    )
                  )
                  .groupBy(bloodPressureRecords.userId);
                targetUserIds = highPressureUsers.map((u) => u.userId);
                break;

              case "pending_complaints":
                // Usuários com queixas pendentes
                const pendingUsers = await db
                  .select({ userId: complaints.userId })
                  .from(complaints)
                  .where(eq(complaints.resolved, 0))
                  .groupBy(complaints.userId);
                targetUserIds = pendingUsers.map((u) => u.userId);
                break;

              case "inactive":
                // Usuários sem check-in nos últimos 7 dias
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const allUserIds = await db.select({ id: users.id }).from(users);
                const activeUsers = await db
                  .select({ userId: checkIns.userId })
                  .from(checkIns)
                  .where(sql`${checkIns.date} >= ${weekAgo}`)
                  .groupBy(checkIns.userId);
                const activeUserIds = new Set(activeUsers.map((u) => u.userId));
                targetUserIds = allUserIds
                  .filter((u) => !activeUserIds.has(u.id))
                  .map((u) => u.id);
                break;
            }
          } else {
            throw new Error("Deve especificar targetUserId ou targetGroup");
          }

          // 2. Aplicar template se fornecido
          let finalTitle = input.title;
          let finalBody = input.body;

          if (input.template && input.template !== "custom") {
            const templates = {
              exam_reminder: {
                title: "👨‍⚕️ Lembrete de Exame",
                body: "Olá! Você tem um exame agendado. Não esqueça de comparecer.",
              },
              appointment: {
                title: "📅 Consulta Agendada",
                body: "Sua consulta com o SESMT foi agendada. Verifique os detalhes no app.",
              },
              safety_alert: {
                title: "⚠️ Alerta de Segurança",
                body: "Atenção: Alerta importante sobre segurança no trabalho.",
              },
            };

            const template = templates[input.template];
            if (template) {
              finalTitle = template.title;
              finalBody = input.body || template.body; // Usar body customizado se fornecido
            }
          }

          // 3. Enviar notificações
          // NOTA: Esta implementação é um placeholder.
          // Para enviar notificações push reais, você precisa:
          // 1. Armazenar push tokens dos usuários (Expo Push Tokens)
          // 2. Usar a API do Expo Push Notifications
          // 3. Implementar fila de envio (ex: Bull, BeeQueue)

          const notificationsSent: number[] = [];
          const notificationsFailed: number[] = [];

          for (const userId of targetUserIds) {
            try {
              // TODO: Buscar push token do usuário
              // const pushToken = await getPushToken(userId);

              // TODO: Enviar notificação via Expo Push API
              // await sendExpoPushNotification(pushToken, {
              //   title: finalTitle,
              //   body: finalBody,
              //   data: input.data,
              // });

              notificationsSent.push(userId);
            } catch (error) {
              console.error(`Erro ao enviar notificação para usuário ${userId}:`, error);
              notificationsFailed.push(userId);
            }
          }

          // 4. Salvar histórico (opcional)
          // TODO: Criar tabela notification_history para armazenar histórico

          return {
            success: true,
            sent: notificationsSent.length,
            failed: notificationsFailed.length,
            targetUserIds,
            message: `Notificações enviadas para ${notificationsSent.length} usuário(s)`,
          };
        } catch (error) {
          console.error("Erro ao enviar notificações:", error);
          throw new Error("Falha ao enviar notificações");
        }
      }),
  }),

  // Endpoint de relatório de saúde do usuário
  user: router({
    healthReport: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(), // Data de início (YYYY-MM-DD)
          endDate: z.string().optional(), // Data de fim (YYYY-MM-DD)
          period: z.enum(["7", "30", "90", "custom"]).default("90"), // Período predefinido
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error("Banco de dados não disponível");
          }

          // Determinar período
          let startDate: Date;
          let endDate: Date = new Date();

          if (input.period === "custom" && input.startDate && input.endDate) {
            startDate = new Date(input.startDate);
            endDate = new Date(input.endDate);
          } else {
            const days = parseInt(input.period);
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
          }

          // 1. Buscar check-ins
          const checkInsData = await db
            .select({
              date: checkIns.date,
              mood: checkIns.mood,
              symptoms: checkIns.symptoms,
              notes: checkIns.notes,
            })
            .from(checkIns)
            .where(
              and(
                eq(checkIns.userId, ctx.user.id),
                sql`${checkIns.date} >= ${startDate}`,
                sql`${checkIns.date} <= ${endDate}`
              )
            )
            .orderBy(sql`${checkIns.date} DESC`);

          // 2. Buscar pressão arterial
          const bloodPressureData = await db
            .select({
              date: bloodPressureRecords.date,
              systolic: bloodPressureRecords.systolic,
              diastolic: bloodPressureRecords.diastolic,
              classification: bloodPressureRecords.classification,
              notes: bloodPressureRecords.notes,
            })
            .from(bloodPressureRecords)
            .where(
              and(
                eq(bloodPressureRecords.userId, ctx.user.id),
                sql`${bloodPressureRecords.date} >= ${startDate}`,
                sql`${bloodPressureRecords.date} <= ${endDate}`
              )
            )
            .orderBy(sql`${bloodPressureRecords.date} DESC`);

          // Calcular tendências de pressão
          const avgSystolic =
            bloodPressureData.length > 0
              ? bloodPressureData.reduce((sum, r) => sum + r.systolic, 0) / bloodPressureData.length
              : 0;
          const avgDiastolic =
            bloodPressureData.length > 0
              ? bloodPressureData.reduce((sum, r) => sum + r.diastolic, 0) / bloodPressureData.length
              : 0;

          // 3. Buscar hidratação
          const hydrationData = await db
            .select({
              date: userHydration.date,
              cupsConsumed: userHydration.cupsConsumed,
              totalMl: userHydration.totalMl,
              goalMl: userHydration.goalMl,
            })
            .from(userHydration)
            .where(
              and(
                eq(userHydration.userId, ctx.user.id),
                sql`${userHydration.date} >= ${startDate}`,
                sql`${userHydration.date} <= ${endDate}`
              )
            )
            .orderBy(sql`${userHydration.date} DESC`);

          // Calcular estatísticas de hidratação
          const avgHydration =
            hydrationData.length > 0
              ? hydrationData.reduce((sum, r) => sum + (r.totalMl || 0), 0) / hydrationData.length
              : 0;
          const daysMetGoal = hydrationData.filter((r) => (r.totalMl || 0) >= r.goalMl).length;

          // 4. Buscar desafios
          const challengesData = await db
            .select({
              challengeId: challengeProgress.challengeId,
              currentValue: challengeProgress.currentValue,
              targetValue: challengeProgress.targetValue,
              completed: challengeProgress.completed,
              startDate: challengeProgress.startDate,
              completedAt: challengeProgress.completedAt,
            })
            .from(challengeProgress)
            .where(
              and(
                eq(challengeProgress.userId, ctx.user.id),
                sql`${challengeProgress.startDate} >= ${startDate}`,
                sql`${challengeProgress.startDate} <= ${endDate}`
              )
            )
            .orderBy(sql`${challengeProgress.startDate} DESC`);

          const completedChallenges = challengesData.filter((c) => c.completed === 1).length;

          // 5. Buscar queixas
          const complaintsData = await db
            .select({
              date: complaints.date,
              complaint: complaints.complaint,
              severity: complaints.severity,
              resolved: complaints.resolved,
              notes: complaints.notes,
            })
            .from(complaints)
            .where(
              and(
                eq(complaints.userId, ctx.user.id),
                sql`${complaints.date} >= ${startDate}`,
                sql`${complaints.date} <= ${endDate}`
              )
            )
            .orderBy(sql`${complaints.date} DESC`);

          // 6. Buscar dados de gamificação
          const [gamificationInfo] = await db
            .select({
              totalPoints: gamificationData.totalPoints,
              currentStreak: gamificationData.currentStreak,
              longestStreak: gamificationData.longestStreak,
              achievements: gamificationData.achievements,
              badges: gamificationData.badges,
              consistencyPoints: gamificationData.consistencyPoints,
            })
            .from(gamificationData)
            .where(eq(gamificationData.userId, ctx.user.id));

          return {
            period: {
              startDate: startDate.toISOString().split("T")[0],
              endDate: endDate.toISOString().split("T")[0],
              days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
            },
            checkIns: {
              total: checkInsData.length,
              data: checkInsData.map((c) => ({
                date: c.date,
                mood: c.mood,
                symptoms: c.symptoms || [],
                notes: c.notes || "",
              })),
            },
            bloodPressure: {
              total: bloodPressureData.length,
              averages: {
                systolic: Math.round(avgSystolic),
                diastolic: Math.round(avgDiastolic),
              },
              data: bloodPressureData.map((bp) => ({
                date: bp.date,
                systolic: bp.systolic,
                diastolic: bp.diastolic,
                classification: bp.classification || "desconhecida",
                notes: bp.notes || "",
              })),
            },
            hydration: {
              total: hydrationData.length,
              averageDaily: Math.round(avgHydration),
              daysMetGoal,
              goalAchievementRate:
                hydrationData.length > 0 ? Math.round((daysMetGoal / hydrationData.length) * 100) : 0,
              data: hydrationData.map((h) => ({
                date: h.date,
                cupsConsumed: h.cupsConsumed,
                totalMl: h.totalMl,
                goalMl: h.goalMl,
              })),
            },
            challenges: {
              total: challengesData.length,
              completed: completedChallenges,
              completionRate:
                challengesData.length > 0
                  ? Math.round((completedChallenges / challengesData.length) * 100)
                  : 0,
              data: challengesData.map((ch) => ({
                challengeId: ch.challengeId,
                progress: ch.currentValue,
                target: ch.targetValue,
                completed: ch.completed === 1,
                startDate: ch.startDate,
                completedAt: ch.completedAt,
              })),
            },
            complaints: {
              total: complaintsData.length,
              resolved: complaintsData.filter((c) => c.resolved === 1).length,
              pending: complaintsData.filter((c) => c.resolved === 0).length,
              data: complaintsData.map((c) => ({
                date: c.date,
                complaint: c.complaint,
                severity: c.severity,
                resolved: c.resolved === 1,
                notes: c.notes || "",
              })),
            },
            gamification: gamificationInfo || {
              totalPoints: 0,
              currentStreak: 0,
              longestStreak: 0,
              achievements: [],
              badges: [],
              consistencyPoints: 0,
            },
          };
        } catch (error) {
          console.error("Erro ao buscar relatório de saúde:", error);
          throw new Error("Falha ao buscar relatório de saúde");
        }
      }),
  }),

  // ==================== ADMIN DASHBOARD EXTENDED ====================
  adminExtended: router({
    // Obter estatísticas gerais do dashboard (versão completa)
    getFullDashboardStats: publicProcedure.query(async () => {
      try {
        const stats = await db.getDashboardStats();
        return { success: true, data: stats };
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return { success: false, error: "Falha ao buscar estatísticas" };
      }
    }),

    // Listar todos os funcionários
    listEmployees: publicProcedure.query(async () => {
      try {
        const employees = await db.getAllEmployees();
        return { success: true, data: employees };
      } catch (error) {
        console.error("Erro ao listar funcionários:", error);
        return { success: false, error: "Falha ao listar funcionários" };
      }
    }),

    // Obter dados de um funcionário específico
    getEmployeeData: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        try {
          const [employee, checkInsData, hydration, pressure, complaintsData, challenges, ergonomics, mentalHealth] = await Promise.all([
            db.getEmployeeById(input.employeeId),
            db.getCheckInsByEmployee(input.employeeId),
            db.getHydrationByEmployee(input.employeeId),
            db.getBloodPressureByEmployee(input.employeeId),
            db.getComplaintsByEmployee(input.employeeId),
            db.getChallengesByEmployee(input.employeeId),
            db.getErgonomicsByEmployee(input.employeeId),
            db.getMentalHealthByEmployee(input.employeeId),
          ]);

          return {
            success: true,
            data: {
              employee,
              checkIns: checkInsData,
              hydration,
              pressure,
              complaints: complaintsData,
              challenges,
              ergonomics,
              mentalHealth,
            },
          };
        } catch (error) {
          console.error("Erro ao buscar dados do funcionário:", error);
          return { success: false, error: "Falha ao buscar dados do funcionário" };
        }
      }),

    // Criar funcionário
    createEmployee: publicProcedure
      .input(
        z.object({
          cpf: z.string(),
          matricula: z.string(),
          workerId: z.string(),
          name: z.string(),
          email: z.string().optional(),
          department: z.string().optional(),
          position: z.string().optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          workType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const id = await db.createEmployee(input);
          return { success: true, id };
        } catch (error) {
          console.error("Erro ao criar funcionário:", error);
          return { success: false, error: "Falha ao criar funcionário" };
        }
      }),

    // Atualizar funcionário
    updateEmployee: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          department: z.string().optional(),
          position: z.string().optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          workType: z.string().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          await db.updateEmployee(id, data);
          return { success: true };
        } catch (error) {
          console.error("Erro ao atualizar funcionário:", error);
          return { success: false, error: "Falha ao atualizar funcionário" };
        }
      }),

    // Obter todos os check-ins
    getAllCheckIns: publicProcedure.query(async () => {
      try {
        const checkIns = await db.getAllCheckIns();
        return { success: true, data: checkIns };
      } catch (error) {
        console.error("Erro ao buscar check-ins:", error);
        return { success: false, error: "Falha ao buscar check-ins" };
      }
    }),

    // Obter todos os registros de hidratação
    getAllHydration: publicProcedure.query(async () => {
      try {
        const hydration = await db.getAllHydration();
        return { success: true, data: hydration };
      } catch (error) {
        console.error("Erro ao buscar hidratação:", error);
        return { success: false, error: "Falha ao buscar hidratação" };
      }
    }),

    // Obter todos os registros de pressão arterial
    getAllBloodPressure: publicProcedure.query(async () => {
      try {
        const pressure = await db.getAllBloodPressure();
        return { success: true, data: pressure };
      } catch (error) {
        console.error("Erro ao buscar pressão arterial:", error);
        return { success: false, error: "Falha ao buscar pressão arterial" };
      }
    }),

    // Obter todas as queixas
    getAllComplaints: publicProcedure.query(async () => {
      try {
        const complaints = await db.getAllComplaints();
        return { success: true, data: complaints };
      } catch (error) {
        console.error("Erro ao buscar queixas:", error);
        return { success: false, error: "Falha ao buscar queixas" };
      }
    }),

    // Obter todos os desafios
    getAllChallenges: publicProcedure.query(async () => {
      try {
        const challenges = await db.getAllChallenges();
        return { success: true, data: challenges };
      } catch (error) {
        console.error("Erro ao buscar desafios:", error);
        return { success: false, error: "Falha ao buscar desafios" };
      }
    }),

    // Obter todos os registros de ergonomia
    getAllErgonomics: publicProcedure.query(async () => {
      try {
        const ergonomics = await db.getAllErgonomics();
        return { success: true, data: ergonomics };
      } catch (error) {
        console.error("Erro ao buscar ergonomia:", error);
        return { success: false, error: "Falha ao buscar ergonomia" };
      }
    }),

    // Obter todos os registros de saúde mental
    getAllMentalHealth: publicProcedure.query(async () => {
      try {
        const mentalHealth = await db.getAllMentalHealth();
        return { success: true, data: mentalHealth };
      } catch (error) {
        console.error("Erro ao buscar saúde mental:", error);
        return { success: false, error: "Falha ao buscar saúde mental" };
      }
    }),

    // Atualizar status de queixa
    updateComplaint: publicProcedure
      .input(
        z.object({
          id: z.number(),
          resolved: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, resolved, notes } = input;
          await db.updateComplaint(id, {
            resolved: resolved ? 1 : 0,
            notes,
          });
          return { success: true };
        } catch (error) {
          console.error("Erro ao atualizar queixa:", error);
          return { success: false, error: "Falha ao atualizar queixa" };
        }
      }),
  }),

  // ==================== PUSH NOTIFICATIONS ====================
  notifications: router({
    // Registrar push token
    registerToken: protectedProcedure
      .input(
        z.object({
          token: z.string(),
          platform: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const id = await db.upsertPushToken(ctx.user.id, input.token, input.platform);
          return { success: true, id };
        } catch (error) {
          console.error("Erro ao registrar push token:", error);
          return { success: false, error: "Falha ao registrar push token" };
        }
      }),

    // Desativar push token
    deactivateToken: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await db.deactivatePushToken(input.token);
          return { success: true };
        } catch (error) {
          console.error("Erro ao desativar push token:", error);
          return { success: false, error: "Falha ao desativar push token" };
        }
      }),

    // Agendar notificação de desafio
    scheduleChallengeReminder: protectedProcedure
      .input(
        z.object({
          challengeId: z.string(),
          notificationType: z.string(),
          scheduledTime: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const id = await db.createChallengeNotification({
            employeeId: ctx.user.id,
            challengeId: input.challengeId,
            notificationType: input.notificationType,
            scheduledTime: new Date(input.scheduledTime),
          });
          return { success: true, id };
        } catch (error) {
          console.error("Erro ao agendar notificação:", error);
          return { success: false, error: "Falha ao agendar notificação" };
        }
      }),

    // Enviar notificação push (para admin)
    sendPushNotification: publicProcedure
      .input(
        z.object({
          employeeId: z.number().optional(),
          title: z.string(),
          body: z.string(),
          data: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          let tokens;
          if (input.employeeId) {
            tokens = await db.getPushTokensByEmployee(input.employeeId);
          } else {
            tokens = await db.getAllActivePushTokens();
          }

          // Enviar notificações via Expo Push API
          const messages = tokens.map((t) => ({
            to: t.token,
            sound: "default" as const,
            title: input.title,
            body: input.body,
            data: input.data || {},
          }));

          if (messages.length > 0) {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(messages),
            });

            const result = await response.json();
            return { success: true, sent: messages.length, result };
          }

          return { success: true, sent: 0 };
        } catch (error) {
          console.error("Erro ao enviar notificação push:", error);
          return { success: false, error: "Falha ao enviar notificação push" };
        }
      }),
  }),

  // Router de fotos de desafios
  challengePhotos: router({
    // Upload de foto do desafio
    upload: publicProcedure
      .input(
        z.object({
          workerId: z.string(),
          challengeId: z.string(),
          challengeName: z.string(),
          photoBase64: z.string(),
          category: z.enum(["pesagem", "refeicao", "atividade", "outro"]),
          description: z.string().optional(),
          uploadedAt: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Decodificar base64 para buffer
          const base64Data = input.photoBase64.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileKey = `challenge-photos/${input.workerId}/${input.challengeId}/${timestamp}-${randomSuffix}.jpg`;

          // Upload para S3
          const { url } = await storagePut(fileKey, buffer, "image/jpeg");

          // Salvar metadados no banco
          const db = await getDb();
          if (!db) {
            return { success: false, error: "Banco de dados não disponível" };
          }

          const [photo] = await db
            .insert(challengePhotos)
            .values({
              workerId: input.workerId,
              challengeId: input.challengeId,
              challengeName: input.challengeName,
              photoUrl: url,
              category: input.category,
              description: input.description || null,
              uploadedAt: new Date(input.uploadedAt),
            })
            .$returningId();

          return {
            success: true,
            photoId: photo.id,
            photoUrl: url,
          };
        } catch (error) {
          console.error("Erro ao fazer upload de foto:", error);
          return {
            success: false,
            error: "Falha ao fazer upload da foto",
          };
        }
      }),

    // Listar fotos de um desafio específico
    listByChallenge: publicProcedure
      .input(
        z.object({
          workerId: z.string(),
          challengeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) return { success: false, photos: [] };

          const photos = await db
            .select()
            .from(challengePhotos)
            .where(
              and(
                eq(challengePhotos.workerId, input.workerId),
                eq(challengePhotos.challengeId, input.challengeId)
              )
            )
            .orderBy(sql`${challengePhotos.uploadedAt} DESC`);

          return { success: true, photos };
        } catch (error) {
          console.error("Erro ao listar fotos:", error);
          return { success: false, photos: [] };
        }
      }),

    // Listar todas as fotos para o Dashboard Admin
    listAll: publicProcedure
      .input(
        z.object({
          workerId: z.string().optional(),
          challengeId: z.string().optional(),
          category: z.enum(["pesagem", "refeicao", "atividade", "outro"]).optional(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) return { success: false, photos: [] };

          let query = db.select().from(challengePhotos);

          const conditions = [];
          if (input.workerId) {
            conditions.push(eq(challengePhotos.workerId, input.workerId));
          }
          if (input.challengeId) {
            conditions.push(eq(challengePhotos.challengeId, input.challengeId));
          }
          if (input.category) {
            conditions.push(eq(challengePhotos.category, input.category));
          }

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
          }

          const photos = await query
            .orderBy(sql`${challengePhotos.uploadedAt} DESC`)
            .limit(input.limit);

          return { success: true, photos };
        } catch (error) {
          console.error("Erro ao listar todas as fotos:", error);
          return { success: false, photos: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;