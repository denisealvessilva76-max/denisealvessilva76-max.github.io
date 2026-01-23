/**
 * Orientações Nutricionais para Trabalhadores da Construção Civil
 * Dicas simples e práticas para alimentação saudável no canteiro de obras
 */

export type NutritionCategory = "breakfast" | "lunch" | "snack" | "hydration" | "avoid" | "energy";

export interface NutritionTip {
  id: string;
  category: NutritionCategory;
  title: string;
  description: string;
  icon: string;
  tips: string[];
  benefits?: string[];
}

export const NUTRITION_TIPS: NutritionTip[] = [
  {
    id: "breakfast",
    category: "breakfast",
    title: "Café da Manhã Reforçado",
    description: "Comece o dia com energia para o trabalho pesado",
    icon: "🍳",
    tips: [
      "Pão integral com ovo e queijo",
      "Frutas (banana, maçã, mamão)",
      "Café com leite ou suco natural",
      "Aveia com frutas e mel",
      "Tapioca com queijo",
    ],
    benefits: [
      "Energia para o dia todo",
      "Melhora concentração",
      "Evita fadiga precoce",
    ],
  },
  {
    id: "lunch",
    category: "lunch",
    title: "Almoço Balanceado",
    description: "Reponha as energias no meio do dia",
    icon: "🍱",
    tips: [
      "Arroz + Feijão (proteína vegetal)",
      "Carne magra, frango ou peixe",
      "Salada verde variada",
      "Legumes cozidos",
      "Evite frituras em excesso",
    ],
    benefits: [
      "Mantém energia à tarde",
      "Fornece nutrientes essenciais",
      "Ajuda na recuperação muscular",
    ],
  },
  {
    id: "snacks",
    category: "snack",
    title: "Lanches Saudáveis",
    description: "Opções práticas para levar na marmita",
    icon: "🥪",
    tips: [
      "Frutas frescas (banana, maçã, laranja)",
      "Castanhas e amendoim",
      "Pão integral com pasta de amendoim",
      "Iogurte natural",
      "Barra de cereal (sem muito açúcar)",
      "Sanduíche natural",
    ],
    benefits: [
      "Evita fome entre refeições",
      "Mantém energia constante",
      "Prático para levar",
    ],
  },
  {
    id: "hydration-food",
    category: "hydration",
    title: "Alimentos que Hidratam",
    description: "Complemente a hidratação com alimentos",
    icon: "🍉",
    tips: [
      "Melancia (92% água)",
      "Pepino (95% água)",
      "Laranja e tangerina",
      "Melão",
      "Tomate",
      "Alface e verduras",
    ],
    benefits: [
      "Hidratação extra",
      "Vitaminas e minerais",
      "Refrescante em dias quentes",
    ],
  },
  {
    id: "energy-boost",
    category: "energy",
    title: "Energia Rápida",
    description: "Quando precisar de um impulso de energia",
    icon: "⚡",
    tips: [
      "Banana (carboidrato rápido)",
      "Mel (energia imediata)",
      "Água de coco (eletrólitos)",
      "Suco de laranja natural",
      "Pão com geleia",
    ],
    benefits: [
      "Energia rápida",
      "Combate fadiga",
      "Recuperação rápida",
    ],
  },
  {
    id: "avoid",
    category: "avoid",
    title: "Evite no Canteiro",
    description: "Alimentos que podem prejudicar seu desempenho",
    icon: "🚫",
    tips: [
      "Refrigerantes (muito açúcar)",
      "Salgadinhos industrializados",
      "Frituras em excesso",
      "Doces em grande quantidade",
      "Bebidas energéticas artificiais",
      "Comida muito pesada no almoço",
    ],
    benefits: [
      "Evita mal-estar",
      "Previne sonolência",
      "Melhora disposição",
    ],
  },
];

// Categorias com cores
export const NUTRITION_CATEGORIES = [
  { id: "breakfast", label: "Café da Manhã", icon: "🍳", color: "#F59E0B" },
  { id: "lunch", label: "Almoço", icon: "🍱", color: "#22C55E" },
  { id: "snack", label: "Lanches", icon: "🥪", color: "#8B5CF6" },
  { id: "hydration", label: "Hidratação", icon: "🍉", color: "#0EA5E9" },
  { id: "energy", label: "Energia", icon: "⚡", color: "#EF4444" },
  { id: "avoid", label: "Evitar", icon: "🚫", color: "#64748B" },
];

// Alertas de hidratação baseados em temperatura
export interface HydrationAlert {
  temperature: number;
  level: "normal" | "warning" | "critical";
  message: string;
  recommendation: string;
  waterGoal: number; // ml por dia
}

export function getHydrationAlert(temperature: number): HydrationAlert {
  if (temperature >= 35) {
    return {
      temperature,
      level: "critical",
      message: "🔥 ALERTA CRÍTICO: Calor Extremo!",
      recommendation: "Beba água a cada 15-20 minutos. Faça pausas frequentes na sombra. Use protetor solar e chapéu.",
      waterGoal: 3500, // 3.5L
    };
  } else if (temperature >= 30) {
    return {
      temperature,
      level: "warning",
      message: "⚠️ ATENÇÃO: Calor Intenso",
      recommendation: "Aumente a ingestão de água. Beba a cada 30 minutos. Evite exposição direta ao sol.",
      waterGoal: 3000, // 3L
    };
  } else {
    return {
      temperature,
      level: "normal",
      message: "✅ Temperatura Normal",
      recommendation: "Mantenha hidratação regular. Beba água a cada hora.",
      waterGoal: 2000, // 2L
    };
  }
}

// Calculadora de necessidade hídrica
export function calculateWaterNeed(
  weight: number, // kg
  activityLevel: "light" | "moderate" | "intense",
  temperature: number
): number {
  // Base: 35ml por kg de peso
  let baseNeed = weight * 35;

  // Ajuste por nível de atividade
  const activityMultiplier = {
    light: 1.0,
    moderate: 1.2,
    intense: 1.5,
  };
  baseNeed *= activityMultiplier[activityLevel];

  // Ajuste por temperatura
  if (temperature >= 35) {
    baseNeed *= 1.5;
  } else if (temperature >= 30) {
    baseNeed *= 1.3;
  } else if (temperature >= 25) {
    baseNeed *= 1.1;
  }

  return Math.round(baseNeed);
}
