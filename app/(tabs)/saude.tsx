import { ScrollView, Text, View, TouchableOpacity, TextInput, Pressable, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
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
  const [matricula, setMatricula] = useState<string>("");
  const { syncBloodPressure, syncSymptoms } = useFirebaseSync({ matricula, enabled: !!matricula });

  // Carregar matrícula do AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("employee:matricula").then((mat) => {
      if (mat) setMatricula(mat);
    });
  }, []);
  // Triagem de Comorbidades
  const [showTriagem, setShowTriagem] = useState(false);
  const [triagemGlicemia, setTriagemGlicemia] = useState("");
  const [triagemPeso, setTriagemPeso] = useState("");
  const [triagemAltura, setTriagemAltura] = useState("");
  const [triagemResultado, setTriagemResultado] = useState<null | { imc: number; imcClass: string; imcColor: string; riscos: string[] }>(null);

  const calcularTriagem = () => {
    const peso = parseFloat(triagemPeso);
    const altura = parseFloat(triagemAltura) / 100;
    const glicemia = parseFloat(triagemGlicemia);
    const riscos: string[] = [];
    let imc = 0;
    let imcClass = "";
    let imcColor = "#22C55E";

    if (peso > 0 && altura > 0) {
      imc = peso / (altura * altura);
      if (imc < 18.5) { imcClass = "Abaixo do peso"; imcColor = "#F59E0B"; riscos.push("IMC abaixo do ideal — risco de desnutrição e fadiga"); }
      else if (imc < 25) { imcClass = "Peso normal"; imcColor = "#22C55E"; }
      else if (imc < 30) { imcClass = "Sobrepeso"; imcColor = "#F59E0B"; riscos.push("Sobrepeso — risco aumentado para doenças cardiovasculares"); }
      else if (imc < 35) { imcClass = "Obesidade grau I"; imcColor = "#EF4444"; riscos.push("Obesidade grau I — risco elevado para diabetes e hipertensão"); }
      else { imcClass = "Obesidade grau II+"; imcColor = "#991B1B"; riscos.push("Obesidade severa — risco muito elevado, recomenda-se avaliação médica urgente"); }
    }

    if (glicemia > 0) {
      if (glicemia >= 100 && glicemia < 126) riscos.push("Glicemia de jejum alterada (pré-diabetes) — monitore a alimentação");
      else if (glicemia >= 126) riscos.push("Glicemia elevada — possível diabetes, procure avaliação médica");
    }

    if (latestPressure) {
      const cls = classifyPressure(latestPressure.systolic, latestPressure.diastolic);
      if (cls === "hipertensao") riscos.push("Pressão arterial elevada — risco cardiovascular aumentado");
      else if (cls === "pre-hipertensao") riscos.push("Pressão arterial limítrofe — atenção à alimentação e estresse");
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTriagemResultado({ imc: Math.round(imc * 10) / 10, imcClass, imcColor, riscos });
  };

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showPressureForm, setShowPressureForm] = useState(false);
  const [showSymptomDetails, setShowSymptomDetails] = useState(false);
  const [symptomDetails, setSymptomDetails] = useState("");
  const [symptomIntensity, setSymptomIntensity] = useState<"leve" | "moderada" | "forte">("leve");
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
    
    // Sincronizar com Firebase
    await syncBloodPressure(sys, dia);
    
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

  const handleContinueToDetails = () => {
    if (selectedSymptoms.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowSymptomDetails(true);
    }
  };

  const handleReportSymptoms = async () => {
    if (selectedSymptoms.length > 0) {
      await addSymptomReport(selectedSymptoms);
      
      // Sincronizar com Firebase
      await syncSymptoms(selectedSymptoms, symptomDetails);
      
      // Enviar notificação ao admin com detalhes
      const hasPain = selectedSymptoms.some(s => s.includes("pain"));
      if (hasPain) {
        const painLevel = symptomIntensity === "forte" ? "dor-forte" : "dor-leve";
        const fullDescription = `${selectedSymptoms.map(s => SYMPTOMS.find(sym => sym.id === s)?.label).join(", ")}. Intensidade: ${symptomIntensity}. Detalhes: ${symptomDetails}`;
        await sendPainNotification("worker-" + Date.now(), painLevel, fullDescription);
      }
      
      setSelectedSymptoms([]);
      setSymptomDetails("");
      setSymptomIntensity("leve");
      setShowSymptomDetails(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Sintomas reportados com sucesso! O SESMT foi notificado.");
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

            <View className="gap-2">
              {!showPressureForm ? (
                <>
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
                  {pressureReadings.length > 0 && (
                    <TouchableOpacity
                      className="bg-surface border border-primary rounded-lg py-2 active:opacity-80"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push("/blood-pressure-history");
                      }}
                    >
                      <Text className="text-center font-semibold text-primary">
                        📊 Ver Histórico Completo
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
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
            </View>
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

            {selectedSymptoms.length > 0 && !showSymptomDetails && (
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 active:opacity-80"
                onPress={handleContinueToDetails}
              >
                <Text className="text-center font-semibold text-white">
                  Continuar
                </Text>
              </TouchableOpacity>
            )}

            {showSymptomDetails && (
              <View className="gap-4 mt-4 p-4 bg-surface rounded-lg border border-border">
                <Text className="text-base font-semibold text-foreground">Detalhes do Sintoma</Text>
                
                <View className="gap-2">
                  <Text className="text-sm text-muted">Intensidade:</Text>
                  <View className="flex-row gap-2">
                    {["leve", "moderada", "forte"].map((intensity) => (
                      <Pressable
                        key={intensity}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSymptomIntensity(intensity as any);
                        }}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View
                          className={`px-4 py-2 rounded-lg border ${
                            symptomIntensity === intensity
                              ? "bg-primary border-primary"
                              : "bg-background border-border"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              symptomIntensity === intensity ? "text-white" : "text-foreground"
                            }`}
                          >
                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-sm text-muted">Descreva o que está sentindo:</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg p-3 text-foreground min-h-[100px]"
                    placeholder="Ex: Dor nas costas ao carregar peso, começou hoje de manhã..."
                    placeholderTextColor="#687076"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={symptomDetails}
                    onChangeText={setSymptomDetails}
                  />
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-3 active:opacity-80"
                    onPress={handleReportSymptoms}
                  >
                    <Text className="text-center font-semibold text-white">
                      Enviar Relato
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-border rounded-lg py-3 active:opacity-80"
                    onPress={() => {
                      setShowSymptomDetails(false);
                      setSymptomDetails("");
                      setSymptomIntensity("leve");
                    }}
                  >
                    <Text className="text-center font-semibold text-foreground">
                      Voltar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Seção de Triagem de Saúde */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold text-foreground">🧑‍⚕️ Triagem de Saúde</Text>
                <Text className="text-xs text-muted">IMC, glicemia e riscos de comorbidades</Text>
              </View>
              <TouchableOpacity
                className="bg-primary/10 px-3 py-1 rounded-lg active:opacity-80"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTriagem(!showTriagem);
                  setTriagemResultado(null);
                }}
              >
                <Text className="text-primary text-sm font-medium">{showTriagem ? "Fechar" : "Iniciar"}</Text>
              </TouchableOpacity>
            </View>

            {showTriagem && (
              <View className="gap-4">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Peso (kg)</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-lg p-2 text-foreground"
                      placeholder="70"
                      placeholderTextColor="#687076"
                      keyboardType="decimal-pad"
                      value={triagemPeso}
                      onChangeText={setTriagemPeso}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Altura (cm)</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-lg p-2 text-foreground"
                      placeholder="170"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={triagemAltura}
                      onChangeText={setTriagemAltura}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs text-muted mb-1">Glicemia de jejum (mg/dL) — opcional</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg p-2 text-foreground"
                    placeholder="Ex: 95"
                    placeholderTextColor="#687076"
                    keyboardType="number-pad"
                    value={triagemGlicemia}
                    onChangeText={setTriagemGlicemia}
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg py-3 active:opacity-80"
                  onPress={calcularTriagem}
                >
                  <Text className="text-center font-semibold text-white">Calcular Riscos</Text>
                </TouchableOpacity>

                {triagemResultado && (
                  <View className="gap-3 p-4 bg-surface rounded-lg border border-border">
                    {triagemResultado.imc > 0 && (
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-xs text-muted">IMC calculado</Text>
                          <Text className="text-2xl font-bold text-foreground">{triagemResultado.imc}</Text>
                        </View>
                        <View className="items-end">
                          <View style={{ backgroundColor: triagemResultado.imcColor + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: triagemResultado.imcColor, fontWeight: '600', fontSize: 13 }}>{triagemResultado.imcClass}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {triagemResultado.riscos.length === 0 ? (
                      <View className="flex-row items-center gap-2 p-3 bg-success/10 rounded-lg border border-success">
                        <Text className="text-success text-base">✅</Text>
                        <Text className="text-success text-sm font-medium flex-1">Nenhum risco identificado. Continue mantendo hábitos saudáveis!</Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        <Text className="text-sm font-semibold text-error">⚠️ Alertas de Risco:</Text>
                        {triagemResultado.riscos.map((risco, i) => (
                          <View key={i} className="flex-row gap-2 p-3 bg-error/10 rounded-lg border border-error">
                            <Text className="text-error text-xs">•</Text>
                            <Text className="text-foreground text-xs flex-1 leading-relaxed">{risco}</Text>
                          </View>
                        ))}
                        <Text className="text-xs text-muted text-center mt-1">Comunique o SESMT para orientação</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
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
