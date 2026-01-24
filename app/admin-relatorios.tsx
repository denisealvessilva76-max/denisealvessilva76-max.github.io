import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function AdminRelatoriosScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedPeriod, setSelectedPeriod] = useState<"semanal" | "mensal">("mensal");

  const handleGenerateReport = (type: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Relatório Gerado",
      `Relatório ${type} (${selectedPeriod}) foi gerado e está disponível para download.`,
      [{ text: "OK" }]
    );
  };

  const handleSendEmail = (type: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "Relatório Enviado",
      `Relatório ${type} (${selectedPeriod}) foi enviado para o e-mail do administrador.`,
      [{ text: "OK" }]
    );
  };

  const reports = [
    {
      id: "hydration",
      title: "Relatório de Hidratação",
      description: "Consumo de água por empregado, metas atingidas, média diária",
      icon: "💧",
      color: colors.primary,
    },
    {
      id: "checkins",
      title: "Relatório de Check-ins",
      description: "Frequência de check-ins, sintomas reportados, tendências",
      icon: "📋",
      color: "#22C55E",
    },
    {
      id: "blood-pressure",
      title: "Relatório de Pressão Arterial",
      description: "Leituras de pressão, empregados com hipertensão, alertas",
      icon: "🩺",
      color: "#EF4444",
    },
    {
      id: "challenges",
      title: "Relatório de Desafios",
      description: "Desafios completados, participação, ranking de equipes",
      icon: "🎯",
      color: "#F59E0B",
    },
    {
      id: "complaints",
      title: "Relatório de Queixas",
      description: "Queixas de saúde, encaminhamentos, status de resolução",
      icon: "⚠️",
      color: "#EF4444",
    },
    {
      id: "gamification",
      title: "Relatório de Gamificação",
      description: "Pontos, medalhas, conquistas, ranking geral",
      icon: "🏆",
      color: "#9333EA",
    },
    {
      id: "ergonomics",
      title: "Relatório de Ergonomia",
      description: "Avaliações ergonômicas, riscos identificados, melhorias",
      icon: "🪑",
      color: "#0EA5E9",
    },
    {
      id: "absenteeism",
      title: "Relatório de Absenteísmo",
      description: "Taxa de absenteísmo, motivos, correlação com saúde",
      icon: "📊",
      color: "#64748B",
    },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            style={{ opacity: 0.8 }}
          >
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">
            📈 Relatórios e Gráficos
          </Text>
          <Text className="text-muted text-base">
            Gere relatórios detalhados com gráficos e comparações
          </Text>
        </View>

        {/* Seletor de Período */}
        <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Período do Relatório</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setSelectedPeriod("semanal")}
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor: selectedPeriod === "semanal" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedPeriod === "semanal" ? colors.primary : colors.border,
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: selectedPeriod === "semanal" ? "#FFFFFF" : colors.foreground,
                }}
              >
                Semanal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod("mensal")}
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor: selectedPeriod === "mensal" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedPeriod === "mensal" ? colors.primary : colors.border,
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: selectedPeriod === "mensal" ? "#FFFFFF" : colors.foreground,
                }}
              >
                Mensal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Relatórios */}
        <View className="gap-4 mb-6">
          <Text className="text-lg font-bold text-foreground">Relatórios Disponíveis</Text>
          {reports.map((report) => (
            <View
              key={report.id}
              className="bg-surface rounded-2xl p-5 border border-border"
            >
              <View className="flex-row items-start gap-4 mb-4">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: report.color + "20" }}
                >
                  <Text className="text-3xl">{report.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground mb-1">
                    {report.title}
                  </Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    {report.description}
                  </Text>
                </View>
              </View>

              {/* Botões de Ação */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleGenerateReport(report.title)}
                  className="flex-1 py-3 rounded-xl"
                  style={{
                    backgroundColor: report.color,
                    opacity: 0.95,
                  }}
                >
                  <Text className="text-center font-semibold text-white">
                    📥 Baixar PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSendEmail(report.title)}
                  className="flex-1 py-3 rounded-xl border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: report.color,
                  }}
                >
                  <Text
                    className="text-center font-semibold"
                    style={{ color: report.color }}
                  >
                    📧 Enviar Email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Informações Adicionais */}
        <View className="bg-primary/10 rounded-2xl p-5 border border-primary mb-6">
          <Text className="text-sm font-semibold text-primary mb-2">
            💡 Sobre os Relatórios
          </Text>
          <Text className="text-sm text-foreground leading-relaxed">
            • Todos os relatórios incluem gráficos visuais e comparações{"\n"}
            • Dados são atualizados automaticamente do banco de dados{"\n"}
            • Relatórios podem ser baixados em PDF ou enviados por e-mail{"\n"}
            • Período semanal: últimos 7 dias | Mensal: últimos 30 dias
          </Text>
        </View>

        {/* Botão de Relatório Consolidado */}
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            Alert.alert(
              "Relatório Consolidado",
              "Gerando relatório completo com todos os dados...",
              [{ text: "OK" }]
            );
          }}
          className="py-4 rounded-xl mb-8"
          style={{
            backgroundColor: colors.success,
            opacity: 0.95,
          }}
        >
          <Text className="text-center font-bold text-white text-lg">
            📊 Gerar Relatório Consolidado
          </Text>
          <Text className="text-center text-white text-xs mt-1">
            Todos os relatórios em um único documento
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
