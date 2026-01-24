import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useBloodPressure } from "@/hooks/use-blood-pressure";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function BloodPressureHistoryScreen() {
  const colors = useColors();
  const {
    readings,
    isLoading,
    getStats,
    getReadingsLastDays,
    getClassificationLabel,
    getClassificationColor,
    deleteReading,
  } = useBloodPressure();

  const stats = getStats();
  const last30Days = getReadingsLastDays(30);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteReading = (id: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir esta leitura?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const success = await deleteReading(id);
            if (success) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert("Sucesso", "Leitura excluída com sucesso");
            } else {
              Alert.alert("Erro", "Não foi possível excluir a leitura");
            }
          },
        },
      ]
    );
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case "improving":
        return "📉";
      case "worsening":
        return "📈";
      case "stable":
        return "➡️";
      default:
        return "❓";
    }
  };

  const getTrendLabel = () => {
    switch (stats.trend) {
      case "improving":
        return "Melhorando";
      case "worsening":
        return "Piorando";
      case "stable":
        return "Estável";
      default:
        return "Dados Insuficientes";
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case "improving":
        return colors.success;
      case "worsening":
        return colors.error;
      case "stable":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-foreground text-lg">Carregando histórico...</Text>
      </ScreenContainer>
    );
  }

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
            📊 Histórico de Pressão
          </Text>
          <Text className="text-muted text-base">
            Acompanhe a evolução da sua pressão arterial
          </Text>
        </View>

        {/* Estatísticas Gerais */}
        {stats.totalReadings > 0 ? (
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Estatísticas</Text>

            {/* Cards de Estatísticas */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-background rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-primary">
                  {stats.averageSystolic}
                </Text>
                <Text className="text-xs text-muted mt-1">Sistólica Média</Text>
              </View>
              <View className="flex-1 bg-background rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-primary">
                  {stats.averageDiastolic}
                </Text>
                <Text className="text-xs text-muted mt-1">Diastólica Média</Text>
              </View>
              <View className="flex-1 bg-background rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-foreground">
                  {stats.totalReadings}
                </Text>
                <Text className="text-xs text-muted mt-1">Leituras</Text>
              </View>
            </View>

            {/* Tendência */}
            <View
              className="rounded-xl p-3 flex-row items-center justify-between"
              style={{ backgroundColor: getTrendColor() + "20" }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{getTrendIcon()}</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">Tendência</Text>
                  <Text className="text-xs text-muted">{getTrendLabel()}</Text>
                </View>
              </View>
              {stats.highReadingsCount > 0 && (
                <View className="bg-error rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-bold">
                    {stats.highReadingsCount} alta(s)
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-foreground font-semibold mb-2">Nenhuma Leitura Ainda</Text>
            <Text className="text-muted text-sm text-center">
              Registre sua primeira medição de pressão arterial
            </Text>
          </View>
        )}

        {/* Histórico (Últimos 30 dias) */}
        {last30Days.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">
              Últimos 30 Dias ({last30Days.length} leituras)
            </Text>

            {last30Days.map((reading) => (
              <View
                key={reading.id}
                className="bg-surface rounded-2xl p-4 mb-3 border border-border"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-2xl font-bold text-foreground">
                        {reading.systolic}/{reading.diastolic}
                      </Text>
                      <Text className="text-sm text-muted">mmHg</Text>
                    </View>
                    {reading.heartRate && (
                      <Text className="text-sm text-muted">
                        ❤️ {reading.heartRate} bpm
                      </Text>
                    )}
                  </View>

                  {/* Status */}
                  <View
                    className="rounded-lg px-3 py-1"
                    style={{ backgroundColor: getClassificationColor(reading.classification) }}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {getClassificationLabel(reading.classification)}
                    </Text>
                  </View>
                </View>

                {/* Data e Hora */}
                <View className="flex-row items-center gap-4 mb-2">
                  <Text className="text-xs text-muted">
                    📅 {formatDate(reading.timestamp)}
                  </Text>
                  <Text className="text-xs text-muted">
                    🕐 {formatTime(reading.timestamp)}
                  </Text>
                </View>

                {/* Notas */}
                {reading.notes && (
                  <View className="bg-background rounded-lg p-2 mb-2">
                    <Text className="text-xs text-muted">{reading.notes}</Text>
                  </View>
                )}

                {/* Botão Excluir */}
                <TouchableOpacity
                  onPress={() => handleDeleteReading(reading.id)}
                  className="mt-2"
                  style={{ opacity: 0.7 }}
                >
                  <Text className="text-error text-xs font-semibold text-center">
                    🗑️ Excluir Leitura
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Botão Adicionar Nova Leitura */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary py-4 rounded-xl mb-8"
          style={{ opacity: 0.95 }}
        >
          <Text className="text-white text-center text-lg font-bold">
            ➕ Adicionar Nova Leitura
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
