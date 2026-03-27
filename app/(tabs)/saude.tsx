import { ScrollView, Text, View, TouchableOpacity, TextInput, Pressable, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { Badge, getPressureBadgeVariant, getPressureLabel } from "@/components/ui/badge";
import { useHealthData } from "@/hooks/use-health-data";
import { useHydration } from "@/hooks/use-hydration";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { SYMPTOMS } from "@/lib/types";
import * as Haptics from "expo-haptics";

export default function SaudeScreen() {
  const router = useRouter();
  const { addPressureReading, addSymptomReport, classifyPressure, getLatestPressure, pressureReadings } = useHealthData();
  const { sendPainNotification } = useAdminNotifications();
  const { hydrationData, logWaterIntake } = useHydration();
  const [matricula, setMatricula] = useState<string>("");
  const { syncBloodPressure, syncSymptoms } = useFirebaseSync({ matricula, enabled: !!matricula });
  const [waterAmount, setWaterAmount] = useState("");
  const [showHydrationForm, setShowHydrationForm] = useState(false);

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
      if (glicemia > 200) { riscos.push("Glicemia elevada — risco de diabetes"); imcColor = "#EF4444"; }
      else if (glicemia > 126) { riscos.push("Glicemia acima do normal — recomenda-se avaliação médica"); }
    }

    setTriagemResultado({ imc, imcClass, imcColor, riscos });
  };

  // Pressão Arterial
  const [showPressureForm, setShowPressureForm] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [latestPressure, setLatestPressure] = useState(getLatestPressure());
  const [latestClassification, setLatestClassification] = useState<'normal' | 'pre-hipertensao' | 'hipertensao' | null>(null);

  useEffect(() => {
        const latest = getLatestPressure();
    setLatestPressure(latest);
    if (latest) {
      const classification = classifyPressure(latest.systolic, latest.diastolic);
      setLatestClassification(classification as any);
    }
  }, [pressureReadings]);

  const handleAddPressure = async () => {
    if (!systolic || !diastolic) {
      Alert.alert("Erro", "Preencha ambos os valores de pressão");
      return;
    }

    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);

    if (sys <= 0 || dia <= 0) {
      Alert.alert("Erro", "Valores de pressão devem ser maiores que 0");
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

  const handleAddWater = async () => {
    const amount = parseInt(waterAmount);
    if (!waterAmount || amount <= 0) {
      Alert.alert("Erro", "Digite uma quantidade válida de água (em ml)");
      return;
    }
    await logWaterIntake();
    setWaterAmount("");
    setShowHydrationForm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Sucesso", `${amount}ml de água registrado!`);
  };

  const getTodayHydration = () => {
    const today = new Date().toISOString().split('T')[0];
    return hydrationData[today]?.waterIntake || 0;
  };

  const handleAddCup = async () => {
    await logWaterIntake(1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Sintomas
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showSymptomDetails, setShowSymptomDetails] = useState(false);
  const [symptomDetails, setSymptomDetails] = useState("");
  const [symptomIntensity, setSymptomIntensity] = useState("leve");

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
                      variant={getPressureBadgeVariant(latestClassification as 'normal' | 'pre-hipertensao' | 'hipertensao')}
                      label={getPressureLabel(latestClassification as 'normal' | 'pre-hipertensao' | 'hipertensao')}
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
                    onPress={() => setShowPressureForm(true)}
                  >
                    <Text className="text-center font-semibold text-white">+ Registrar Pressão</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View className="gap-2">
                  <View className="flex-row gap-2">
                    <TextInput
                      className="flex-1 border border-border rounded-lg p-3 text-foreground"
                      placeholder="Sistólica"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={systolic}
                      onChangeText={setSystolic}
                    />
                    <TextInput
                      className="flex-1 border border-border rounded-lg p-3 text-foreground"
                      placeholder="Diastólica"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={diastolic}
                      onChangeText={setDiastolic}
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 bg-primary rounded-lg py-3 active:opacity-80"
                      onPress={handleAddPressure}
                    >
                      <Text className="text-center font-semibold text-white">Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-border rounded-lg py-3 active:opacity-80"
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
            <Text className="text-sm text-muted">Você está sentindo algo?</Text>

            {!showSymptomDetails ? (
              <>
                <View className="gap-2">
                  {SYMPTOMS.map((symptom) => (
                    <Pressable
                      key={symptom.id}
                      onPress={() => handleToggleSymptom(symptom.id)}
                      style={({ pressed }) => [
                        {
                          backgroundColor: selectedSymptoms.includes(symptom.id) ? "#0a7ea4" : "#f5f5f5",
                          opacity: pressed ? 0.7 : 1,
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: selectedSymptoms.includes(symptom.id) ? "#0a7ea4" : "#E5E7EB",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selectedSymptoms.includes(symptom.id) ? "white" : "#11181C",
                          fontWeight: "500",
                        }}
                      >
                        {selectedSymptoms.includes(symptom.id) ? "✓ " : ""}{symptom.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {selectedSymptoms.length > 0 && (
                  <TouchableOpacity
                    className="bg-primary rounded-lg py-3 active:opacity-80"
                    onPress={handleContinueToDetails}
                  >
                    <Text className="text-center font-semibold text-white">Continuar</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View className="gap-3">
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Intensidade</Text>
                  <View className="flex-row gap-2">
                    {["leve", "moderada", "forte"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setSymptomIntensity(level)}
                        className={`flex-1 rounded-lg py-2 ${
                          symptomIntensity === level ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <Text
                          className={`text-center text-sm font-semibold ${
                            symptomIntensity === level ? "text-white" : "text-foreground"
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Detalhes (opcional)</Text>
                  <TextInput
                    className="border border-border rounded-lg p-3 text-foreground"
                    placeholder="Descreva os sintomas..."
                    placeholderTextColor="#687076"
                    multiline
                    numberOfLines={3}
                    value={symptomDetails}
                    onChangeText={setSymptomDetails}
                  />
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-3 active:opacity-80"
                    onPress={handleReportSymptoms}
                  >
                    <Text className="text-center font-semibold text-white">Reportar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-border rounded-lg py-3 active:opacity-80"
                    onPress={() => {
                      setShowSymptomDetails(false);
                      setSelectedSymptoms([]);
                      setSymptomDetails("");
                      setSymptomIntensity("leve");
                    }}
                  >
                    <Text className="text-center font-semibold text-foreground">Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Seção de Triagem de Comorbidades */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Triagem de Saúde</Text>

            {!showTriagem ? (
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 active:opacity-80"
                onPress={() => setShowTriagem(true)}
              >
                <Text className="text-center font-semibold text-white">Iniciar Triagem</Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                <TextInput
                  className="border border-border rounded-lg p-3 text-foreground"
                  placeholder="Altura (cm)"
                  placeholderTextColor="#687076"
                  keyboardType="number-pad"
                  value={triagemAltura}
                  onChangeText={setTriagemAltura}
                />

                <TextInput
                  className="border border-border rounded-lg p-3 text-foreground"
                  placeholder="Peso (kg)"
                  placeholderTextColor="#687076"
                  keyboardType="number-pad"
                  value={triagemPeso}
                  onChangeText={setTriagemPeso}
                />

                <TextInput
                  className="border border-border rounded-lg p-3 text-foreground"
                  placeholder="Glicemia (mg/dL)"
                  placeholderTextColor="#687076"
                  keyboardType="number-pad"
                  value={triagemGlicemia}
                  onChangeText={setTriagemGlicemia}
                />

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

          {/* Seção de Hidratação */}
          <Card className="gap-5">
            {/* Título */}
            <View className="gap-2">
              <Text className="text-2xl font-bold text-foreground">💧 Hidratação</Text>
              <Text className="text-xs text-muted">Mantenha-se hidratado ao longo do dia</Text>
            </View>
            
            {/* Garrafinha Visual com Gradiente */}
            <View className="items-center gap-4">
              {/* Garrafinha 3D */}
              <View className="relative items-center">
                {/* Sombra */}
                <View className="absolute -bottom-2 w-28 h-2 bg-black/10 rounded-full blur-md" />
                
                {/* Garrafa */}
                <View className="relative w-28 h-48 rounded-b-3xl overflow-hidden border-4 border-primary shadow-lg" style={{ elevation: 8 }}>
                  {/* Fundo branco */}
                  <View className="absolute inset-0 bg-white/20" />
                  
                  {/* Água com gradiente */}
                  <View 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 via-blue-300 to-cyan-300" 
                    style={{ 
                      height: `${Math.min((getTodayHydration() / 2800) * 100, 100)}%`,
                      opacity: 0.85
                    }}
                  />
                  
                  {/* Brilho na água */}
                  {getTodayHydration() > 0 && (
                    <View className="absolute top-2 left-2 w-2 h-8 bg-white/40 rounded-full" />
                  )}
                  
                  {/* Percentual */}
                  <View className="absolute inset-0 items-center justify-center">
                    <Text className="text-4xl font-black text-primary drop-shadow-lg">
                      {Math.round((getTodayHydration() / 2800) * 100)}%
                    </Text>
                  </View>
                </View>
                
                {/* Tampa da garrafa */}
                <View className="w-20 h-3 bg-primary rounded-t-lg border-2 border-primary" />
              </View>
              
              {/* Info */}
              <View className="items-center gap-2">
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-3xl font-black text-primary">{(getTodayHydration() / 1000).toFixed(1)}</Text>
                  <Text className="text-lg font-semibold text-muted">L</Text>
                </View>
                <View className="flex-row gap-2 items-center">
                  <View className="h-1 flex-1 bg-border rounded-full overflow-hidden" style={{ width: 120 }}>
                    <View 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" 
                      style={{ width: `${Math.min((getTodayHydration() / 2800) * 100, 100)}%` }}
                    />
                  </View>
                  <Text className="text-xs font-semibold text-muted">2,8L</Text>
                </View>
              </View>
            </View>

            {/* Botões de Copos Interativos */}
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-bold text-foreground text-center">Clique nos copos para beber</Text>
                <Text className="text-xs text-muted text-center font-semibold">Cada copo = 180ml</Text>
              </View>
              
              {/* Grid de Copos */}
              <View className="flex-row flex-wrap gap-3 justify-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={handleAddCup}
                    activeOpacity={0.6}
                    className="items-center gap-1"
                  >
                    {/* Copo */}
                    <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 items-center justify-center shadow-md border-2 border-blue-300" style={{ elevation: 5 }}>
                      <Text className="text-3xl">🥤</Text>
                    </View>
                    {/* Label */}
                    <Text className="text-xs font-semibold text-primary">+180ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View className="gap-2 p-4 bg-white/60 rounded-2xl border border-blue-200">
              {getTodayHydration() >= 2800 ? (
                <View className="gap-2">
                  <Text className="text-sm font-bold text-success text-center">Parabéns!</Text>
                  <Text className="text-xs text-foreground text-center leading-relaxed">
                    Você atingiu a meta de hidratação do dia! Continue hidratado!
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  <Text className="text-sm font-bold text-primary text-center">Continue!</Text>
                  <Text className="text-xs text-foreground text-center leading-relaxed">
                    Faltam {((2800 - getTodayHydration()) / 1000).toFixed(1)}L para atingir sua meta diária.
                  </Text>
                </View>
              )}
            </View>

            {/* Dica */}
            <View className="gap-2 p-3 bg-yellow-100 rounded-xl border border-yellow-300">
              <Text className="text-xs font-bold text-yellow-800">Dica de Saúde</Text>
              <Text className="text-xs text-yellow-900 leading-relaxed">
                Beba água regularmente ao longo do dia. A hidratação adequada melhora a concentração, reduz a fadiga e previne doenças ocupacionais.
              </Text>
            </View>
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
