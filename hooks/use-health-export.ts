import { CheckIn, PressureReading, SymptomReport } from "@/lib/types";

export interface HealthExportData {
  mes: string;
  ano: number;
  totalCheckIns: number;
  checkInsPositivos: number;
  checkInsComDor: number;
  pressaoMedia: { systolic: number; diastolic: number } | null;
  pressaoAlta: number;
  pressaoNormal: number;
  sintomaMaisComum: string | null;
  totalSintomas: number;
}

export function useHealthExport() {
  const exportarDadosMensais = (
    checkIns: CheckIn[],
    pressureReadings: PressureReading[],
    symptomReports: SymptomReport[],
    mes?: number,
    ano?: number
  ): HealthExportData => {
    const hoje = new Date();
    const mesAtual = mes ?? hoje.getMonth() + 1;
    const anoAtual = ano ?? hoje.getFullYear();

    // Filtrar dados do mês
    const checkInsMes = checkIns.filter((c) => {
      const date = new Date(c.date);
      return date.getMonth() + 1 === mesAtual && date.getFullYear() === anoAtual;
    });

    const pressureMes = pressureReadings.filter((p) => {
      const date = new Date(p.date);
      return date.getMonth() + 1 === mesAtual && date.getFullYear() === anoAtual;
    });

    const symptomsMes = symptomReports.filter((s) => {
      const date = new Date(s.date);
      return date.getMonth() + 1 === mesAtual && date.getFullYear() === anoAtual;
    });

    // Calcular estatísticas
    const totalCheckIns = checkInsMes.length;
    const checkInsPositivos = checkInsMes.filter((c) => c.status === "bem").length;
    const checkInsComDor = checkInsMes.filter((c) => c.status === "dor-forte").length;

    // Pressão média
    let pressaoMedia = null;
    if (pressureMes.length > 0) {
      const avgSystolic = Math.round(
        pressureMes.reduce((sum, p) => sum + p.systolic, 0) / pressureMes.length
      );
      const avgDiastolic = Math.round(
        pressureMes.reduce((sum, p) => sum + p.diastolic, 0) / pressureMes.length
      );
      pressaoMedia = { systolic: avgSystolic, diastolic: avgDiastolic };
    }

    // Pressão alta (> 140/90)
    const pressaoAlta = pressureMes.filter((p) => p.systolic > 140 || p.diastolic > 90).length;
    const pressaoNormal = pressureMes.filter((p) => p.systolic <= 120 && p.diastolic <= 80).length;

    // Sintoma mais comum
    const sintomaCounts: { [key: string]: number } = {};
    symptomsMes.forEach((report) => {
      report.symptoms.forEach((symptom) => {
        sintomaCounts[symptom] = (sintomaCounts[symptom] || 0) + 1;
      });
    });

    let sintomaMaisComum = null;
    let maxCount = 0;
    for (const [symptom, count] of Object.entries(sintomaCounts)) {
      if (count > maxCount) {
        maxCount = count;
        sintomaMaisComum = symptom;
      }
    }

    const totalSintomas = Object.values(sintomaCounts).reduce((a, b) => a + b, 0);

    const mesNome = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
      new Date(anoAtual, mesAtual - 1)
    );

    return {
      mes: mesNome,
      ano: anoAtual,
      totalCheckIns,
      checkInsPositivos,
      checkInsComDor,
      pressaoMedia,
      pressaoAlta,
      pressaoNormal,
      sintomaMaisComum,
      totalSintomas,
    };
  };

  const gerarRelatorioCSV = (
    checkIns: CheckIn[],
    pressureReadings: PressureReading[],
    symptomReports: SymptomReport[]
  ): string => {
    let csv = "Data,Tipo,Valor\n";

    // Check-ins
    checkIns.forEach((c) => {
      csv += `${c.date},Check-in,${c.status}\n`;
    });

    // Pressão
    pressureReadings.forEach((p) => {
      csv += `${p.date},Pressão Sistólica,${p.systolic}\n`;
      csv += `${p.date},Pressão Diastólica,${p.diastolic}\n`;
    });

    // Sintomas
    symptomReports.forEach((s) => {
      csv += `${s.date},Sintomas,"${s.symptoms.join(", ")}"\n`;
    });

    return csv;
  };

  const gerarRelatorioJSON = (
    checkIns: CheckIn[],
    pressureReadings: PressureReading[],
    symptomReports: SymptomReport[]
  ): string => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        checkIns,
        pressureReadings,
        symptomReports,
      },
      null,
      2
    );
  };

  return {
    exportarDadosMensais,
    gerarRelatorioCSV,
    gerarRelatorioJSON,
  };
}
