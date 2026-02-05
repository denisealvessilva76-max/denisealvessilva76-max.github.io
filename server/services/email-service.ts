import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Inicializa o serviço de e-mail com configurações SMTP
   */
  initialize(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    console.log("[EmailService] Serviço de e-mail inicializado");
  }

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  /**
   * Envia um e-mail
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter || !this.config) {
        throw new Error("Serviço de e-mail não configurado. Chame initialize() primeiro.");
      }

      console.log(`[EmailService] Enviando e-mail para ${options.to}...`);

      const info = await this.transporter.sendMail({
        from: `"Canteiro Saudável" <${this.config.auth.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      console.log(`[EmailService] E-mail enviado com sucesso. Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("[EmailService] Erro ao enviar e-mail:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Testa a conexão SMTP
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error("Serviço de e-mail não configurado");
      }

      await this.transporter.verify();
      console.log("[EmailService] Conexão SMTP verificada com sucesso");

      return { success: true };
    } catch (error) {
      console.error("[EmailService] Erro ao verificar conexão SMTP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Singleton
export const emailService = new EmailService();

// Configuração padrão (pode ser sobrescrita via variáveis de ambiente)
const defaultConfig: EmailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

// Inicializar apenas se as credenciais estiverem configuradas
if (defaultConfig.auth.user && defaultConfig.auth.pass) {
  emailService.initialize(defaultConfig);
  console.log("[EmailService] Serviço de e-mail configurado automaticamente");
} else {
  console.warn(
    "[EmailService] Credenciais SMTP não configuradas. Configure SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis de ambiente."
  );
}
