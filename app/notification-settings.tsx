import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import * as Haptics from "expo-haptics";
import { useState } from "react";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const {
    settings,
    toggleCheckInReminders,
    togglePauseActiveReminders,
    updateCheckInTimes,
    updatePauseActiveTimes,
    resetToDefaults,
  } = useNotifications();

  const [checkInTimes, setCheckInTimes] = useState(settings.checkInTimes);
  const [pauseActiveTimes, setPauseActiveTimes] = useState(settings.pauseActiveTimes);

  const handleSaveCheckInTimes = async () => {
    await updateCheckInTimes(checkInTimes);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Sucesso", "Horários de check-in atualizados!");
  };

  const handleSavePauseActiveTimes = async () => {
    await updatePauseActiveTimes(pauseActiveTimes);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Sucesso", "Horários de pausa ativa atualizados!");
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      "Restaurar Padrões",
      "Deseja restaurar os horários padrão de notificações?",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Restaurar",
          onPress: async () => {
            await resetToDefaults();
            setCheckInTimes(["08:00", "12:00", "16:00"]);
            setPauseActiveTimes(["10:00", "14:00", "17:00"]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Sucesso", "Configurações restauradas!");
          },
        },
      ]
    );
  };

  const TimeInput = ({
    value,
    onChangeText,
    placeholder,
  }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
  }) => (
    <View className="flex-1 bg-background border border-border rounded-lg px-3 py-2">
      <Text className="text-xs text-muted mb-1">Horário</Text>
      <Text className="text-lg font-semibold text-foreground">{value}</Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary font-semibold">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Notificações</Text>
            <Text className="text-base text-muted">Configure lembretes e horários</Text>
          </View>

          {/* Lembretes de Check-in */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">✅ Check-in Diário</Text>
                <Text className="text-sm text-muted">Lembretes para fazer check-in</Text>
              </View>
              <Switch
                value={settings.checkInReminders}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleCheckInReminders(value);
                }}
              />
            </View>

            {settings.checkInReminders && (
              <View className="gap-3 pt-3 border-t border-border">
                <Text className="text-sm font-semibold text-foreground">Horários de Lembretes:</Text>
                <View className="gap-2">
                  {checkInTimes.map((time, index) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                        <Text className="text-lg font-semibold text-foreground">{time}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const newTimes = checkInTimes.filter((_, i) => i !== index);
                          setCheckInTimes(newTimes);
                        }}
                        className="bg-error/10 rounded-lg p-2"
                      >
                        <Text className="text-error font-bold">−</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (checkInTimes.length < 5) {
                      setCheckInTimes([...checkInTimes, "09:00"]);
                    } else {
                      Alert.alert("Limite", "Máximo de 5 horários atingido");
                    }
                  }}
                  className="bg-primary/10 border border-primary rounded-lg p-3"
                >
                  <Text className="text-center text-primary font-semibold">+ Adicionar Horário</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveCheckInTimes}
                  className="bg-primary rounded-lg py-3"
                >
                  <Text className="text-center text-white font-semibold">Salvar Horários</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Lembretes de Pausa Ativa */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">💪 Pausa Ativa</Text>
                <Text className="text-sm text-muted">Lembretes para fazer alongamentos</Text>
              </View>
              <Switch
                value={settings.pauseActiveReminders}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  togglePauseActiveReminders(value);
                }}
              />
            </View>

            {settings.pauseActiveReminders && (
              <View className="gap-3 pt-3 border-t border-border">
                <Text className="text-sm font-semibold text-foreground">Horários de Lembretes:</Text>
                <View className="gap-2">
                  {pauseActiveTimes.map((time, index) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                        <Text className="text-lg font-semibold text-foreground">{time}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const newTimes = pauseActiveTimes.filter((_, i) => i !== index);
                          setPauseActiveTimes(newTimes);
                        }}
                        className="bg-error/10 rounded-lg p-2"
                      >
                        <Text className="text-error font-bold">−</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (pauseActiveTimes.length < 5) {
                      setPauseActiveTimes([...pauseActiveTimes, "11:00"]);
                    } else {
                      Alert.alert("Limite", "Máximo de 5 horários atingido");
                    }
                  }}
                  className="bg-primary/10 border border-primary rounded-lg p-3"
                >
                  <Text className="text-center text-primary font-semibold">+ Adicionar Horário</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSavePauseActiveTimes}
                  className="bg-primary rounded-lg py-3"
                >
                  <Text className="text-center text-white font-semibold">Salvar Horários</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Informações */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">ℹ️ Informações</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              As notificações serão enviadas nos horários configurados. Certifique-se de que as notificações estão habilitadas nas configurações do seu dispositivo.
            </Text>
          </Card>

          {/* Restaurar Padrões */}
          <TouchableOpacity
            onPress={handleResetToDefaults}
            className="bg-warning/10 border border-warning rounded-lg p-3"
          >
            <Text className="text-center text-warning font-semibold">Restaurar Configurações Padrão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
