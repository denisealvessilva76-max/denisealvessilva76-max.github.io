/**
 * Gerador de Relatório PDF para Dashboard Admin
 * 
 * Este módulo gera relatórios PDF com gráficos e estatísticas
 * para apresentação em reuniões do SESMT.
 */

// FileSystem removido - usando URI do expo-print diretamente
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

export interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    checkInsTotal: number;
    checkInsAvgPerDay: number;
    hydrationAvgMl: number;
    complaintsTotal: number;
    complaintsResolved: number;
    challengesActive: number;
    challengesCompleted: number;
  };
  hydration: {
    labels: string[];
    values: number[];
    goal: number;
  };
  bloodPressure: {
    normal: number;
    elevated: number;
    high: number;
    alerts: Array<{
      employeeName: string;
      systolic: number;
      diastolic: number;
      date: string;
    }>;
  };
  complaints: Array<{
    employeeName: string;
    complaint: string;
    severity: string;
    date: string;
    resolved: boolean;
  }>;
  ergonomics: {
    totalPauses: number;
    totalStretches: number;
    avgPausesPerDay: number;
    adherenceRate: number;
  };
  mentalHealth: {
    breathingExercises: number;
    psychologistContacts: number;
    wellbeingScore: number;
  };
  challenges: {
    active: Array<{
      name: string;
      participants: number;
      avgProgress: number;
    }>;
    completed: Array<{
      name: string;
      completedBy: number;
      avgDays: number;
    }>;
  };
  ranking: Array<{
    position: number;
    name: string;
    points: number;
    streak: number;
  }>;
}

function generateChartSVG(
  type: "bar" | "line" | "pie",
  data: number[],
  labels: string[],
  options: {
    width?: number;
    height?: number;
    colors?: string[];
    title?: string;
    showValues?: boolean;
  } = {}
): string {
  const {
    width = 400,
    height = 200,
    colors = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
    title = "",
    showValues = true,
  } = options;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data, 1);

  if (type === "bar") {
    const barWidth = chartWidth / data.length - 10;
    const bars = data.map((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + i * (barWidth + 10) + 5;
      const y = height - padding - barHeight;
      const color = colors[i % colors.length];
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
        ${showValues ? `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#333">${value}</text>` : ""}
        <text x="${x + barWidth / 2}" y="${height - padding + 15}" text-anchor="middle" font-size="9" fill="#666">${labels[i] || ""}</text>
      `;
    }).join("");

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${title ? `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${title}</text>` : ""}
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1"/>
        ${bars}
      </svg>
    `;
  }

  if (type === "pie") {
    const total = data.reduce((a, b) => a + b, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
    let currentAngle = -Math.PI / 2;

    const slices = data.map((value, i) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const startX = centerX + radius * Math.cos(currentAngle);
      const startY = centerY + radius * Math.sin(currentAngle);
      const endX = centerX + radius * Math.cos(currentAngle + sliceAngle);
      const endY = centerY + radius * Math.sin(currentAngle + sliceAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const color = colors[i % colors.length];

      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + (radius + 20) * Math.cos(labelAngle);
      const labelY = centerY + (radius + 20) * Math.sin(labelAngle);

      currentAngle += sliceAngle;

      return `
        <path d="M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z" fill="${color}"/>
        <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="9" fill="#333">${labels[i]}: ${Math.round((value / total) * 100)}%</text>
      `;
    }).join("");

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${title ? `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${title}</text>` : ""}
        ${slices}
      </svg>
    `;
  }

  // Line chart
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = height - padding - (value / maxValue) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  const dots = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = height - padding - (value / maxValue) * chartHeight;
    return `
      <circle cx="${x}" cy="${y}" r="4" fill="${colors[0]}"/>
      ${showValues ? `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="9" fill="#333">${value}</text>` : ""}
    `;
  }).join("");

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${title ? `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${title}</text>` : ""}
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1"/>
      <polyline points="${points}" fill="none" stroke="${colors[0]}" stroke-width="2"/>
      ${dots}
    </svg>
  `;
}

function generateHTMLReport(data: ReportData): string {
  const hydrationChart = generateChartSVG(
    "bar",
    data.hydration.values,
    data.hydration.labels,
    { title: "Hidratação Média (ml)", colors: ["#3B82F6"] }
  );

  const pressureChart = generateChartSVG(
    "pie",
    [data.bloodPressure.normal, data.bloodPressure.elevated, data.bloodPressure.high],
    ["Normal", "Elevada", "Alta"],
    { title: "Classificação de Pressão Arterial", colors: ["#22C55E", "#F59E0B", "#EF4444"] }
  );

  const complaintsResolutionChart = generateChartSVG(
    "pie",
    [data.summary.complaintsResolved, data.summary.complaintsTotal - data.summary.complaintsResolved],
    ["Resolvidas", "Pendentes"],
    { title: "Status das Queixas", colors: ["#22C55E", "#EF4444"] }
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Saúde - SESMT</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
        .page { page-break-after: always; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #22C55E; padding-bottom: 20px; }
        .header h1 { color: #22C55E; font-size: 28px; margin-bottom: 5px; }
        .header .period { color: #666; font-size: 14px; }
        .header .date { color: #999; font-size: 12px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; color: #22C55E; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-card .value { font-size: 28px; font-weight: bold; color: #22C55E; }
        .summary-card .label { font-size: 12px; color: #666; margin-top: 5px; }
        .chart-container { display: flex; justify-content: center; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; color: #333; }
        tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .footer { text-align: center; color: #999; font-size: 10px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .alert-box h4 { color: #991b1b; margin-bottom: 5px; }
        .ranking-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .ranking-position { width: 30px; height: 30px; border-radius: 50%; background: #22C55E; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
        .ranking-position.gold { background: #F59E0B; }
        .ranking-position.silver { background: #9CA3AF; }
        .ranking-position.bronze { background: #D97706; }
      </style>
    </head>
    <body>
      <!-- Página 1: Resumo Executivo -->
      <div class="page">
        <div class="header">
          <h1>🏥 Relatório de Saúde Ocupacional</h1>
          <div class="period">${data.period.label}</div>
          <div class="date">Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        </div>

        <div class="section">
          <h2 class="section-title">📊 Resumo Executivo</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value">${data.summary.totalEmployees}</div>
              <div class="label">Funcionários Ativos</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.summary.checkInsTotal}</div>
              <div class="label">Check-ins Realizados</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.summary.hydrationAvgMl}ml</div>
              <div class="label">Hidratação Média</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.summary.challengesCompleted}</div>
              <div class="label">Desafios Concluídos</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">💧 Hidratação da Equipe</h2>
          <div class="chart-container">
            ${hydrationChart}
          </div>
          <p style="text-align: center; color: #666; font-size: 12px;">
            Meta diária recomendada: ${data.hydration.goal}ml | 
            Média do período: ${data.summary.hydrationAvgMl}ml 
            (${Math.round((data.summary.hydrationAvgMl / data.hydration.goal) * 100)}% da meta)
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">❤️ Pressão Arterial</h2>
          <div class="two-columns">
            <div class="chart-container">
              ${pressureChart}
            </div>
            <div>
              <table>
                <tr>
                  <th>Classificação</th>
                  <th>Quantidade</th>
                  <th>%</th>
                </tr>
                <tr>
                  <td><span class="badge badge-success">Normal</span></td>
                  <td>${data.bloodPressure.normal}</td>
                  <td>${Math.round((data.bloodPressure.normal / (data.bloodPressure.normal + data.bloodPressure.elevated + data.bloodPressure.high || 1)) * 100)}%</td>
                </tr>
                <tr>
                  <td><span class="badge badge-warning">Elevada</span></td>
                  <td>${data.bloodPressure.elevated}</td>
                  <td>${Math.round((data.bloodPressure.elevated / (data.bloodPressure.normal + data.bloodPressure.elevated + data.bloodPressure.high || 1)) * 100)}%</td>
                </tr>
                <tr>
                  <td><span class="badge badge-danger">Alta</span></td>
                  <td>${data.bloodPressure.high}</td>
                  <td>${Math.round((data.bloodPressure.high / (data.bloodPressure.normal + data.bloodPressure.elevated + data.bloodPressure.high || 1)) * 100)}%</td>
                </tr>
              </table>
            </div>
          </div>
          ${data.bloodPressure.alerts.length > 0 ? `
            <div class="alert-box">
              <h4>⚠️ Alertas de Pressão Alta</h4>
              <p>${data.bloodPressure.alerts.length} funcionário(s) com pressão elevada requerem acompanhamento.</p>
            </div>
          ` : ""}
        </div>

        <div class="footer">
          Canteiro Saudável - Sistema de Gestão de Saúde Ocupacional | Página 1
        </div>
      </div>

      <!-- Página 2: Queixas e Ergonomia -->
      <div class="page">
        <div class="header">
          <h1>🏥 Relatório de Saúde Ocupacional</h1>
          <div class="period">${data.period.label}</div>
        </div>

        <div class="section">
          <h2 class="section-title">📝 Queixas e Sintomas</h2>
          <div class="two-columns">
            <div class="chart-container">
              ${complaintsResolutionChart}
            </div>
            <div>
              <div class="summary-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="summary-card">
                  <div class="value">${data.summary.complaintsTotal}</div>
                  <div class="label">Total de Queixas</div>
                </div>
                <div class="summary-card">
                  <div class="value">${data.summary.complaintsResolved}</div>
                  <div class="label">Resolvidas</div>
                </div>
              </div>
            </div>
          </div>
          ${data.complaints.length > 0 ? `
            <table>
              <tr>
                <th>Funcionário</th>
                <th>Queixa</th>
                <th>Severidade</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
              ${data.complaints.slice(0, 10).map(c => `
                <tr>
                  <td>${c.employeeName}</td>
                  <td>${c.complaint}</td>
                  <td><span class="badge ${c.severity === "alta" ? "badge-danger" : c.severity === "media" ? "badge-warning" : "badge-info"}">${c.severity}</span></td>
                  <td>${c.date}</td>
                  <td><span class="badge ${c.resolved ? "badge-success" : "badge-danger"}">${c.resolved ? "Resolvida" : "Pendente"}</span></td>
                </tr>
              `).join("")}
            </table>
          ` : "<p style='color: #666; text-align: center;'>Nenhuma queixa registrada no período.</p>"}
        </div>

        <div class="section">
          <h2 class="section-title">🧘 Ergonomia e Pausas Ativas</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value">${data.ergonomics.totalPauses}</div>
              <div class="label">Pausas Realizadas</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.ergonomics.totalStretches}</div>
              <div class="label">Alongamentos</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.ergonomics.avgPausesPerDay.toFixed(1)}</div>
              <div class="label">Média/Dia</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.ergonomics.adherenceRate}%</div>
              <div class="label">Taxa de Adesão</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🧠 Saúde Mental</h2>
          <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="summary-card">
              <div class="value">${data.mentalHealth.breathingExercises}</div>
              <div class="label">Exercícios de Respiração</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.mentalHealth.psychologistContacts}</div>
              <div class="label">Contatos c/ Psicóloga</div>
            </div>
            <div class="summary-card">
              <div class="value">${data.mentalHealth.wellbeingScore}/10</div>
              <div class="label">Score de Bem-estar</div>
            </div>
          </div>
        </div>

        <div class="footer">
          Canteiro Saudável - Sistema de Gestão de Saúde Ocupacional | Página 2
        </div>
      </div>

      <!-- Página 3: Desafios e Ranking -->
      <div class="page">
        <div class="header">
          <h1>🏥 Relatório de Saúde Ocupacional</h1>
          <div class="period">${data.period.label}</div>
        </div>

        <div class="section">
          <h2 class="section-title">🏆 Desafios</h2>
          <div class="two-columns">
            <div>
              <h3 style="font-size: 14px; margin-bottom: 10px; color: #333;">Desafios Ativos</h3>
              ${data.challenges.active.length > 0 ? `
                <table>
                  <tr>
                    <th>Desafio</th>
                    <th>Participantes</th>
                    <th>Progresso Médio</th>
                  </tr>
                  ${data.challenges.active.map(c => `
                    <tr>
                      <td>${c.name}</td>
                      <td>${c.participants}</td>
                      <td>${c.avgProgress}%</td>
                    </tr>
                  `).join("")}
                </table>
              ` : "<p style='color: #666;'>Nenhum desafio ativo.</p>"}
            </div>
            <div>
              <h3 style="font-size: 14px; margin-bottom: 10px; color: #333;">Desafios Concluídos</h3>
              ${data.challenges.completed.length > 0 ? `
                <table>
                  <tr>
                    <th>Desafio</th>
                    <th>Concluídos</th>
                    <th>Média de Dias</th>
                  </tr>
                  ${data.challenges.completed.map(c => `
                    <tr>
                      <td>${c.name}</td>
                      <td>${c.completedBy}</td>
                      <td>${c.avgDays} dias</td>
                    </tr>
                  `).join("")}
                </table>
              ` : "<p style='color: #666;'>Nenhum desafio concluído no período.</p>"}
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🥇 Ranking de Engajamento</h2>
          <div style="max-width: 500px; margin: 0 auto;">
            ${data.ranking.slice(0, 10).map((r, i) => `
              <div class="ranking-item">
                <div class="ranking-position ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}">${r.position}</div>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${r.name}</div>
                  <div style="font-size: 12px; color: #666;">${r.points} pontos | ${r.streak} dias de sequência</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section" style="margin-top: 40px;">
          <h2 class="section-title">📋 Recomendações</h2>
          <ul style="padding-left: 20px; color: #666;">
            ${data.bloodPressure.high > 0 ? `<li>Acompanhar ${data.bloodPressure.high} funcionário(s) com pressão arterial elevada</li>` : ""}
            ${data.summary.complaintsTotal - data.summary.complaintsResolved > 0 ? `<li>Resolver ${data.summary.complaintsTotal - data.summary.complaintsResolved} queixa(s) pendente(s)</li>` : ""}
            ${data.summary.hydrationAvgMl < data.hydration.goal * 0.7 ? `<li>Incentivar maior hidratação - média atual abaixo de 70% da meta</li>` : ""}
            ${data.ergonomics.adherenceRate < 50 ? `<li>Reforçar importância das pausas ativas - adesão em ${data.ergonomics.adherenceRate}%</li>` : ""}
            <li>Continuar incentivando participação nos desafios de saúde</li>
          </ul>
        </div>

        <div class="footer">
          Canteiro Saudável - Sistema de Gestão de Saúde Ocupacional | Página 3
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generatePDFReport(data: ReportData): Promise<string> {
  try {
    const html = generateHTMLReport(data);
    
    // Gerar PDF usando expo-print
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Retornar URI gerada pelo expo-print
    return uri;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}

export async function sharePDFReport(uri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar Relatório de Saúde",
        UTI: "com.adobe.pdf",
      });
    } else {
      throw new Error("Compartilhamento não disponível neste dispositivo");
    }
  } catch (error) {
    console.error("Erro ao compartilhar PDF:", error);
    throw error;
  }
}

export async function emailPDFReport(uri: string, email: string, subject: string): Promise<void> {
  // Esta função seria implementada com um serviço de email no backend
  // Por enquanto, usamos o compartilhamento nativo
  await sharePDFReport(uri);
}

// Função auxiliar para criar dados de exemplo para teste
export function createMockReportData(): ReportData {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return {
    period: {
      start: monthAgo.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
      label: `${monthAgo.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${today.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`,
    },
    summary: {
      totalEmployees: 45,
      activeEmployees: 42,
      checkInsTotal: 892,
      checkInsAvgPerDay: 29.7,
      hydrationAvgMl: 1850,
      complaintsTotal: 12,
      complaintsResolved: 9,
      challengesActive: 5,
      challengesCompleted: 23,
    },
    hydration: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      values: [1720, 1890, 1950, 1840],
      goal: 2500,
    },
    bloodPressure: {
      normal: 35,
      elevated: 7,
      high: 3,
      alerts: [
        { employeeName: "João Silva", systolic: 145, diastolic: 95, date: "22/01/2026" },
        { employeeName: "Maria Santos", systolic: 150, diastolic: 92, date: "20/01/2026" },
        { employeeName: "Pedro Costa", systolic: 142, diastolic: 90, date: "18/01/2026" },
      ],
    },
    complaints: [
      { employeeName: "Ana Lima", complaint: "Dor lombar", severity: "media", date: "23/01/2026", resolved: false },
      { employeeName: "Carlos Souza", complaint: "Dor de cabeça frequente", severity: "baixa", date: "21/01/2026", resolved: true },
      { employeeName: "Fernanda Oliveira", complaint: "Dor no pulso", severity: "alta", date: "19/01/2026", resolved: false },
    ],
    ergonomics: {
      totalPauses: 1245,
      totalStretches: 890,
      avgPausesPerDay: 41.5,
      adherenceRate: 72,
    },
    mentalHealth: {
      breathingExercises: 456,
      psychologistContacts: 8,
      wellbeingScore: 7.2,
    },
    challenges: {
      active: [
        { name: "Caminhada 10km/semana", participants: 18, avgProgress: 65 },
        { name: "Hidratação 2.5L/dia", participants: 32, avgProgress: 78 },
        { name: "Perda de Peso", participants: 12, avgProgress: 45 },
      ],
      completed: [
        { name: "30 dias sem açúcar", completedBy: 8, avgDays: 32 },
        { name: "Alongamento diário", completedBy: 15, avgDays: 21 },
      ],
    },
    ranking: [
      { position: 1, name: "Maria Santos", points: 2450, streak: 28 },
      { position: 2, name: "João Silva", points: 2280, streak: 21 },
      { position: 3, name: "Ana Lima", points: 2150, streak: 18 },
      { position: 4, name: "Pedro Costa", points: 1980, streak: 15 },
      { position: 5, name: "Carlos Souza", points: 1850, streak: 12 },
    ],
  };
}
