import { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import {
  requestNotificationPermissions,
  getNotificationConfig,
  saveNotificationConfig,
  scheduleAllNotifications,
  cancelAllNotifications,
  sendTestNotification,
  listScheduledNotifications,
  type NotificationConfig,
} from "@/lib/notification-service";
import * as Haptics from "expo-haptics";

export default function ConfiguracoesScreen() {
  const [config, setConfig] = useState<NotificationConfig>({
    checkInEnabled: true,
    checkInTime: "08:00",
    hydrationEnabled: true,
    hydrationTimes: ["10:00", "14:00", "16:00"],
  });
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await getNotificationConfig();
      setConfig(savedConfig);
      
      // Verificar permissão
      const permission = await requestNotificationPermissions();
      setHasPermission(permission);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      Alert.alert("Erro", "Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: NotificationConfig) => {
    try {
      await saveNotificationConfig(newConfig);
      setConfig(newConfig);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert("Sucesso", "Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    }
  };

  const handleToggleCheckIn = async (enabled: boolean) => {
    const newConfig = { ...config, checkInEnabled: enabled };
    await handleSaveConfig(newConfig);
  };

  const handleToggleHydration = async (enabled: boolean) => {
    const newConfig = { ...config, hydrationEnabled: enabled };
    await handleSaveConfig(newConfig);
  };

  const handleTestNotification = async () => {
    try {
      if (!hasPermission) {
        Alert.alert(
          "Permissão Necessária",
          "Você precisa permitir notificações para testar."
        );
        return;
      }

      await sendTestNotification();
      Alert.alert("Teste Enviado", "Você deve receber uma notificação em breve.");
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      Alert.alert("Erro", "Não foi possível enviar a notificação de teste.");
    }
  };

  const handleListScheduled = async () => {
    try {
      await listScheduledNotifications();
      Alert.alert("Debug", "Verifique o console para ver as notificações agendadas.");
    } catch (error) {
      console.error("Erro ao listar notificações:", error);
    }
  };

  const handleCancelAll = async () => {
    Alert.alert(
      "Cancelar Todas as Notificações",
      "Tem certeza que deseja cancelar todas as notificações agendadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert("Sucesso", "Todas as notificações foram canceladas.");
            } catch (error) {
              console.error("Erro ao cancelar notificações:", error);
              Alert.alert("Erro", "Não foi possível cancelar as notificações.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-foreground text-lg">Carregando...</Text>
      </ScreenContainer>
    );
  }

  if (!hasPermission) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <Text className="text-2xl font-bold text-foreground">
              ⚙️ Configurações
            </Text>

            <View className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
              <Text className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                ⚠️ Permissão Necessária
              </Text>
              <Text className="text-yellow-700 dark:text-yellow-300">
                Você precisa permitir notificações para usar este recurso.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary py-3 rounded-lg items-center active:opacity-80"
              onPress={async () => {
                const permission = await requestNotificationPermissions();
                setHasPermission(permission);
                if (permission) {
                  await scheduleAllNotifications();
                  Alert.alert("Sucesso", "Notificações ativadas com sucesso!");
                } else {
                  Alert.alert(
                    "Permissão Negada",
                    "Você precisa permitir notificações nas configurações do dispositivo."
                  );
                }
              }}
            >
              <Text className="text-white font-semibold">
                Permitir Notificações
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          <Text className="text-2xl font-bold text-foreground">
            ⚙️ Configurações
          </Text>

          {/* Seção: Lembretes de Check-in */}
          <View className="bg-surface p-4 rounded-lg gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  🏗️ Lembrete de Check-in
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Receba um lembrete diário para fazer seu check-in
                </Text>
              </View>
              <Switch
                value={config.checkInEnabled}
                onValueChange={handleToggleCheckIn}
                trackColor={{ false: "#767577", true: "#0a7ea4" }}
                thumbColor={config.checkInEnabled ? "#ffffff" : "#f4f3f4"}
              />
            </View>

            {config.checkInEnabled && (
              <View className="bg-background p-3 rounded-lg">
                <Text className="text-sm text-muted mb-2">Horário:</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {config.checkInTime}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  (Configuração de horário personalizado em breve)
                </Text>
              </View>
            )}
          </View>

          {/* Seção: Lembretes de Hidratação */}
          <View className="bg-surface p-4 rounded-lg gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  💧 Lembretes de Hidratação
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Receba lembretes para beber água durante o dia
                </Text>
              </View>
              <Switch
                value={config.hydrationEnabled}
                onValueChange={handleToggleHydration}
                trackColor={{ false: "#767577", true: "#0a7ea4" }}
                thumbColor={config.hydrationEnabled ? "#ffffff" : "#f4f3f4"}
              />
            </View>

            {config.hydrationEnabled && (
              <View className="bg-background p-3 rounded-lg gap-2">
                <Text className="text-sm text-muted mb-2">Horários:</Text>
                {config.hydrationTimes.map((time, index) => (
                  <View key={index} className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">
                      • {time}
                    </Text>
                  </View>
                ))}
                <Text className="text-xs text-muted mt-1">
                  (Configuração de horários personalizados em breve)
                </Text>
              </View>
            )}
          </View>

          {/* Seção: Testes e Debug */}
          <View className="bg-surface p-4 rounded-lg gap-3">
            <Text className="text-lg font-semibold text-foreground">
              🧪 Testes
            </Text>

            <TouchableOpacity
              className="bg-blue-500 py-3 rounded-lg items-center active:opacity-80"
              onPress={handleTestNotification}
            >
              <Text className="text-white font-semibold">
                Enviar Notificação de Teste
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-500 py-3 rounded-lg items-center active:opacity-80"
              onPress={handleListScheduled}
            >
              <Text className="text-white font-semibold">
                Listar Notificações Agendadas (Console)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 py-3 rounded-lg items-center active:opacity-80"
              onPress={handleCancelAll}
            >
              <Text className="text-white font-semibold">
                Cancelar Todas as Notificações
              </Text>
            </TouchableOpacity>
          </View>

          {/* Informações */}
          <View className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <Text className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
              ℹ️ Sobre as Notificações
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-sm">
              • As notificações são canceladas automaticamente quando você completa a ação (check-in ou meta de hidratação){"\n"}
              • Você pode desativar as notificações a qualquer momento{"\n"}
              • As notificações funcionam mesmo com o app fechado
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
