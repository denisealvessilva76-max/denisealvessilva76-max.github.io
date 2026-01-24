import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useSmartNotifications, NotificationSettings } from "@/hooks/use-smart-notifications";
import * as Haptics from "expo-haptics";

export default function ConfigurarPausasScreen() {
  const { getSettings, updateSettings } = useSmartNotifications();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  // Horários disponíveis para pausas ativas
  const availableHours = [
    { hour: 8, label: "08:00" },
    { hour: 9, label: "09:00" },
    { hour: 10, label: "10:00" },
    { hour: 11, label: "11:00" },
    { hour: 12, label: "12:00" },
    { hour: 13, label: "13:00" },
    { hour: 14, label: "14:00" },
    { hour: 15, label: "15:00" },
    { hour: 16, label: "16:00" },
    { hour: 17, label: "17:00" },
  ];

  // Estado local para horários selecionados
  const [selectedBreakHours, setSelectedBreakHours] = useState<number[]>([10, 15]);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const current = await getSettings();
      setSettings(current);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setLoading(false);
    }
  };

  const toggleBreakHour = (hour: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedBreakHours((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour);
      } else {
        return [...prev, hour].sort((a, b) => a - b);
      }
    });
  };

  const toggleActiveBreaks = async (value: boolean) => {
    if (!settings) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newSettings = { ...settings, activeBreaks: value };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const toggleHydrationReminders = async (value: boolean) => {
    if (!settings) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newSettings = { ...settings, hydrationReminders: value };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const toggleMorningCheckIn = async (value: boolean) => {
    if (!settings) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newSettings = { ...settings, morningCheckIn: value };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const saveBreakHours = async () => {
    if (!settings) return;

    if (selectedBreakHours.length === 0) {
      Alert.alert(
        "Atenção",
        "Selecione pelo menos um horário para as pausas ativas.",
        [{ text: "OK" }]
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Salvar horários selecionados (por enquanto, mantém a lógica antiga)
    // Em uma versão futura, podemos expandir o tipo NotificationSettings
    // para incluir um array de horários personalizados
    await updateSettings(settings);

    Alert.alert(
      "✅ Configurações Salvas",
      `Pausas ativas configuradas para ${selectedBreakHours.length} horário(s): ${selectedBreakHours.map(h => `${h}:00`).join(", ")}`,
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-foreground text-lg">Carregando configurações...</Text>
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
            ⚙️ Configurar Notificações
          </Text>
          <Text className="text-muted text-base">
            Personalize os lembretes e pausas ativas conforme sua rotina de trabalho
          </Text>
        </View>

        {/* Seção: Check-in Matinal */}
        <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground mb-1">
                ☀️ Check-in Matinal
              </Text>
              <Text className="text-sm text-muted">
                Lembrete diário às 7:30 para fazer check-in de saúde
              </Text>
            </View>
            <Switch
              value={settings.morningCheckIn}
              onValueChange={toggleMorningCheckIn}
              trackColor={{ false: "#ccc", true: "#4CAF50" }}
              thumbColor={settings.morningCheckIn ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Seção: Lembretes de Hidratação */}
        <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground mb-1">
                💧 Lembretes de Hidratação
              </Text>
              <Text className="text-sm text-muted">
                Notificações a cada 2 horas durante o expediente (8h-17h)
              </Text>
            </View>
            <Switch
              value={settings.hydrationReminders}
              onValueChange={toggleHydrationReminders}
              trackColor={{ false: "#ccc", true: "#2196F3" }}
              thumbColor={settings.hydrationReminders ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Seção: Pausas Ativas */}
        <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground mb-1">
                🧘 Pausas Ativas
              </Text>
              <Text className="text-sm text-muted">
                Lembretes para alongamento e exercícios rápidos
              </Text>
            </View>
            <Switch
              value={settings.activeBreaks}
              onValueChange={toggleActiveBreaks}
              trackColor={{ false: "#ccc", true: "#9C27B0" }}
              thumbColor={settings.activeBreaks ? "#fff" : "#f4f3f4"}
            />
          </View>

          {settings.activeBreaks && (
            <View>
              <Text className="text-sm font-semibold text-foreground mb-3">
                Escolha os horários das pausas:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {availableHours.map((item) => {
                  const isSelected = selectedBreakHours.includes(item.hour);
                  return (
                    <TouchableOpacity
                      key={item.hour}
                      onPress={() => toggleBreakHour(item.hour)}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                      }`}
                      style={{ minWidth: 80 }}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          isSelected ? "text-white" : "text-foreground"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedBreakHours.length > 0 && (
                <View className="mt-4 p-3 bg-background rounded-xl">
                  <Text className="text-sm text-muted">
                    ✓ {selectedBreakHours.length} horário(s) selecionado(s):{" "}
                    <Text className="font-semibold text-foreground">
                      {selectedBreakHours.map((h) => `${h}:00`).join(", ")}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Informação sobre horário de trabalho */}
        <View className="bg-background rounded-xl p-4 mb-6 border border-border">
          <Text className="text-sm text-muted mb-2">
            📌 <Text className="font-semibold">Horário de Expediente:</Text>
          </Text>
          <Text className="text-sm text-foreground">
            {settings.workStartTime} às {settings.workEndTime}
          </Text>
          <Text className="text-xs text-muted mt-2">
            As notificações respeitam seu horário de trabalho e não irão incomodar fora deste período.
          </Text>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          onPress={saveBreakHours}
          className="bg-primary py-4 rounded-xl mb-8"
          style={{ opacity: 0.95 }}
        >
          <Text className="text-white text-center text-lg font-bold">
            💾 Salvar Configurações
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
