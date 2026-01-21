import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { adminNotifications } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/notifications
 * Criar notificação para admin
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, type, severity, message, data } = req.body;

    if (!employeeId || !type || !message) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Criar notificação
    const notification = await db.insert(adminNotifications).values({
      employeeId,
      type,
      severity: severity || "normal",
      message,
      data: JSON.stringify(data || {}),
      isRead: 0,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Notificação criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

/**
 * GET /api/admin/notifications
 * Obter notificações do admin
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const { limit = 50, unreadOnly = false } = req.query;

    let query: any = db.select().from(adminNotifications);

    if (unreadOnly === "true") {
      query = query.where(eq(adminNotifications.isRead, 0));
    }

    const notifications = await query
      .orderBy(desc(adminNotifications.createdAt))
      .limit(parseInt(limit as string) || 50);

    res.json({
      success: true,
      data: notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Erro ao obter notificações:", error);
    res.status(500).json({ error: "Erro ao obter notificações" });
  }
});

/**
 * GET /api/admin/notifications/unread-count
 * Contar notificações não lidas
 */
router.get("/unread-count", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    const unreadNotifications = await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, 0));

    res.json({
      success: true,
      unreadCount: unreadNotifications.length,
    });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    res.status(500).json({ error: "Erro ao contar notificações" });
  }
});

/**
 * PATCH /api/admin/notifications/:id
 * Marcar notificação como lida
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { id } = req.params;
    const { isRead } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    await db
      .update(adminNotifications)
      .set({ isRead: isRead !== undefined ? (isRead ? 1 : 0) : 1 })
      .where(eq(adminNotifications.id, parseInt(id)));

    res.json({
      success: true,
      message: "Notificação atualizada",
    });
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error);
    res.status(500).json({ error: "Erro ao atualizar notificação" });
  }
});

/**
 * DELETE /api/admin/notifications/:id
 * Deletar notificação
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { id } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Soft delete - marcar como deletado
    await db
      .update(adminNotifications)
      .set({ isRead: 1 })
      .where(eq(adminNotifications.id, parseInt(id)));

    res.json({
      success: true,
      message: "Notificação deletada",
    });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    res.status(500).json({ error: "Erro ao deletar notificação" });
  }
});

export default router;
