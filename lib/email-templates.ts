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

interface Alert {
  type: "pressure" | "hydration" | "complaint";
  employeeName: string;
  employeeMatricula: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export function generateDailyReportEmail(
  stats: DashboardStats,
  employees: EmployeeRecord[],
  alerts: Alert[] = [],
  date: string = new Date().toLocaleDateString("pt-BR")
): string {
  const alertsHtml =
    alerts.length > 0
      ? `
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="color: #991b1b; margin-top: 0;">⚠️ Alertas do Dia (${alerts.length})</h3>
      ${alerts
        .map(
          (alert) => `
        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
          <strong>${alert.employeeName}</strong> (Mat: ${alert.employeeMatricula})<br>
          <span style="color: #dc2626;">${alert.message}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : "";

  const employeesNeedingAttention = employees.filter(
    (emp) =>
      (emp.lastPressure && (emp.lastPressure.systolic >= 140 || emp.lastPressure.diastolic >= 90)) ||
      emp.hydrationToday / emp.hydrationGoal < 0.5 ||
      emp.complaintsCount > 0
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0a7ea4;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #687076;
      margin: 5px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #0a7ea4;
    }
    .stat-label {
      font-size: 13px;
      color: #687076;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #11181C;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #0a7ea4;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
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
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
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
    .attention-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Canteiro Saudável</h1>
      <p><strong>Relatório Diário de Saúde Ocupacional</strong></p>
      <p>Data: ${date}</p>
    </div>

    ${alertsHtml}

    <div class="section">
      <h2>📊 Resumo do Dia</h2>
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
          <div class="stat-label">Check-ins Realizados</div>
          <div class="stat-value">${stats.checkInsToday}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Hidratação Média</div>
          <div class="stat-value">${stats.hydrationAverage}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Queixas Reportadas</div>
          <div class="stat-value">${stats.complaintsThisWeek}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Desafios Ativos</div>
          <div class="stat-value">${stats.challengesActive}</div>
        </div>
      </div>
    </div>

    ${
      employeesNeedingAttention.length > 0
        ? `
    <div class="section">
      <div class="attention-box">
        <h3 style="color: #92400e; margin-top: 0;">⚠️ Funcionários que Precisam de Atenção (${employeesNeedingAttention.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${employeesNeedingAttention
              .map((emp) => {
                const reasons = [];
                if (emp.lastPressure && (emp.lastPressure.systolic >= 140 || emp.lastPressure.diastolic >= 90)) {
                  reasons.push(`Pressão elevada (${emp.lastPressure.systolic}/${emp.lastPressure.diastolic})`);
                }
                if (emp.hydrationToday / emp.hydrationGoal < 0.5) {
                  reasons.push(`Hidratação baixa (${Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}%)`);
                }
                if (emp.complaintsCount > 0) {
                  reasons.push(`${emp.complaintsCount} queixa(s) reportada(s)`);
                }
                return `
                <tr>
                  <td><strong>${emp.name}</strong></td>
                  <td>${emp.matricula}</td>
                  <td>${reasons.join(", ")}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>👷 Status dos Funcionários</h2>
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
              <td>
                <span class="badge ${emp.hydrationToday / emp.hydrationGoal >= 0.8 ? "badge-success" : emp.hydrationToday / emp.hydrationGoal >= 0.5 ? "badge-warning" : "badge-error"}">
                  ${Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}%
                </span>
              </td>
              <td>${emp.lastPressure ? `${emp.lastPressure.systolic}/${emp.lastPressure.diastolic}` : "Sem registro"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      `
      }
    </div>

    <div class="footer">
      <p><strong>Canteiro Saudável</strong> - Sistema de Gestão de Saúde Ocupacional</p>
      <p>Relatório gerado automaticamente em ${new Date().toLocaleString("pt-BR")}</p>
      <p style="margin-top: 10px;">
        Este é um e-mail automático. Para acessar o dashboard completo, faça login no aplicativo.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateTestEmail(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #0a7ea4;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Teste de Configuração de E-mail</h1>
    <p>Este é um e-mail de teste do sistema <strong>Canteiro Saudável</strong>.</p>
    <p>Se você recebeu este e-mail, significa que a configuração de SMTP está funcionando corretamente!</p>
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #687076; font-size: 12px;">
      Enviado em ${new Date().toLocaleString("pt-BR")}
    </p>
  </div>
</body>
</html>
  `;
}
