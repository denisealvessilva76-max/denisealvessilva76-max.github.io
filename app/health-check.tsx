import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthData } from "@/hooks/use-health-data";
import { CheckInStatus } from "@/lib/types";
import * as Haptics from "expo-haptics";

const CHECK_IN_OPTIONS: Array<{ status: CheckInStatus; emoji: string; label: string; description: string; color: string }> = [
  { 
    status: "bem", 
    emoji: "😊", 
    label: "Tudo bem", 
    description: "Me sinto bem e sem dores",
    color: "bg-success" 
  },
  { 
    status: "dor-leve", 
    emoji: "😐", 
    label: "Com dor leve", 
    description: "Sinto um desconforto leve",
    color: "bg-warning" 
  },
  { 
    status: "dor-forte", 
    emoji: "😞", 
    label: "Com dor forte", 
    description: "Sinto dor intensa que precisa atenção",
    color: "bg-error" 
  },
];

export default function HealthCheckScreen() {
  const router = useRouter();
  const { addCheckIn, getTodayCheckIn } = useHealthData();
  const todayCheckIn = getTodayCheckIn();

  const handleCheckIn = async (status: CheckInStatus) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Se reportar dor, abrir formulário detalhado
    if (status === "dor-leve" || status === "dor-forte") {
      router.push({
        pathname: "/complaint-form",
        params: { severity: status === "dor-leve" ? "leve" : "forte" }
      });
      return;
    }
    
    // Check-in normal (sem dor)
    const result = await addCheckIn(status);
    if (result) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Check-in Realizado!",
        "Seu check-in diário foi registrado com sucesso.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    }
  };

  if (todayCheckIn) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-32 h-32 rounded-full bg-success/20 items-center justify-center">
            <Text className="text-7xl">✅</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Check-in Já Realizado
          </Text>
          <Text className="text-base text-muted text-center px-6">
            Você já fez o check-in de hoje. Volte amanhã para registrar novamente!
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 px-8 active:opacity-80"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-center font-bold text-white text-lg">
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Cabeçalho */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Check-in Diário</Text>
          <Text className="text-base text-muted">
            Como você está se sentindo hoje? Seu bem-estar é importante para nós.
          </Text>
        </View>

        {/* Opções de Check-in */}
        <View className="gap-4 flex-1 justify-center">
          {CHECK_IN_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.status}
              onPress={() => handleCheckIn(option.status)}
              className="active:opacity-70"
            >
              <Card className="flex-row items-center gap-4 p-6">
                <View className={`w-16 h-16 rounded-full ${option.color}/20 items-center justify-center`}>
                  <Text className="text-4xl">{option.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">{option.label}</Text>
                  <Text className="text-sm text-muted mt-1">{option.description}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Informação */}
        <Card className="bg-primary/10 border border-primary gap-2">
          <Text className="text-sm font-semibold text-primary">💡 Importante</Text>
          <Text className="text-sm text-foreground leading-relaxed">
            Se você reportar dor, o SESMT será notificado automaticamente e você será direcionado para um formulário detalhado.
          </Text>
        </Card>

        {/* Botão Voltar */}
        <TouchableOpacity
          className="bg-surface border border-border rounded-lg py-4 active:opacity-80"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Text className="text-center font-semibold text-foreground">
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
