import { useCallback } from 'react';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  data: {
    highPressureEmployees?: Array<{
      name: string;
      matricula: string;
      pressure: string;
      date: string;
    }>;
    symptomHistory?: Array<{
      name: string;
      symptom: string;
      intensity: string;
      date: string;
    }>;
    checkInFrequency?: Array<{
      name: string;
      matricula: string;
      checkIns: number;
      percentage: number;
    }>;
    challengePhotos?: Array<{
      challenge: string;
      count: number;
      photos: string[];
    }>;
    statistics?: {
      totalEmployees: number;
      activeEmployees: number;
      averagePressure: string;
      averageHydration: number;
      averageCheckIns: number;
    };
  };
}

export function usePdfReports() {
  // Gerar relatório de funcionários com pressão alta
  const generateHighPressureReport = useCallback(
    async (employees: ReportData['data']['highPressureEmployees']) => {
      try {
        let html = `
          <html>
            <head>
              <style>
                body { font-family: Arial; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
                .header { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>Relatório: Funcionários com Pressão Alta</h1>
              <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
              <table>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Pressão</th>
                  <th>Data</th>
                </tr>
        `;

        employees?.forEach((emp) => {
          html += `
            <tr>
              <td>${emp.name}</td>
              <td>${emp.matricula}</td>
              <td>${emp.pressure}</td>
              <td>${emp.date}</td>
            </tr>
          `;
        });

        html += `
              </table>
            </body>
          </html>
        `;

        const fileName = `relatorio-pressao-alta-${Date.now()}.html`;
        const filePath = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(filePath, html);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }

        return filePath;
      } catch (error) {
        console.error('Erro ao gerar relatório de pressão alta:', error);
        throw error;
      }
    },
    []
  );

  // Gerar relatório de histórico de sintomas
  const generateSymptomHistoryReport = useCallback(
    async (symptoms: ReportData['data']['symptomHistory']) => {
      try {
        let html = `
          <html>
            <head>
              <style>
                body { font-family: Arial; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #2196F3; color: white; }
              </style>
            </head>
            <body>
              <h1>Relatório: Histórico de Sintomas</h1>
              <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
              <table>
                <tr>
                  <th>Nome</th>
                  <th>Sintoma</th>
                  <th>Intensidade</th>
                  <th>Data</th>
                </tr>
        `;

        symptoms?.forEach((sym) => {
          html += `
            <tr>
              <td>${sym.name}</td>
              <td>${sym.symptom}</td>
              <td>${sym.intensity}</td>
              <td>${sym.date}</td>
            </tr>
          `;
        });

        html += `
              </table>
            </body>
          </html>
        `;

        const fileName = `relatorio-sintomas-${Date.now()}.html`;
        const filePath = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(filePath, html);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }

        return filePath;
      } catch (error) {
        console.error('Erro ao gerar relatório de sintomas:', error);
        throw error;
      }
    },
    []
  );

  // Gerar relatório de frequência de check-ins
  const generateCheckInFrequencyReport = useCallback(
    async (checkIns: ReportData['data']['checkInFrequency']) => {
      try {
        let html = `
          <html>
            <head>
              <style>
                body { font-family: Arial; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #FF9800; color: white; }
                .high { background-color: #c8e6c9; }
                .medium { background-color: #fff9c4; }
                .low { background-color: #ffccbc; }
              </style>
            </head>
            <body>
              <h1>Relatório: Frequência de Check-ins</h1>
              <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
              <table>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Check-ins</th>
                  <th>Percentual</th>
                </tr>
        `;

        checkIns?.forEach((ci) => {
          let rowClass = '';
          if (ci.percentage >= 80) rowClass = 'high';
          else if (ci.percentage >= 50) rowClass = 'medium';
          else rowClass = 'low';

          html += `
            <tr class="${rowClass}">
              <td>${ci.name}</td>
              <td>${ci.matricula}</td>
              <td>${ci.checkIns}</td>
              <td>${ci.percentage}%</td>
            </tr>
          `;
        });

        html += `
              </table>
            </body>
          </html>
        `;

        const fileName = `relatorio-checkins-${Date.now()}.html`;
        const filePath = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(filePath, html);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }

        return filePath;
      } catch (error) {
        console.error('Erro ao gerar relatório de check-ins:', error);
        throw error;
      }
    },
    []
  );

  // Gerar relatório consolidado
  const generateConsolidatedReport = useCallback(
    async (report: ReportData) => {
      try {
        const stats = report.data.statistics;

        let html = `
          <html>
            <head>
              <style>
                body { font-family: Arial; margin: 20px; background-color: #f5f5f5; }
                h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 30px; }
                .card { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .stat { display: inline-block; width: 23%; margin: 1%; text-align: center; padding: 15px; background-color: #e8f5e9; border-radius: 5px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
                .stat-label { font-size: 12px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
              </style>
            </head>
            <body>
              <h1>${report.title}</h1>
              <p><strong>Período:</strong> ${report.period}</p>
              <p><strong>Gerado em:</strong> ${report.generatedAt}</p>

              <div class="card">
                <h2>Estatísticas Gerais</h2>
                <div class="stat">
                  <div class="stat-value">${stats?.totalEmployees || 0}</div>
                  <div class="stat-label">Total de Funcionários</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats?.activeEmployees || 0}</div>
                  <div class="stat-label">Funcionários Ativos</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats?.averagePressure || '--'}</div>
                  <div class="stat-label">Pressão Média</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats?.averageHydration || 0}L</div>
                  <div class="stat-label">Hidratação Média</div>
                </div>
              </div>
        `;

        if (report.data.highPressureEmployees && report.data.highPressureEmployees.length > 0) {
          html += `
            <div class="card">
              <h2>Funcionários com Pressão Alta</h2>
              <table>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Pressão</th>
                  <th>Data</th>
                </tr>
          `;
          report.data.highPressureEmployees.forEach((emp) => {
            html += `
              <tr>
                <td>${emp.name}</td>
                <td>${emp.matricula}</td>
                <td>${emp.pressure}</td>
                <td>${emp.date}</td>
              </tr>
            `;
          });
          html += `</table></div>`;
        }

        html += `
            </body>
          </html>
        `;

        const fileName = `relatorio-consolidado-${Date.now()}.html`;
        const filePath = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(filePath, html);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }

        return filePath;
      } catch (error) {
        console.error('Erro ao gerar relatório consolidado:', error);
        throw error;
      }
    },
    []
  );

  return {
    generateHighPressureReport,
    generateSymptomHistoryReport,
    generateCheckInFrequencyReport,
    generateConsolidatedReport,
  };
}
