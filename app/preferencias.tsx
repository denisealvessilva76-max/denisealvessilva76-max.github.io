import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const PREFERENCES_KEY = "user_preferences";

interface Preferences {
  notificationsEnabled: boolean;
  checkInReminder: boolean;
  checkInTime: string; // HH:MM
  pausaAtivaReminder: boolean;
  pausaAtivaTimes: string[]; // Array de horários
  hydrationReminder: boolean;
  hydrationInterval: number; // Minutos
  pressureAlerts: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  notificationsEnabled: true,
  checkInReminder: true,
  checkInTime: "08:00",
  pausaAtivaReminder: true,
  pausaAtivaTimes: ["10:00", "14:00", "16:00"],
  hydrationReminder: true,
  hydrationInterval: 60,
  pressureAlerts: true,
};

export default function PreferenciasScreen() {
  const colors = useColors();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Preferences) => {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      Alert.alert("Erro", "Não foi possível salvar as preferências");
    }
  };

  const togglePreference = (key: keyof Preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const handleChangeHydrationInterval = () => {
    Alert.alert(
      "Intervalo de Hidratação",
      "Escolha o intervalo entre lembretes de hidratação:",
      [
        { text: "30 minutos", onPress: () => savePreferences({ ...preferences, hydrationInterval: 30 }) },
        { text: "60 minutos", onPress: () => savePreferences({ ...preferences, hydrationInterval: 60 }) },
        { text: "90 minutos", onPress: () => savePreferences({ ...preferences, hydrationInterval: 90 }) },
        { text: "120 minutos", onPress: () => savePreferences({ ...preferences, hydrationInterval: 120 }) },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleResetPreferences = () => {
    Alert.alert(
      "Restaurar Padrões",
      "Deseja restaurar todas as configurações para os valores padrão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: () => savePreferences(DEFAULT_PREFERENCES),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-foreground text-lg">Carregando preferências...</Text>
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
            ⚙️ Preferências
          </Text>
          <Text className="text-muted text-base">
            Configure notificações e lembretes
          </Text>
        </View>

        {/* Notificações Gerais */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                🔔 Notificações Ativadas
              </Text>
              <Text className="text-sm text-muted mt-1">
                Ativar/desativar todas as notificações
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={() => togglePreference("notificationsEnabled")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.notificationsEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </Card>

        {/* Check-in Diário */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            📝 Check-in Diário
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-sm text-foreground">Lembrete de check-in</Text>
              <Text className="text-xs text-muted mt-1">
                Horário: {preferences.checkInTime}
              </Text>
            </View>
            <Switch
              value={preferences.checkInReminder && preferences.notificationsEnabled}
              onValueChange={() => togglePreference("checkInReminder")}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.checkInReminder ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            className="bg-surface rounded-lg p-3"
            onPress={() => {
              Alert.alert(
                "Horário do Check-in",
                "Em breve você poderá configurar o horário do lembrete de check-in diário.",
                [{ text: "Entendi" }]
              );
            }}
            disabled={!preferences.checkInReminder || !preferences.notificationsEnabled}
            style={{
              opacity: preferences.checkInReminder && preferences.notificationsEnabled ? 1 : 0.5,
            }}
          >
            <Text className="text-sm text-primary text-center">
              Alterar Horário
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Pausa Ativa */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            🧘 Pausa Ativa
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-sm text-foreground">Lembretes de pausa</Text>
              <Text className="text-xs text-muted mt-1">
                {preferences.pausaAtivaTimes.length} horários configurados
              </Text>
            </View>
            <Switch
              value={preferences.pausaAtivaReminder && preferences.notificationsEnabled}
              onValueChange={() => togglePreference("pausaAtivaReminder")}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.pausaAtivaReminder ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            className="bg-surface rounded-lg p-3"
            onPress={() => router.push("/configurar-pausas")}
            disabled={!preferences.pausaAtivaReminder || !preferences.notificationsEnabled}
            style={{
              opacity: preferences.pausaAtivaReminder && preferences.notificationsEnabled ? 1 : 0.5,
            }}
          >
            <Text className="text-sm text-primary text-center">
              Configurar Horários
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Hidratação */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            💧 Hidratação
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-sm text-foreground">Lembretes de hidratação</Text>
              <Text className="text-xs text-muted mt-1">
                A cada {preferences.hydrationInterval} minutos
              </Text>
            </View>
            <Switch
              value={preferences.hydrationReminder && preferences.notificationsEnabled}
              onValueChange={() => togglePreference("hydrationReminder")}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.hydrationReminder ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            className="bg-surface rounded-lg p-3"
            onPress={handleChangeHydrationInterval}
            disabled={!preferences.hydrationReminder || !preferences.notificationsEnabled}
            style={{
              opacity: preferences.hydrationReminder && preferences.notificationsEnabled ? 1 : 0.5,
            }}
          >
            <Text className="text-sm text-primary text-center">
              Alterar Intervalo
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Alertas de Pressão */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                🩺 Alertas de Pressão
              </Text>
              <Text className="text-sm text-muted mt-1">
                Notificar quando a pressão estiver elevada
              </Text>
            </View>
            <Switch
              value={preferences.pressureAlerts && preferences.notificationsEnabled}
              onValueChange={() => togglePreference("pressureAlerts")}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.pressureAlerts ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </Card>

        {/* Aviso */}
        {!preferences.notificationsEnabled && (
          <Card className="bg-warning/10 border border-warning mb-4">
            <Text className="text-sm text-foreground">
              ⚠️ <Text className="font-semibold">Notificações desativadas.</Text> Ative para receber lembretes e alertas.
            </Text>
          </Card>
        )}

        {/* Botão Restaurar Padrões */}
        <TouchableOpacity
          className="bg-surface rounded-lg p-4 mb-6"
          onPress={handleResetPreferences}
        >
          <Text className="text-center font-semibold text-error">
            🔄 Restaurar Configurações Padrão
          </Text>
        </TouchableOpacity>

        {/* Informação */}
        <Card className="bg-primary/10 border border-primary">
          <Text className="text-sm text-foreground">
            💡 <Text className="font-semibold">Dica:</Text> As notificações ajudam você a manter uma rotina saudável no trabalho. Configure os horários que melhor se adequam à sua jornada!
          </Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
