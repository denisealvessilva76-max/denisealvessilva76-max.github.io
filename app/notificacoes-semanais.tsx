import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useWeeklyNotifications } from "@/hooks/use-weekly-notifications";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useState } from "react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function NotificacoesSemanaisScreen() {
  const colors = useColors();
  const {
    config,
    isLoading,
    hasPermission,
    toggleEnabled,
    setDayOfWeek,
    setTime,
    testNotification,
    getDayName,
    getNextNotificationDate,
    requestPermissions,
  } = useWeeklyNotifications();

  const [selectedHour, setSelectedHour] = useState(config.hour);
  const [selectedMinute, setSelectedMinute] = useState(config.minute);

  const handleToggle = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (!hasPermission && !config.enabled) {
      Alert.alert(
        "Permissão Necessária",
        "Para receber notificações, precisamos da sua permissão. Deseja conceder agora?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Permitir",
            onPress: async () => {
              await requestPermissions();
              await toggleEnabled();
            },
          },
        ]
      );
    } else {
      await toggleEnabled();
    }
  };

  const handleDayChange = async (day: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setDayOfWeek(day);
  };

  const handleTimeChange = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setTime(selectedHour, selectedMinute);
    Alert.alert("Horário Atualizado", `Notificações serão enviadas às ${formatTime(selectedHour, selectedMinute)}`);
  };

  const handleTest = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    await testNotification();
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const formatNextNotification = (): string => {
    const next = getNextNotificationDate();
    if (!next) return "Desativado";

    const now = new Date();
    const diffMs = next.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays === 0) {
      return `Hoje às ${formatTime(next.getHours(), next.getMinutes())}`;
    } else if (diffDays === 1) {
      return `Amanhã às ${formatTime(next.getHours(), next.getMinutes())}`;
    } else {
      return `Em ${diffDays} dias (${getDayName(next.getDay())})`;
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando configurações...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
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
            📬 Notificações Semanais
          </Text>
          <Text className="text-muted text-base">
            Receba resumos do seu progresso de saúde toda semana
          </Text>
        </View>

        {/* Status de Permissão */}
        {!hasPermission && (
          <Card className="mb-6 bg-warning/10 border border-warning">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">⚠️</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-warning mb-1">
                  Permissão Necessária
                </Text>
                <Text className="text-xs text-muted">
                  Ative as notificações para receber resumos semanais
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-warning rounded-lg py-2 mt-3"
              onPress={requestPermissions}
            >
              <Text className="text-center font-semibold text-white">
                Solicitar Permissão
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Ativar/Desativar */}
        <Card className="mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold text-foreground mb-1">
                Resumos Semanais
              </Text>
              <Text className="text-sm text-muted">
                Receba notificações com seu progresso de saúde
              </Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={config.enabled ? "#fff" : "#f4f3f4"}
              disabled={!hasPermission}
            />
          </View>
        </Card>

        {/* Próxima Notificação */}
        {config.enabled && (
          <Card className="mb-6 bg-primary/10 border border-primary">
            <View className="items-center">
              <Text className="text-sm text-muted mb-2">Próxima Notificação</Text>
              <Text className="text-2xl font-bold text-primary">
                {formatNextNotification()}
              </Text>
            </View>
          </Card>
        )}

        {/* Dia da Semana */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            📅 Dia da Semana
          </Text>
          <Text className="text-sm text-muted mb-4">
            Escolha o dia em que deseja receber o resumo
          </Text>
          <View className="gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                className={`py-3 px-4 rounded-lg ${
                  config.dayOfWeek === day.value
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
                onPress={() => handleDayChange(day.value)}
                disabled={!config.enabled}
                style={{ opacity: config.enabled ? 1 : 0.5 }}
              >
                <Text
                  className={`text-center font-semibold ${
                    config.dayOfWeek === day.value
                      ? "text-white"
                      : "text-foreground"
                  }`}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Horário */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            🕐 Horário
          </Text>
          <Text className="text-sm text-muted mb-4">
            Escolha o horário preferido para receber a notificação
          </Text>

          {/* Seletor de Hora */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Hora</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {HOURS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  className={`py-2 px-4 rounded-lg ${
                    selectedHour === hour
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedHour(hour);
                  }}
                  disabled={!config.enabled}
                  style={{ opacity: config.enabled ? 1 : 0.5 }}
                >
                  <Text
                    className={`font-semibold ${
                      selectedHour === hour ? "text-white" : "text-foreground"
                    }`}
                  >
                    {hour.toString().padStart(2, "0")}h
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Seletor de Minuto */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Minuto</Text>
            <View className="flex-row gap-2">
              {[0, 15, 30, 45].map((minute) => (
                <TouchableOpacity
                  key={minute}
                  className={`flex-1 py-2 rounded-lg ${
                    selectedMinute === minute
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedMinute(minute);
                  }}
                  disabled={!config.enabled}
                  style={{ opacity: config.enabled ? 1 : 0.5 }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedMinute === minute ? "text-white" : "text-foreground"
                    }`}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Horário Atual Configurado */}
          <View className="bg-surface rounded-lg p-3 mb-4">
            <Text className="text-sm text-muted text-center">
              Horário configurado: {formatTime(config.hour, config.minute)}
            </Text>
          </View>

          {/* Botão de Salvar Horário */}
          {(selectedHour !== config.hour || selectedMinute !== config.minute) && (
            <TouchableOpacity
              className="bg-primary rounded-lg py-3"
              onPress={handleTimeChange}
              disabled={!config.enabled}
              style={{ opacity: config.enabled ? 1 : 0.5 }}
            >
              <Text className="text-center font-semibold text-white">
                Salvar Horário
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Exemplo de Notificação */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            📝 Exemplo de Notificação
          </Text>
          <View className="bg-surface rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              📊 Resumo Semanal - 85 pontos
            </Text>
            <Text className="text-xs text-muted">
              Excelente trabalho! 🌟{"\n"}
              🔥 7 dias consecutivos de check-in!{"\n\n"}
              Toque para ver detalhes.
            </Text>
          </View>
        </Card>

        {/* Botão de Teste */}
        <TouchableOpacity
          className="bg-teal-600 rounded-lg py-3 mb-6"
          onPress={handleTest}
          disabled={!hasPermission || !config.enabled}
          style={{ opacity: hasPermission && config.enabled ? 1 : 0.5 }}
        >
          <Text className="text-center font-semibold text-white">
            🧪 Enviar Notificação de Teste
          </Text>
        </TouchableOpacity>

        {/* Informações */}
        <Card className="mb-6 bg-blue-500/10 border border-blue-500">
          <View className="flex-row gap-3">
            <Text className="text-2xl">ℹ️</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-500 mb-2">
                Como Funciona
              </Text>
              <Text className="text-xs text-muted leading-relaxed">
                • O resumo é gerado automaticamente com base nas suas atividades da semana{"\n"}
                • Inclui pontuação de saúde, conquistas e mensagens motivacionais{"\n"}
                • Você pode testar a notificação a qualquer momento{"\n"}
                • As notificações respeitam o modo "Não Perturbe" do seu dispositivo
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
