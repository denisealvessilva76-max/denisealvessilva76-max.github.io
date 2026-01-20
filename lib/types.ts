/**
 * Tipos para o aplicativo Canteiro Saudável
 */

export type CheckInStatus = "bem" | "dor-leve" | "dor-forte";

export interface CheckIn {
  id: string;
  date: string; // ISO 8601 format
  status: CheckInStatus;
  timestamp: number; // Unix timestamp
}

export interface PressureReading {
  id: string;
  date: string; // ISO 8601 format
  systolic: number; // Pressão sistólica
  diastolic: number; // Pressão diastólica
  timestamp: number; // Unix timestamp
}

export type PressureClassification = "normal" | "pre-hipertensao" | "hipertensao";

export interface Symptom {
  id: string;
  label: string;
  icon: string;
}

export const SYMPTOMS: Symptom[] = [
  { id: "back-pain", label: "Dor nas costas", icon: "back" },
  { id: "shoulder-pain", label: "Dor no ombro", icon: "shoulder" },
  { id: "knee-pain", label: "Dor no joelho", icon: "knee" },
  { id: "anxiety", label: "Ansiedade", icon: "mind" },
  { id: "fatigue", label: "Fadiga", icon: "battery" },
  { id: "headache", label: "Dor de cabeça", icon: "head" },
];

export interface SymptomReport {
  id: string;
  date: string; // ISO 8601 format
  symptoms: string[]; // Array de symptom IDs
  timestamp: number; // Unix timestamp
}

export interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  cargo: string; // Função/cargo
  turno: "matutino" | "vespertino" | "noturno"; // Turno de trabalho
  createdAt: number;
  updatedAt: number;
}

export interface Exercise {
  id: string;
  title: string;
  category: "alongamento" | "postura" | "respiracao";
  description: string;
  duration: number; // em segundos
  instructions: string[];
  imageUrl?: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: "neck-stretch",
    title: "Alongamento de Pescoço",
    category: "alongamento",
    description: "Alongue suavemente o pescoço para aliviar tensão.",
    duration: 30,
    instructions: [
      "Sente-se com a coluna reta",
      "Incline a cabeça para a direita",
      "Mantenha por 15 segundos",
      "Repita do lado esquerdo",
    ],
  },
  {
    id: "shoulder-roll",
    title: "Rotação de Ombros",
    category: "alongamento",
    description: "Reduza a tensão nos ombros com rotações suaves.",
    duration: 30,
    instructions: [
      "Fique em pé com os braços soltos",
      "Faça rotações para trás com os ombros",
      "10 rotações para trás",
      "10 rotações para frente",
    ],
  },
  {
    id: "back-stretch",
    title: "Alongamento de Costas",
    category: "alongamento",
    description: "Alongue a coluna vertebral e alivie dores nas costas.",
    duration: 45,
    instructions: [
      "Fique em pé com os pés afastados",
      "Incline o tronco para frente",
      "Deixe os braços pendurados",
      "Mantenha por 30 segundos",
    ],
  },
  {
    id: "correct-posture",
    title: "Postura Correta para Carregar",
    category: "postura",
    description: "Aprenda a forma correta de carregar sacos de cimento.",
    duration: 60,
    instructions: [
      "Dobre os joelhos, não a coluna",
      "Mantenha a carga próxima ao corpo",
      "Distribua o peso igualmente",
      "Levante usando as pernas",
    ],
  },
  {
    id: "breathing",
    title: "Respiração Profunda",
    category: "respiracao",
    description: "Reduza o estresse com respiração profunda.",
    duration: 120,
    instructions: [
      "Sente-se confortavelmente",
      "Inspire profundamente pelo nariz (4 segundos)",
      "Segure (4 segundos)",
      "Expire lentamente pela boca (4 segundos)",
      "Repita 10 vezes",
    ],
  },
];

export interface AppState {
  profile: UserProfile | null;
  checkIns: CheckIn[];
  pressureReadings: PressureReading[];
  symptomReports: SymptomReport[];
}
