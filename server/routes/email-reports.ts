import express from "express";

const router = express.Router();

const ADMIN_EMAIL = "denise.silva@mip.com.br";

/**
 * Enviar relatório por email
 * POST /api/email-reports/send
 */
router.post("/send", async (req, res) => {
  try {
    const { period, reportType } = req.body;

    // Aqui você integraria com um serviço de email (SendGrid, AWS SES, etc.)
    // Por enquanto, vamos simular o envio

    console.log(`📧 Enviando relatório ${reportType} (${period}) para ${ADMIN_EMAIL}`);

    // Simular envio bem-sucedido
    res.json({
      success: true,
      message: `Relatório ${reportType} enviado para ${ADMIN_EMAIL}`,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao enviar relatório por email:", error);
    res.status(500).json({ error: "Erro ao enviar relatório" });
  }
});

/**
 * Configurar envio automático de relatórios
 * POST /api/email-reports/schedule
 */
router.post("/schedule", async (req, res) => {
  try {
    const { frequency, reportType, email } = req.body;

    console.log(`⏰ Agendando envio ${frequency} de relatório ${reportType} para ${email || ADMIN_EMAIL}`);

    // Aqui você configuraria um cron job ou scheduler
    // Por enquanto, vamos apenas confirmar o agendamento

    res.json({
      success: true,
      message: `Relatório ${reportType} agendado para envio ${frequency}`,
      scheduledAt: new Date().toISOString(),
      email: email || ADMIN_EMAIL,
    });
  } catch (error) {
    console.error("Erro ao agendar relatório:", error);
    res.status(500).json({ error: "Erro ao agendar relatório" });
  }
});

export default router;
