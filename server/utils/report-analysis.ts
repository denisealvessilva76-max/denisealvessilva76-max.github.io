/**
 * Análise de Tendências e Geração de Recomendações
 */

export interface HealthMetrics {
  totalEmployees: number;
  totalCheckIns: number;
  averagePressureSystolic: number;
  averagePressureDiastolic: number;
  wellnessGood: number;
  wellnessMild: number;
  wellnessSevere: number;
  referralsCount: number;
  atRiskEmployees: number;
}

export interface TrendAnalysis {
  pressureTrend: "crítico" | "elevado" | "normal" | "ótimo";
  wellnessTrend: "piorando" | "estável" | "melhorando" | "excelente";
  referralsTrend: "aumentando" | "estável" | "reduzindo";
  adherenceRate: number;
  riskLevel: "crítico" | "alto" | "médio" | "baixo";
}

export interface Recommendation {
  priority: "crítica" | "alta" | "média" | "baixa";
  category: "pressão" | "bem-estar" | "ergonomia" | "engajamento" | "recursos";
  title: string;
  description: string;
  action: string;
}

/**
 * Analisar tendências de saúde
 */
export function analyzeTrends(metrics: HealthMetrics): TrendAnalysis {
  const adherenceRate =
    metrics.totalEmployees > 0 ? (metrics.totalCheckIns / metrics.totalEmployees) * 100 : 0;

  // Analisar pressão arterial
  let pressureTrend: "crítico" | "elevado" | "normal" | "ótimo";
  if (metrics.averagePressureSystolic >= 160 || metrics.averagePressureDiastolic >= 100) {
    pressureTrend = "crítico";
  } else if (metrics.averagePressureSystolic >= 140 || metrics.averagePressureDiastolic >= 90) {
    pressureTrend = "elevado";
  } else if (metrics.averagePressureSystolic >= 120 || metrics.averagePressureDiastolic >= 80) {
    pressureTrend = "normal";
  } else {
    pressureTrend = "ótimo";
  }

  // Analisar bem-estar
  const total = metrics.wellnessGood + metrics.wellnessMild + metrics.wellnessSevere;
  const goodPercent = total > 0 ? (metrics.wellnessGood / total) * 100 : 0;
  const severePercent = total > 0 ? (metrics.wellnessSevere / total) * 100 : 0;

  let wellnessTrend: "piorando" | "estável" | "melhorando" | "excelente";
  if (goodPercent >= 80) {
    wellnessTrend = "excelente";
  } else if (goodPercent >= 60) {
    wellnessTrend = "melhorando";
  } else if (severePercent <= 10) {
    wellnessTrend = "estável";
  } else {
    wellnessTrend = "piorando";
  }

  // Analisar encaminhamentos
  const referralRate = metrics.totalEmployees > 0 ? (metrics.referralsCount / metrics.totalEmployees) * 100 : 0;
  let referralsTrend: "aumentando" | "estável" | "reduzindo";
  if (referralRate > 15) {
    referralsTrend = "aumentando";
  } else if (referralRate > 5) {
    referralsTrend = "estável";
  } else {
    referralsTrend = "reduzindo";
  }

  // Calcular nível de risco geral
  let riskLevel: "crítico" | "alto" | "médio" | "baixo";
  const riskScore =
    (pressureTrend === "crítico" ? 3 : pressureTrend === "elevado" ? 2 : 0) +
    (wellnessTrend === "piorando" ? 3 : wellnessTrend === "estável" ? 1 : 0) +
    (adherenceRate < 30 ? 3 : adherenceRate < 50 ? 2 : 0) +
    (metrics.atRiskEmployees > metrics.totalEmployees * 0.15 ? 2 : 0);

  if (riskScore >= 8) {
    riskLevel = "crítico";
  } else if (riskScore >= 5) {
    riskLevel = "alto";
  } else if (riskScore >= 2) {
    riskLevel = "médio";
  } else {
    riskLevel = "baixo";
  }

  return {
    pressureTrend,
    wellnessTrend,
    referralsTrend,
    adherenceRate,
    riskLevel,
  };
}

/**
 * Gerar recomendações baseadas em análise
 */
export function generateRecommendations(metrics: HealthMetrics, trends: TrendAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Recomendações de Pressão Arterial
  if (trends.pressureTrend === "crítico") {
    recommendations.push({
      priority: "crítica",
      category: "pressão",
      title: "Pressão Arterial Crítica",
      description:
        "A pressão arterial média dos empregados está em nível crítico (≥160/100 mmHg). Isso requer intervenção imediata.",
      action:
        "1. Realizar triagem de saúde urgente com todos os empregados\n2. Intensificar monitoramento diário\n3. Encaminhar casos críticos para cardiologista\n4. Implementar programa de redução de estresse",
    });
  } else if (trends.pressureTrend === "elevado") {
    recommendations.push({
      priority: "alta",
      category: "pressão",
      title: "Pressão Arterial Elevada",
      description:
        "A pressão arterial média está em nível pré-hipertensão (140-159/90-99 mmHg). Ação preventiva é necessária.",
      action:
        "1. Aumentar frequência de monitoramento (2x por semana)\n2. Implementar programa de controle de estresse\n3. Revisar ergonomia dos postos de trabalho\n4. Oferecer orientações sobre alimentação saudável",
    });
  }

  // Recomendações de Bem-estar
  if (trends.wellnessTrend === "piorando") {
    recommendations.push({
      priority: "alta",
      category: "bem-estar",
      title: "Bem-estar em Declínio",
      description: `Mais de ${((metrics.wellnessSevere / (metrics.wellnessGood + metrics.wellnessMild + metrics.wellnessSevere)) * 100).toFixed(1)}% dos check-ins indicam dor forte.`,
      action:
        "1. Revisar ergonomia de todos os postos de trabalho\n2. Aumentar pausas ativas (a cada 2 horas)\n3. Implementar programa de alongamento obrigatório\n4. Avaliar carga de trabalho dos empregados",
    });
  }

  // Recomendações de Engajamento
  if (trends.adherenceRate < 30) {
    recommendations.push({
      priority: "alta",
      category: "engajamento",
      title: "Baixa Adesão ao Programa",
      description: `Apenas ${trends.adherenceRate.toFixed(1)}% dos empregados estão fazendo check-ins regularmente.`,
      action:
        "1. Intensificar campanhas de conscientização\n2. Aumentar frequência de lembretes (3x por dia)\n3. Gamificar o programa (medalhas, rankings)\n4. Oferecer incentivos para participação",
    });
  } else if (trends.adherenceRate >= 80) {
    recommendations.push({
      priority: "baixa",
      category: "engajamento",
      title: "Excelente Adesão",
      description: `${trends.adherenceRate.toFixed(1)}% dos empregados estão engajados no programa.`,
      action:
        "1. Manter estratégia atual\n2. Reconhecer e premiar empregados mais engajados\n3. Usar como modelo para outras obras",
    });
  }

  // Recomendações de Recursos
  if (metrics.atRiskEmployees > metrics.totalEmployees * 0.15) {
    recommendations.push({
      priority: "alta",
      category: "recursos",
      title: "Recursos SESMT Insuficientes",
      description: `${metrics.atRiskEmployees} empregados (${((metrics.atRiskEmployees / metrics.totalEmployees) * 100).toFixed(1)}%) precisam de atenção do SESMT.`,
      action:
        "1. Aumentar equipe de SESMT\n2. Priorizar atendimento de casos críticos\n3. Implementar triagem mais eficiente\n4. Considerar contratação de profissional adicional",
    });
  }

  // Recomendações de Ergonomia
  if (trends.wellnessTrend === "piorando" || trends.pressureTrend === "elevado") {
    recommendations.push({
      priority: "média",
      category: "ergonomia",
      title: "Revisão de Ergonomia Necessária",
      description: "Indicadores sugerem problemas ergonômicos nos postos de trabalho.",
      action:
        "1. Realizar avaliação ergonômica completa\n2. Implementar melhorias nos postos de trabalho\n3. Treinar empregados sobre postura correta\n4. Agendar nova avaliação em 30 dias",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { crítica: 0, alta: 1, média: 2, baixa: 3 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder];
  });
}

/**
 * Gerar resumo executivo
 */
export function generateExecutiveSummary(metrics: HealthMetrics, trends: TrendAnalysis): string {
  const adherencePercent = trends.adherenceRate.toFixed(1);
  const wellnessTotal = metrics.wellnessGood + metrics.wellnessMild + metrics.wellnessSevere;
  const goodPercent = wellnessTotal > 0 ? ((metrics.wellnessGood / wellnessTotal) * 100).toFixed(1) : 0;

  return `
RESUMO EXECUTIVO - SAÚDE OCUPACIONAL

Período Analisado: Último Mês
Data do Relatório: ${new Date().toLocaleDateString("pt-BR")}

INDICADORES PRINCIPAIS:
• Total de Empregados: ${metrics.totalEmployees}
• Check-ins Realizados: ${metrics.totalCheckIns} (Adesão: ${adherencePercent}%)
• Pressão Arterial Média: ${Math.round(metrics.averagePressureSystolic)}/${Math.round(metrics.averagePressureDiastolic)} mmHg
• Bem-estar Geral: ${goodPercent}% em condição boa
• Empregados em Risco: ${metrics.atRiskEmployees}

NÍVEL DE RISCO GERAL: ${trends.riskLevel.toUpperCase()}

TENDÊNCIAS:
• Pressão Arterial: ${trends.pressureTrend}
• Bem-estar: ${trends.wellnessTrend}
• Encaminhamentos: ${trends.referralsTrend}

PRÓXIMOS PASSOS:
Veja seção de Recomendações para ações prioritárias.
  `.trim();
}
