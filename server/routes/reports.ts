import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { healthReferrals, aggregatedHealthData } from "../../drizzle/schema";
import { gte, desc } from "drizzle-orm";
import PDFDocument from "pdfkit";

const router = Router();

interface ReportData {
  period: string;
  totalEmployees: number;
  totalCheckIns: number;
  averagePressure: {
    systolic: number;
    diastolic: number;
  };
  wellnessDistribution: {
    good: number;
    mild: number;
    severe: number;
  };
  referralsCount: number;
  atRiskEmployees: number;
  trends: {
    pressureTrend: string;
    wellnessTrend: string;
    referralsTrend: string;
  };
  recommendations: string[];
}

/**
 * GET /api/reports/pdf
 * Gerar relatório em PDF
 */
router.get("/pdf", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { period = "month" } = req.query;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Calcular período
    const endDate = new Date();
    const startDate = new Date();

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    // Obter dados agregados
    const aggregated = await db
      .select()
      .from(aggregatedHealthData)
      .orderBy(desc(aggregatedHealthData.updatedAt))
      .limit(1);

    const latestData = aggregated[0];

    // Obter encaminhamentos do período
    const referrals = await db
      .select()
      .from(healthReferrals)
      .where(gte(healthReferrals.createdAt as any, startDate.toISOString() as any));

    // Calcular estatísticas
    const totalEmployees = latestData?.totalWorkers || 0;
    const totalCheckIns = latestData?.totalCheckIns || 0;
    const avgSystolic = parseFloat(latestData?.avgPressureSystolic as any) || 0;
    const avgDiastolic = parseFloat(latestData?.avgPressureDiastolic as any) || 0;

    const wellnessGood = latestData?.checkInBem || 0;
    const wellnessMild = latestData?.checkInDorLeve || 0;
    const wellnessSevere = latestData?.checkInDorForte || 0;

    const atRiskEmployees = new Set(
      referrals.filter((r: any) => r.status !== "resolvido").map((r: any) => r.workerId)
    ).size;

    // Gerar recomendações
    const recommendations: string[] = [];

    if (avgSystolic > 140 || avgDiastolic > 90) {
      recommendations.push(
        "🔴 CRÍTICO: Pressão arterial média acima do normal. Recomenda-se intensificar monitoramento e campanhas de conscientização."
      );
    } else if (avgSystolic > 130 || avgDiastolic > 85) {
      recommendations.push(
        "🟡 ATENÇÃO: Pressão arterial em nível pré-hipertensão. Implementar programa de controle de estresse."
      );
    } else {
      recommendations.push("✅ Pressão arterial dentro dos limites normais. Manter monitoramento regular.");
    }

    if (wellnessSevere > wellnessGood * 0.2) {
      recommendations.push(
        "🔴 Alto índice de dores fortes. Revisar ergonomia dos postos de trabalho e implementar pausas ativas mais frequentes."
      );
    }

    if (atRiskEmployees > totalEmployees * 0.1) {
      recommendations.push(
        "🟡 Mais de 10% dos empregados com queixas pendentes. Aumentar recursos do SESMT."
      );
    }

    if (totalCheckIns < totalEmployees * 0.5) {
      recommendations.push(
        "📊 Baixa adesão ao programa. Intensificar campanhas de engajamento e lembretes."
      );
    } else if (totalCheckIns >= totalEmployees * 0.8) {
      recommendations.push("✅ Excelente adesão ao programa. Manter estratégia atual.");
    }

    // Criar documento PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    // Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio-saude-ocupacional.pdf"');

    doc.pipe(res);

    // Título
    doc.fontSize(24).font("Helvetica-Bold").text("Relatório de Saúde Ocupacional", {
      align: "center",
    });

    doc.fontSize(12).font("Helvetica").text(`Período: ${startDate.toLocaleDateString("pt-BR")} a ${endDate.toLocaleDateString("pt-BR")}`, {
      align: "center",
    });

    doc.moveDown();

    // Resumo Executivo
    doc.fontSize(16).font("Helvetica-Bold").text("📊 Resumo Executivo");
    doc.fontSize(11).font("Helvetica");

    const summaryData = [
      [`Total de Empregados`, `${totalEmployees}`],
      [`Check-ins Realizados`, `${totalCheckIns}`],
      [`Taxa de Adesão`, `${totalEmployees > 0 ? ((totalCheckIns / totalEmployees) * 100).toFixed(1) : 0}%`],
      [`Pressão Arterial Média`, `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`],
      [`Empregados em Risco`, `${atRiskEmployees}`],
    ];

    summaryData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });

    doc.moveDown();

    // Distribuição de Bem-estar
    doc.fontSize(16).font("Helvetica-Bold").text("😊 Distribuição de Bem-estar");
    doc.fontSize(11).font("Helvetica");

    const total = wellnessGood + wellnessMild + wellnessSevere;
    const goodPercent = total > 0 ? ((wellnessGood / total) * 100).toFixed(1) : 0;
    const mildPercent = total > 0 ? ((wellnessMild / total) * 100).toFixed(1) : 0;
    const severePercent = total > 0 ? ((wellnessSevere / total) * 100).toFixed(1) : 0;

    doc.text(`✅ Tudo Bem: ${wellnessGood} (${goodPercent}%)`);
    doc.text(`😐 Dor Leve: ${wellnessMild} (${mildPercent}%)`);
    doc.text(`😢 Dor Forte: ${wellnessSevere} (${severePercent}%)`);

    doc.moveDown();

    // Encaminhamentos
    doc.fontSize(16).font("Helvetica-Bold").text("📋 Encaminhamentos");
    doc.fontSize(11).font("Helvetica");

    const pendingReferrals = referrals.filter((r: any) => r.status === "pendente").length;
    const inProgressReferrals = referrals.filter((r: any) => r.status === "em-atendimento").length;
    const resolvedReferrals = referrals.filter((r: any) => r.status === "resolvido").length;

    doc.text(`Total: ${referrals.length}`);
    doc.text(`Pendentes: ${pendingReferrals}`);
    doc.text(`Em Atendimento: ${inProgressReferrals}`);
    doc.text(`Resolvidos: ${resolvedReferrals}`);

    doc.moveDown();

    // Recomendações
    doc.fontSize(16).font("Helvetica-Bold").text("💡 Recomendações");
    doc.fontSize(11).font("Helvetica");

    recommendations.forEach((rec) => {
      doc.text(`• ${rec}`, { align: "left" });
      doc.moveDown(0.3);
    });

    doc.moveDown();

    // Rodapé
    doc.fontSize(9).font("Helvetica").text(
      `Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      {
        align: "center",
      }
    );

    doc.text("Canteiro Saudável - Sistema de Saúde Ocupacional", {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

/**
 * GET /api/reports/data
 * Obter dados para análise de relatório
 */
router.get("/data", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { period = "month" } = req.query;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não disponível" });
    }

    // Calcular período
    const endDate = new Date();
    const startDate = new Date();

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    // Obter dados agregados
    const aggregated = await db
      .select()
      .from(aggregatedHealthData)
      .orderBy(desc(aggregatedHealthData.updatedAt))
      .limit(1);

    const latestData = aggregated[0];

    // Obter encaminhamentos
    const referrals = await db
      .select()
      .from(healthReferrals)
      .where(gte(healthReferrals.createdAt as any, startDate.toISOString() as any));

    const reportData: ReportData = {
      period: period as string,
      totalEmployees: latestData?.totalWorkers || 0,
      totalCheckIns: latestData?.totalCheckIns || 0,
      averagePressure: {
        systolic: parseFloat(latestData?.avgPressureSystolic as any) || 0,
        diastolic: parseFloat(latestData?.avgPressureDiastolic as any) || 0,
      },
      wellnessDistribution: {
        good: latestData?.checkInBem || 0,
        mild: latestData?.checkInDorLeve || 0,
        severe: latestData?.checkInDorForte || 0,
      },
      referralsCount: referrals.length,
      atRiskEmployees: new Set(
        referrals.filter((r: any) => r.status !== "resolvido").map((r: any) => r.workerId)
      ).size,
      trends: {
        pressureTrend: "estável",
        wellnessTrend: "melhorando",
        referralsTrend: "reduzindo",
      },
      recommendations: [],
    };

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Erro ao obter dados de relatório:", error);
    res.status(500).json({ error: "Erro ao obter dados de relatório" });
  }
});

export default router;
