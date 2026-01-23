import { Router, Request, Response } from "express";

const router = Router();

// Armazenamento em memória (em produção, usar banco de dados)
const feedbacks: any[] = [];

// POST /api/feedback - Enviar novo feedback
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, userName, userCpf, type, category, title, description, photoUri } = req.body;

    if (!userId || !userName || !type || !category || !title || !description) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const newFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userCpf: userCpf || "Não informado",
      type,
      category,
      title,
      description,
      photoUri: photoUri || null,
      status: "pendente",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    feedbacks.push(newFeedback);

    console.log(`[Feedback] Novo feedback recebido de ${userName} (${type}): ${title}`);

    res.status(201).json({
      success: true,
      feedback: newFeedback,
      message: "Feedback enviado com sucesso! Agradecemos sua contribuição.",
    });
  } catch (error) {
    console.error("[Feedback] Erro ao processar feedback:", error);
    res.status(500).json({ error: "Erro ao enviar feedback" });
  }
});

// GET /api/feedback - Listar todos os feedbacks (admin)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, type, category } = req.query;

    let filteredFeedbacks = [...feedbacks];

    if (status) {
      filteredFeedbacks = filteredFeedbacks.filter((f) => f.status === status);
    }

    if (type) {
      filteredFeedbacks = filteredFeedbacks.filter((f) => f.type === type);
    }

    if (category) {
      filteredFeedbacks = filteredFeedbacks.filter((f) => f.category === category);
    }

    // Ordenar por data (mais recente primeiro)
    filteredFeedbacks.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      feedbacks: filteredFeedbacks,
      total: filteredFeedbacks.length,
    });
  } catch (error) {
    console.error("[Feedback] Erro ao listar feedbacks:", error);
    res.status(500).json({ error: "Erro ao listar feedbacks" });
  }
});

// PATCH /api/feedback/:id - Atualizar status ou responder feedback (admin)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const feedbackIndex = feedbacks.findIndex((f) => f.id === id);

    if (feedbackIndex === -1) {
      return res.status(404).json({ error: "Feedback não encontrado" });
    }

    if (status) {
      feedbacks[feedbackIndex].status = status;
    }

    if (adminResponse) {
      feedbacks[feedbackIndex].adminResponse = adminResponse;
      feedbacks[feedbackIndex].adminResponseAt = Date.now();
    }

    feedbacks[feedbackIndex].updatedAt = Date.now();

    res.json({
      success: true,
      feedback: feedbacks[feedbackIndex],
      message: "Feedback atualizado com sucesso",
    });
  } catch (error) {
    console.error("[Feedback] Erro ao atualizar feedback:", error);
    res.status(500).json({ error: "Erro ao atualizar feedback" });
  }
});

// GET /api/feedback/stats - Estatísticas de feedbacks (admin)
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = {
      total: feedbacks.length,
      pendentes: feedbacks.filter((f) => f.status === "pendente").length,
      emAnalise: feedbacks.filter((f) => f.status === "em_analise").length,
      resolvidos: feedbacks.filter((f) => f.status === "resolvido").length,
      porTipo: {
        sugestao: feedbacks.filter((f) => f.type === "sugestao").length,
        problema: feedbacks.filter((f) => f.type === "problema").length,
        elogio: feedbacks.filter((f) => f.type === "elogio").length,
        outro: feedbacks.filter((f) => f.type === "outro").length,
      },
      porCategoria: {
        app: feedbacks.filter((f) => f.category === "app").length,
        saude: feedbacks.filter((f) => f.category === "saude").length,
        seguranca: feedbacks.filter((f) => f.category === "seguranca").length,
        outro: feedbacks.filter((f) => f.category === "outro").length,
      },
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("[Feedback] Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas" });
  }
});

export default router;
