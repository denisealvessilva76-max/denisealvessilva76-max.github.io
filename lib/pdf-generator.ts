import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

interface DashboardStats {
  totalEmployees: number;
  activeToday: number;
  checkInsToday: number;
  hydrationAverage: number;
  complaintsThisWeek: number;
  challengesActive: number;
  ergonomicsAdherence: number;
  mentalHealthUsage: number;
}

interface EmployeeRecord {
  id: string;
  name: string;
  matricula: string;
  lastCheckIn: string | null;
  hydrationToday: number;
  hydrationGoal: number;
  lastPressure: { systolic: number; diastolic: number } | null;
  complaintsCount: number;
  challengesActive: number;
}

interface ComplaintDetail {
  employeeName: string;
  employeeMatricula: string;
  type: string;
  description: string;
  severity: string;
  date: string;
  resolved: boolean;
}

interface ChallengeDetail {
  employeeName: string;
  employeeMatricula: string;
  challengeName: string;
  progress: number;
  startDate: string;
  checkIns: number;
  photos: number;
}

export async function generateDashboardPDF(
  stats: DashboardStats,
  employees: EmployeeRecord[],
  period: string = "month",
  complaints: ComplaintDetail[] = [],
  challenges: ChallengeDetail[] = []
): Promise<string | null> {
  try {
    const currentDate = new Date().toLocaleDateString("pt-BR");
    const periodLabel =
      period === "week"
        ? "Semanal"
        : period === "month"
        ? "Mensal"
        : "Trimestral";

    // Gerar HTML do relatório
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
      background: white;
    }
    h1 {
      color: #0a7ea4;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #0a7ea4;
      margin-top: 30px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #0a7ea4;
    }
    .stat-label {
      font-size: 12px;
      color: #687076;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #11181C;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #0a7ea4;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
    }
    .badge-success {
      background: #dcfce7;
      color: #166534;
    }
    .badge-error {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #687076;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏗️ Canteiro Saudável</h1>
    <p><strong>Relatório ${periodLabel} de Saúde Ocupacional</strong></p>
    <p>Gerado em: ${currentDate}</p>
  </div>

  <h2>📊 Estatísticas Gerais</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total de Funcionários</div>
      <div class="stat-value">${stats.totalEmployees}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ativos Hoje</div>
      <div class="stat-value">${stats.activeToday}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Check-ins Hoje</div>
      <div class="stat-value">${stats.checkInsToday}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Hidratação Média</div>
      <div class="stat-value">${stats.hydrationAverage}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Queixas (Semana)</div>
      <div class="stat-value">${stats.complaintsThisWeek}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Desafios Ativos</div>
      <div class="stat-value">${stats.challengesActive}</div>
    </div>
  </div>

  <h2>👷 Detalhamento por Funcionário</h2>
  ${
    employees.length === 0
      ? '<p style="text-align: center; color: #687076; padding: 20px;">Nenhum funcionário cadastrado ainda.</p>'
      : `
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Matrícula</th>
        <th>Status</th>
        <th>Hidratação</th>
        <th>Pressão</th>
        <th>Queixas</th>
      </tr>
    </thead>
    <tbody>
      ${employees
        .map(
          (emp) => `
        <tr>
          <td><strong>${emp.name}</strong></td>
          <td>${emp.matricula}</td>
          <td>
            <span class="badge ${emp.lastCheckIn ? "badge-success" : "badge-error"}">
              ${emp.lastCheckIn ? "Ativo" : "Inativo"}
            </span>
          </td>
          <td>${emp.hydrationToday}ml / ${emp.hydrationGoal}ml (${Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}%)</td>
          <td>${emp.lastPressure ? `${emp.lastPressure.systolic}/${emp.lastPressure.diastolic} mmHg` : "Sem registro"}</td>
          <td>${emp.complaintsCount}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
  }

  <h2>📋 Queixas Detalhadas (Semana)</h2>
  ${
    complaints.length === 0
      ? '<p style="text-align: center; color: #687076; padding: 20px;">Nenhuma queixa registrada nesta semana.</p>'
      : `
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Matrícula</th>
        <th>Tipo</th>
        <th>Descrição</th>
        <th>Gravidade</th>
        <th>Data</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${complaints
        .map(
          (c) => `
        <tr>
          <td><strong>${c.employeeName}</strong></td>
          <td>${c.employeeMatricula}</td>
          <td>${c.type}</td>
          <td>${c.description}</td>
          <td>
            <span class="badge ${c.severity === "grave" ? "badge-error" : "badge-success"}">
              ${c.severity.toUpperCase()}
            </span>
          </td>
          <td>${c.date}</td>
          <td>
            <span class="badge ${c.resolved ? "badge-success" : "badge-error"}">
              ${c.resolved ? "TRATADA" : "PENDENTE"}
            </span>
          </td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
  }

  <h2>🏆 Desafios Ativos</h2>
  ${
    challenges.length === 0
      ? '<p style="text-align: center; color: #687076; padding: 20px;">Nenhum desafio ativo no momento.</p>'
      : `
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Matrícula</th>
        <th>Desafio</th>
        <th>Progresso</th>
        <th>Início</th>
        <th>Check-ins</th>
        <th>Fotos</th>
      </tr>
    </thead>
    <tbody>
      ${challenges
        .map(
          (ch) => `
        <tr>
          <td><strong>${ch.employeeName}</strong></td>
          <td>${ch.employeeMatricula}</td>
          <td>${ch.challengeName}</td>
          <td>
            <span class="badge ${ch.progress >= 75 ? "badge-success" : "badge-error"}">
              ${ch.progress}%
            </span>
          </td>
          <td>${ch.startDate}</td>
          <td>${ch.checkIns}</td>
          <td>${ch.photos}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
  }

  <div class="footer">
    <p><strong>Canteiro Saudável</strong> - Sistema de Gestão de Saúde Ocupacional</p>
    <p>Relatório gerado automaticamente pelo aplicativo</p>
  </div>
</body>
</html>
    `;

    // Gerar PDF usando expo-print
    const { uri } = await Print.printToFileAsync({ html });
    console.log("[PDF] Arquivo gerado:", uri);

    return uri;
  } catch (error) {
    console.error("[PDF] Erro ao gerar PDF:", error);
    throw error;
  }
}

export async function sharePDF(uri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Compartilhamento não disponível neste dispositivo");
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Compartilhar Relatório PDF",
      UTI: "com.adobe.pdf",
    });

    console.log("[PDF] Compartilhado com sucesso");
  } catch (error) {
    console.error("[PDF] Erro ao compartilhar PDF:", error);
    throw error;
  }
}

export async function printPDF(uri: string): Promise<void> {
  try {
    await Print.printAsync({ uri });
    console.log("[PDF] Impresso com sucesso");
  } catch (error) {
    console.error("[PDF] Erro ao imprimir PDF:", error);
    throw error;
  }
}
