import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHealthReferrals } from "@/hooks/use-health-referrals";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";

export default function ComplaintFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const { createReferral } = useHealthReferrals();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"leve" | "moderada" | "grave">("leve");
  const [complaintType, setComplaintType] = useState<"dor-leve" | "dor-forte" | "outro">(
    "dor-leve"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Erro", "Por favor, descreva sua queixa");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReferral(complaintType, description, severity);

      if (result) {
        Alert.alert(
          "Sucesso",
          "Sua queixa foi encaminhada ao setor de saúde. Você será contatado em breve.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Relatar Queixa</Text>
            <Text className="text-base text-muted">
              Descreva sua queixa para que o setor de saúde possa ajudá-lo
            </Text>
          </View>

          {/* Tipo de Queixa */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Tipo de Queixa</Text>
            <View className="gap-2">
              {[
                { value: "dor-leve", label: "🤕 Dor Leve" },
                { value: "dor-forte", label: "😣 Dor Forte" },
                { value: "outro", label: "❓ Outro" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setComplaintType(option.value as any)}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        complaintType === option.value ? colors.primary : colors.surface,
                      borderColor:
                        complaintType === option.value ? colors.primary : colors.border,
                      borderWidth: 2,
                      padding: 12,
                      borderRadius: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    className={
                      complaintType === option.value ? "text-background font-semibold" : "text-foreground"
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Severidade */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Severidade</Text>
            <View className="gap-2">
              {[
                { value: "leve", label: "🟢 Leve" },
                { value: "moderada", label: "🟡 Moderada" },
                { value: "grave", label: "🔴 Grave" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSeverity(option.value as any)}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        severity === option.value ? colors.primary : colors.surface,
                      borderColor:
                        severity === option.value ? colors.primary : colors.border,
                      borderWidth: 2,
                      padding: 12,
                      borderRadius: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    className={
                      severity === option.value ? "text-background font-semibold" : "text-foreground"
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Descrição */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Descrição Detalhada</Text>
            <TextInput
              placeholder="Descreva sua queixa em detalhes..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                minHeight: 120,
                textAlignVertical: "top",
              }}
            />
            <Text className="text-sm text-muted">
              {description.length}/500 caracteres
            </Text>
          </View>

          {/* Informações */}
          <View
            style={{ backgroundColor: colors.surface, borderLeftColor: colors.warning, borderLeftWidth: 4 }}
            className="p-3 rounded-lg gap-2"
          >
            <Text className="text-sm font-semibold text-foreground">ℹ️ Informações Importantes</Text>
            <Text className="text-xs text-muted leading-relaxed">
              Sua queixa será encaminhada ao setor de saúde ocupacional (SESMT) para análise. Você será
              contatado em breve com orientações e, se necessário, será agendado um atendimento.
            </Text>
          </View>

          {/* Botões */}
          <View className="gap-3 mt-4">
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isSubmitting ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-background font-semibold text-base">
                {isSubmitting ? "Enviando..." : "Enviar Queixa"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={isSubmitting}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-foreground font-semibold text-base">
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
