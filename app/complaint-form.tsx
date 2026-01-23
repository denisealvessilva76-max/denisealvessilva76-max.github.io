import { View, Text, ScrollView, TextInput, TouchableOpacity, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthReferrals } from "@/hooks/use-health-referrals";
import { useHealthData } from "@/hooks/use-health-data";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const PAIN_LOCATIONS = [
  "Cabeça",
  "Pescoço",
  "Ombros",
  "Costas (superior)",
  "Costas (inferior)",
  "Braços",
  "Mãos/Punhos",
  "Pernas",
  "Joelhos",
  "Pés/Tornozelos",
  "Outro",
];

export default function ComplaintFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const { createReferral } = useHealthReferrals();
  const { addCheckIn } = useHealthData();
  const [painLocation, setPainLocation] = useState("");
  const [description, setDescription] = useState("");
  const [severity] = useState<"leve" | "moderada" | "grave">(
    params.severity === "leve" ? "leve" : "grave"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!painLocation) {
      Alert.alert("Erro", "Por favor, selecione a localização da dor");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Erro", "Por favor, descreva sua dor");
      return;
    }

    setIsSubmitting(true);
    try {
      // Salvar check-in com dor
      const checkInStatus = severity === "leve" ? "dor-leve" : "dor-forte";
      await addCheckIn(checkInStatus as any);

      // Criar encaminhamento
      const fullDescription = `Localização: ${painLocation}\n\nDescrição: ${description}`;
      const result = await createReferral(checkInStatus as any, fullDescription, severity);

      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "✅ Encaminhado ao SESMT",
          "Sua queixa foi registrada e encaminhada ao Serviço de Saúde Ocupacional. Você será contatado em breve.\n\n⚠️ Se a dor for muito forte, procure atendimento médico imediatamente.",
          [
            {
              text: "Entendi",
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
      } else {
        Alert.alert("Erro", "Não foi possível enviar sua queixa. Tente novamente.");
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao enviar sua queixa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-2">
              <Text className="text-primary text-base">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Relatar Dor</Text>
            <Text className="text-base text-muted">
              Preencha os campos abaixo para que o SESMT possa te ajudar
            </Text>
          </View>

          {/* Aviso de Urgência */}
          {severity === "grave" && (
            <Card className="bg-error/10 border border-error gap-2">
              <Text className="text-sm font-semibold text-error">⚠️ Dor Forte Detectada</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                Se você está sentindo uma dor muito intensa, procure atendimento médico
                imediatamente. Não espere!
              </Text>
              <TouchableOpacity
                className="bg-error rounded-lg py-2 mt-2 active:opacity-80"
                onPress={() => {
                  Alert.alert(
                    "Contato SESMT",
                    "Ligue para o SESMT: (21) 99822-5493",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Ligar Agora", onPress: () => {} },
                    ]
                  );
                }}
              >
                <Text className="text-center font-semibold text-white">
                  📞 Ligar para SESMT Agora
                </Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Severidade */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Intensidade da Dor</Text>
            <View
              className={`p-4 rounded-lg ${
                severity === "leve" ? "bg-warning/10 border border-warning" : "bg-error/10 border border-error"
              }`}
            >
              <Text
                className={`text-center font-bold text-lg ${
                  severity === "leve" ? "text-warning" : "text-error"
                }`}
              >
                {severity === "leve" ? "😐 Dor Leve" : "😞 Dor Forte"}
              </Text>
            </View>
          </Card>

          {/* Localização da Dor */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Onde está a dor? <Text className="text-error">*</Text>
            </Text>
            <View className="gap-2">
              {PAIN_LOCATIONS.map((location) => (
                <Pressable
                  key={location}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPainLocation(location);
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        painLocation === location ? colors.primary : colors.surface,
                      borderColor:
                        painLocation === location ? colors.primary : colors.border,
                      borderWidth: 2,
                      padding: 12,
                      borderRadius: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    className={
                      painLocation === location
                        ? "text-background font-semibold"
                        : "text-foreground"
                    }
                  >
                    {painLocation === location ? "✓ " : ""}
                    {location}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Descrição da Dor */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Descreva sua dor <Text className="text-error">*</Text>
            </Text>
            <Text className="text-sm text-muted">
              Conte mais detalhes: quando começou, o que você estava fazendo, como é a dor
              (latejante, aguda, contínua), etc.
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg p-4 text-foreground min-h-[120px]"
              placeholder="Ex: A dor começou hoje de manhã quando estava carregando sacos de cimento. É uma dor aguda nas costas que piora quando me abaixo..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
            <Text className="text-xs text-muted text-right">
              {description.length}/500 caracteres
            </Text>
          </Card>

          {/* Aviso de Sigilo */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">🔒 Sigilo Garantido</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Suas informações são confidenciais e protegidas por lei. Apenas profissionais de
              saúde autorizados terão acesso.
            </Text>
          </Card>

          {/* Botões */}
          <View className="gap-3">
            <TouchableOpacity
              className={`rounded-lg py-4 ${isSubmitting ? "bg-muted" : "bg-primary"} active:opacity-80`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text className="text-center font-bold text-white text-base">
                {isSubmitting ? "Enviando..." : "Enviar ao SESMT"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface border border-border rounded-lg py-4 active:opacity-80"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text className="text-center font-semibold text-foreground">Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Dica */}
          <Card className="bg-success/10 border border-success gap-2">
            <Text className="text-sm font-semibold text-success">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Enquanto aguarda o contato do SESMT, evite movimentos que causem dor e descanse
              sempre que possível.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
