export type FeedbackType = "sugestao" | "problema" | "elogio" | "outro";
export type FeedbackCategory = "app" | "saude" | "seguranca" | "outro";
export type FeedbackStatus = "pendente" | "em_analise" | "resolvido" | "arquivado";

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userCpf?: string;
  type: FeedbackType;
  category: FeedbackCategory;
  title: string;
  description: string;
  photoUri?: string;
  status: FeedbackStatus;
  createdAt: number;
  updatedAt: number;
  adminResponse?: string;
  adminResponseAt?: number;
}

export interface FeedbackFormData {
  type: FeedbackType;
  category: FeedbackCategory;
  title: string;
  description: string;
  photoUri?: string;
}

export const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: string; color: string }[] = [
  { id: "sugestao", label: "Sugestão", icon: "💡", color: "#3B82F6" },
  { id: "problema", label: "Problema", icon: "⚠️", color: "#EF4444" },
  { id: "elogio", label: "Elogio", icon: "⭐", color: "#10B981" },
  { id: "outro", label: "Outro", icon: "💬", color: "#6B7280" },
];

export const FEEDBACK_CATEGORIES: { id: FeedbackCategory; label: string; icon: string }[] = [
  { id: "app", label: "Aplicativo", icon: "📱" },
  { id: "saude", label: "Saúde", icon: "🏥" },
  { id: "seguranca", label: "Segurança", icon: "🦺" },
  { id: "outro", label: "Outro", icon: "📝" },
];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  resolvido: "Resolvido",
  arquivado: "Arquivado",
};
