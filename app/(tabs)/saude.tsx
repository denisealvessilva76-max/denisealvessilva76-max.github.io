import { ScrollView, Text, View, TouchableOpacity, TextInput, Pressable, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { Badge, getPressureBadgeVariant, getPressureLabel } from "@/components/ui/badge";
import { useHealthData } from "@/hooks/use-health-data";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { SYMPTOMS } from "@/lib/types";
import * as Haptics from "expo-haptics";

export default function SaudeScreen() {
  const router = useRouter();
  const { addPressureReading, addSymptomReport, classifyPressure, getLatestPressure, pressureReadings } = useHealthData();
  const { sendPainNotification } = useAdminNotifications();
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showPressureForm, setShowPressureForm] = useState(false);
  const [latestPressure, setLatestPressure] = useState(getLatestPressure());
  const [latestClassification, setLatestClassification] = useState(
    latestPressure ? classifyPressure(latestPressure.systolic, latestPressure.diastolic) : null
  );

  useEffect(() => {
    const latest = getLatestPressure();
    setLatestPressure(latest);
    if (latest) {
      setLatestClassification(classifyPressure(latest.systolic, latest.diastolic));
    }
  }, [pressureReadings]);

  const handleAddPressure = async () => {
    if (!systolic || !diastolic) {
      Alert.alert("Erro", "Preencha os valores de pressão arterial");
      return;
    }

    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);

    if (sys <= 0 || dia <= 0) {
      Alert.alert("Erro", "Os valores devem ser maiores que zero");
      return;
    }

    await addPressureReading(sys, dia);
    setSystolic("");
    setDiastolic("");
    setShowPressureForm(false);
    
    const latest = getLatestPressure();
    setLatestPressure(latest);
    if (latest) {
      setLatestClassification(classifyPressure(latest.systolic, latest.diastolic));
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Sucesso", "Pressão arterial registrada com sucesso!");
  };

  const handleToggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((s) => s !== symptomId) : [...prev, symptomId]
    );
  };

  const handleReportSymptoms = async () => {
    if (selectedSymptoms.length > 0) {
      await addSymptomReport(selectedSymptoms);
      
      // Enviar notificação ao admin se houver dor
      const hasPain = selectedSymptoms.some(s => s.includes("dor"));
      if (hasPain) {
        const painLevel = selectedSymptoms.some(s => s.includes("Forte")) ? "dor-forte" : "dor-leve";
        await sendPainNotification("worker-" + Date.now(), painLevel, selectedSymptoms.join(", "));
      }
      
      setSelectedSymptoms([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Sintomas reportados com sucesso!");
    }
  };

  const handleRespiracaoGuiada = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/respiracao-guiada");
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Saúde</Text>
            <Text className="text-base text-muted">Monitore sua saúde ocupacional</Text>
          </View>

          {/* Seção de Pressão Arterial */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Pressão Arterial</Text>

            {latestPressure && (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-muted">Última leitura</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {latestPressure.systolic}/{latestPressure.diastolic} mmHg
                    </Text>
                  </View>
                  {latestClassification && (
                    <Badge
                      variant={getPressureBadgeVariant(latestClassification)}
                      label={getPressureLabel(latestClassification)}
                    />
                  )}
                </View>
                <Text className="text-xs text-muted">{latestPressure.date}</Text>
              </View>
            )}

            {!showPressureForm ? (
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 active:opacity-80"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPressureForm(true);
                }}
              >
                <Text className="text-center font-semibold text-white">
                  + Registrar Pressão
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3 p-3 bg-surface rounded-lg border border-border">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Sistólica</Text>
                    <TextInput
                      className="bg-background border border-border rounded-lg p-2 text-foreground"
                      placeholder="120"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={systolic}
                      onChangeText={setSystolic}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Diastólica</Text>
                    <TextInput
                      className="bg-background border border-border rounded-lg p-2 text-foreground"
                      placeholder="80"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={diastolic}
                      onChangeText={setDiastolic}
                    />
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-2 active:opacity-80"
                    onPress={handleAddPressure}
                  >
                    <Text className="text-center font-semibold text-white">Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-border rounded-lg py-2 active:opacity-80"
                    onPress={() => {
                      setShowPressureForm(false);
                      setSystolic("");
                      setDiastolic("");
                    }}
                  >
                    <Text className="text-center font-semibold text-foreground">Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Seção de Sintomas */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Sintomas</Text>
            <Text className="text-sm text-muted">Selecione os sintomas que está sentindo:</Text>

            <View className="gap-2">
              {SYMPTOMS.map((symptom) => (
                <Pressable
                  key={symptom.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleToggleSymptom(symptom.id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                      selectedSymptoms.includes(symptom.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 items-center justify-center ${
                        selectedSymptoms.includes(symptom.id)
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {selectedSymptoms.includes(symptom.id) && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                    <Text className="flex-1 text-foreground">{symptom.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {selectedSymptoms.length > 0 && (
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 active:opacity-80"
                onPress={handleReportSymptoms}
              >
                <Text className="text-center font-semibold text-white">
                  Relatar Sintomas
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Seção de Saúde Mental */}
          <Card className="bg-primary/10 border border-primary gap-3">
            <Text className="text-lg font-semibold text-primary">🧠 Saúde Mental</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Respire profundamente. Inspire por 4 segundos, segure por 4 segundos, e expire por 4 segundos. Repita 5 vezes.
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={handleRespiracaoGuiada}
            >
              <Text className="text-center font-semibold text-white">
                Iniciar Respiração Guiada
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Alerta de Pressão Crítica */}
          {latestClassification === "hipertensao" && (
            <Card className="bg-error/10 border border-error gap-2">
              <Text className="text-sm font-semibold text-error">🚨 Atenção</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                Sua pressão arterial está elevada. Procure o SESMT ou um médico para avaliação.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
