import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

interface AnalyticsData {
  period: string;
  summary: {
    totalReferrals: number;
    resolvedReferrals: number;
    pendingReferrals: number;
    uniqueWorkers: number;
    absenteeismRate: number;
  };
  charts: {
    topComplaints: { x: number; y: number; label: string }[];
    emotionalDistribution: { x: number; y: number; label: string }[];
    checkInTimeSeries: { x: number; y: number; label: string }[];
    ergonomicRiskData: { x: number; y: number; label: string }[];
  };
}

const getPeriodLabel = (period: string): string => {
  switch (period) {
    case "week":
      return "Última Semana";
    case "month":
      return "Último Mês";
    case "quarter":
      return "Últimos 3 Meses";
    default:
      return period;
  }
};

const generateHTMLReport = (data: AnalyticsData, email: string): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Saúde Ocupacional - Canteiro Saudável</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      color: #0a7ea4;
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .header p {
      color: #666;
      font-size: 11px;
    }
    
    .metadata {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 10px;
    }
    
    .metadata-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .metadata-row:last-child {
      margin-bottom: 0;
    }
    
    .metadata strong {
      color: #0a7ea4;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 16px;
      color: #0a7ea4;
      border-bottom: 2px solid #0a7ea4;
      padding-bottom: 5px;
      margin-bottom: 12px;
    }
    
    .indicators {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .indicator-card {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 12px;
      text-align: center;
    }
    
    .indicator-value {
      font-size: 28px;
      font-weight: bold;
      color: #0a7ea4;
      margin-bottom: 5px;
    }
    
    .indicator-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }
    
    .chart-section {
      margin-bottom: 20px;
    }
    
    .chart-title {
      font-size: 13px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    
    .chart-data {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 10px;
    }
    
    .chart-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .chart-item:last-child {
      border-bottom: none;
    }
    
    .chart-label {
      font-size: 11px;
      color: #333;
    }
    
    .chart-value {
      font-size: 11px;
      font-weight: bold;
      color: #0a7ea4;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    
    .signature {
      margin-top: 40px;
      text-align: right;
      font-size: 11px;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      width: 250px;
      margin: 30px 0 5px auto;
    }
    
    @media print {
      body {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌱 Canteiro Saudável</h1>
    <p>Relatório de Indicadores de Saúde Ocupacional</p>
  </div>
  
  <div class="metadata">
    <div class="metadata-row">
      <span><strong>Período:</strong> ${getPeriodLabel(data.period)}</span>
      <span><strong>Data de Geração:</strong> ${dateStr} às ${timeStr}</span>
    </div>
    <div class="metadata-row">
      <span><strong>Responsável:</strong> ${email}</span>
      <span><strong>Obra:</strong> 345</span>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">📊 Indicadores Gerais</h2>
    <div class="indicators">
      <div class="indicator-card">
        <div class="indicator-value">${data.summary.absenteeismRate}%</div>
        <div class="indicator-label">Taxa de Absenteísmo</div>
      </div>
      <div class="indicator-card">
        <div class="indicator-value">${data.summary.uniqueWorkers}</div>
        <div class="indicator-label">Trabalhadores</div>
      </div>
      <div class="indicator-card">
        <div class="indicator-value">${data.summary.resolvedReferrals}</div>
        <div class="indicator-label">Casos Resolvidos</div>
      </div>
      <div class="indicator-card">
        <div class="indicator-value">${data.summary.pendingReferrals}</div>
        <div class="indicator-label">Casos Pendentes</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">🔍 Análise Detalhada</h2>
    
    <div class="chart-section">
      <div class="chart-title">Top 10 Queixas Mais Comuns</div>
      <div class="chart-data">
        ${data.charts.topComplaints
          .slice(0, 10)
          .map(
            (item) => `
          <div class="chart-item">
            <span class="chart-label">${item.label}</span>
            <span class="chart-value">${item.y} casos</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
    
    <div class="chart-section">
      <div class="chart-title">Distribuição de Estados Emocionais</div>
      <div class="chart-data">
        ${data.charts.emotionalDistribution
          .map(
            (item) => `
          <div class="chart-item">
            <span class="chart-label">${item.label}</span>
            <span class="chart-value">${item.y} registros</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
    
    <div class="chart-section">
      <div class="chart-title">Riscos Ergonômicos Relatados</div>
      <div class="chart-data">
        ${data.charts.ergonomicRiskData
          .map(
            (item) => `
          <div class="chart-item">
            <span class="chart-label">${item.label}</span>
            <span class="chart-value">${item.y} relatos</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </div>
  
  <div class="signature">
    <div class="signature-line"></div>
    <p><strong>Denise Alves da Silva</strong></p>
    <p>Técnica de Enfermagem do Trabalho</p>
    <p>SESMT - Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho</p>
  </div>
  
  <div class="footer">
    <p>© 2026 Canteiro Saudável - Todos os direitos reservados</p>
    <p>Criado por Denise Alves da Silva | Propriedade Intelectual Protegida (Lei nº 9.610/98)</p>
    <p>Este relatório contém informações confidenciais e deve ser tratado com sigilo profissional</p>
  </div>
</body>
</html>
  `;
};

export const generateHealthReport = async (
  data: AnalyticsData,
  email: string
): Promise<void> => {
  try {
    const html = generateHTMLReport(data, email);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log("PDF gerado:", uri);

    // Compartilhar o PDF
    if (Platform.OS === "web") {
      // No web, fazer download direto
      const link = document.createElement("a");
      link.href = uri;
      link.download = `relatorio-saude-${Date.now()}.pdf`;
      link.click();
      Alert.alert("Sucesso", "Relatório exportado com sucesso!");
    } else {
      // No mobile, usar expo-sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Relatório de Saúde",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Sucesso", `Relatório salvo em: ${uri}`);
      }
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    Alert.alert("Erro", "Não foi possível gerar o relatório PDF");
    throw error;
  }
};
