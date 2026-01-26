import { ScrollView, Text, View, Pressable, TextInput, Image, Alert, TouchableOpacity, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipos
interface ChallengeData {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  goal: number;
  unit: string;
  points: number;
  badge?: string;
  type: "hydration" | "steps" | "weight" | "checkin" | "breathing" | "stretching" | "custom";
  guide: string[];
  tips: string[];
}

interface DayProgress {
  date: string;
  completed: boolean;
  value?: number;
  time?: string;
  photoUri?: string;
  notes?: string;
}

interface PhotoEntry {
  uri: string;
  date: string;
  time: string;
  category: "pesagem" | "refeicao" | "atividade" | "outro";
  description?: string;
}

interface ChallengeProgress {
  challengeId: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "abandoned";
  currentValue: number;
  days: DayProgress[];
  difficulties: string[];
  photos: PhotoEntry[];
  weight?: { initial: number; current: number; goal: number };
  imc?: { value: number; classification: string };
}

// Dados dos desafios disponíveis
const CHALLENGES: ChallengeData[] = [
  {
    id: "challenge-steps-15d",
    title: "Caminhada Saudável",
    description: "Caminhe 6.000 passos por dia durante 15 dias consecutivos",
    icon: "🚶",
    difficulty: "medium",
    duration: 15,
    goal: 6000,
    unit: "passos/dia",
    points: 500,
    badge: "Campeão de Passos",
    type: "steps",
    guide: [
      "Comece com uma caminhada de 10 minutos pela manhã",
      "Use as escadas ao invés do elevador",
      "Caminhe durante o intervalo do almoço",
      "Estacione mais longe do destino",
      "Faça pequenas caminhadas a cada 2 horas"
    ],
    tips: [
      "Use um pedômetro ou app para contar passos",
      "Convide um colega para caminhar junto",
      "Ouça música ou podcast durante a caminhada",
      "Estabeleça horários fixos para caminhar"
    ]
  },
  {
    id: "challenge-hydration-7d",
    title: "Hidratação Consistente",
    description: "Beba pelo menos 2 litros de água por dia durante 7 dias",
    icon: "💧",
    difficulty: "easy",
    duration: 7,
    goal: 2000,
    unit: "ml/dia",
    points: 300,
    badge: "Hidratado",
    type: "hydration",
    guide: [
      "Beba um copo de água ao acordar",
      "Mantenha uma garrafa de água sempre visível",
      "Beba água antes de cada refeição",
      "Configure lembretes no celular",
      "Substitua refrigerantes por água"
    ],
    tips: [
      "Adicione limão ou hortelã para dar sabor",
      "Use uma garrafa com marcações de horário",
      "Beba água gelada no calor",
      "Acompanhe seu progresso no app"
    ]
  },
  {
    id: "challenge-weight-30d",
    title: "Desafio de Peso Saudável",
    description: "Perca peso de forma saudável em 30 dias com acompanhamento",
    icon: "⚖️",
    difficulty: "hard",
    duration: 30,
    goal: 3,
    unit: "kg",
    points: 1000,
    badge: "Transformação",
    type: "weight",
    guide: [
      "Pese-se sempre no mesmo horário (manhã em jejum)",
      "Tire foto da balança como registro",
      "Fotografe suas refeições principais",
      "Registre seu progresso semanalmente",
      "Procure um nutricionista se precisar de apoio"
    ],
    tips: [
      "Perda saudável: 0.5 a 1kg por semana",
      "Foque em alimentação balanceada, não em dietas restritivas",
      "Combine com atividade física leve",
      "Beba bastante água",
      "A equipe de saúde pode agendar nutricionista para você"
    ]
  },
  {
    id: "challenge-hydration-30d",
    title: "Mestre da Hidratação",
    description: "Mantenha-se hidratado por 30 dias seguidos (2L/dia)",
    icon: "💦",
    difficulty: "hard",
    duration: 30,
    goal: 2000,
    unit: "ml/dia",
    points: 1000,
    badge: "Mestre da Hidratação",
    type: "hydration",
    guide: [
      "Distribua a ingestão ao longo do dia",
      "Beba 250ml a cada 2 horas",
      "Aumente a ingestão em dias quentes",
      "Monitore a cor da urina (deve ser clara)",
      "Crie o hábito de beber água antes de sentir sede"
    ],
    tips: [
      "Mantenha água no local de trabalho",
      "Use apps de lembrete de hidratação",
      "Prefira água em temperatura ambiente",
      "Evite bebidas açucaradas"
    ]
  },
  {
    id: "challenge-checkin-30d",
    title: "Check-in Diário",
    description: "Faça check-in de bem-estar todos os dias por 30 dias",
    icon: "✅",
    difficulty: "medium",
    duration: 30,
    goal: 30,
    unit: "check-ins",
    points: 800,
    badge: "Cuidador da Saúde",
    type: "checkin",
    guide: [
      "Faça o check-in no mesmo horário todos os dias",
      "Seja honesto sobre como está se sentindo",
      "Use o momento para refletir sobre seu dia",
      "Reporte qualquer desconforto ou dor",
      "Acompanhe sua evolução ao longo do tempo"
    ],
    tips: [
      "Configure um lembrete diário",
      "Faça o check-in logo ao chegar no trabalho",
      "Aproveite para registrar hidratação também",
      "Compartilhe dificuldades com a equipe de saúde"
    ]
  },
  {
    id: "challenge-breathing-14d",
    title: "Respiração Consciente",
    description: "Pratique exercícios de respiração guiada por 14 dias",
    icon: "🌬️",
    difficulty: "easy",
    duration: 14,
    goal: 14,
    unit: "sessões",
    points: 400,
    badge: "Zen",
    type: "breathing",
    guide: [
      "Reserve 5 minutos por dia para respirar",
      "Encontre um local tranquilo",
      "Use a técnica 4-7-8 (inspire 4s, segure 7s, expire 8s)",
      "Pratique antes de situações estressantes",
      "Combine com alongamentos leves"
    ],
    tips: [
      "Faça no intervalo do almoço",
      "Use fones de ouvido para maior concentração",
      "Pratique sentado com postura ereta",
      "Feche os olhos para melhor foco"
    ]
  },
  {
    id: "challenge-stretching-21d",
    title: "Alongamento Diário",
    description: "Faça 10 minutos de alongamento todos os dias por 21 dias",
    icon: "🧘",
    difficulty: "medium",
    duration: 21,
    goal: 21,
    unit: "sessões",
    points: 600,
    badge: "Flexível",
    type: "stretching",
    guide: [
      "Alongue-se pela manhã ao acordar",
      "Faça pausas a cada 2 horas no trabalho",
      "Foque em pescoço, ombros e costas",
      "Mantenha cada posição por 20-30 segundos",
      "Respire profundamente durante o alongamento"
    ],
    tips: [
      "Use os vídeos de alongamento do app",
      "Alongue-se antes de sentir dor",
      "Convide colegas para alongar junto",
      "Não force além do confortável"
    ]
  }
];

const DIFFICULTY_COLORS = {
  easy: "#22C55E",
  medium: "#F59E0B",
  hard: "#EF4444",
};

const DIFFICULTY_LABELS = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export default function DesafioDetalheScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "progress" | "photos" | "difficulties">("info");
  
  // Estados para formulários
  const [dailyValue, setDailyValue] = useState("");
  const [dailyTime, setDailyTime] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  
  // Estados para fotos
  const [photoCategory, setPhotoCategory] = useState<"pesagem" | "refeicao" | "atividade" | "outro">("atividade");
  const [photoDescription, setPhotoDescription] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const challengeId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    const found = CHALLENGES.find(c => c.id === challengeId);
    if (found) {
      setChallenge(found);
      
      // Carregar progresso salvo
      const savedProgress = await AsyncStorage.getItem(`challenge_progress_${challengeId}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
        setIsStarted(parsed.status === "active");
      }
    }
  };

  const calculateIMC = (weightKg: number, heightM: number) => {
    const imc = weightKg / (heightM * heightM);
    let classification = "";
    
    if (imc < 18.5) classification = "Abaixo do peso";
    else if (imc < 25) classification = "Peso normal";
    else if (imc < 30) classification = "Sobrepeso";
    else if (imc < 35) classification = "Obesidade Grau I";
    else if (imc < 40) classification = "Obesidade Grau II";
    else classification = "Obesidade Grau III";
    
    return { value: Math.round(imc * 10) / 10, classification };
  };

  const startChallenge = async () => {
    if (!challenge) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + challenge.duration * 24 * 60 * 60 * 1000);
    
    let initialProgress: ChallengeProgress = {
      challengeId: challenge.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "active",
      currentValue: 0,
      days: [],
      difficulties: [],
      photos: [],
    };

    // Se for desafio de peso, calcular IMC
    if (challenge.type === "weight" && weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height) / 100; // converter cm para m
      const imc = calculateIMC(weightNum, heightNum);
      
      initialProgress.weight = {
        initial: weightNum,
        current: weightNum,
        goal: weightNum - challenge.goal
      };
      initialProgress.imc = imc;
      
      // Mostrar mensagem baseada no IMC
      if (imc.classification === "Sobrepeso" || imc.classification.includes("Obesidade")) {
        Alert.alert(
          "📊 Seu IMC: " + imc.value,
          `Classificação: ${imc.classification}\n\n` +
          "Dicas para alcançar seu objetivo:\n" +
          "• Procure um nutricionista para orientação personalizada\n" +
          "• A equipe de saúde pode agendar uma consulta para você\n" +
          "• Foque em mudanças graduais e sustentáveis\n" +
          "• Combine alimentação saudável com atividade física",
          [{ text: "Entendi", style: "default" }]
        );
      }
    }
    
    await AsyncStorage.setItem(`challenge_progress_${challenge.id}`, JSON.stringify(initialProgress));
    setProgress(initialProgress);
    setIsStarted(true);
    
    Alert.alert("🎯 Desafio Iniciado!", `Você tem ${challenge.duration} dias para completar. Boa sorte!`);
  };

  const registerDailyProgress = async () => {
    if (!challenge || !progress) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const today = new Date().toISOString().split("T")[0];
    const existingDay = progress.days.find(d => d.date === today);
    
    if (existingDay) {
      Alert.alert("Já registrado", "Você já registrou o progresso de hoje!");
      return;
    }
    
    const value = parseFloat(dailyValue) || 0;
    const newDay: DayProgress = {
      date: today,
      completed: true,
      value,
      time: dailyTime || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      notes: dailyNotes,
    };
    
    const updatedProgress: ChallengeProgress = {
      ...progress,
      currentValue: progress.currentValue + 1,
      days: [...progress.days, newDay],
    };
    
    // Atualizar peso se for desafio de peso
    if (challenge.type === "weight" && value > 0 && progress.weight) {
      updatedProgress.weight = {
        ...progress.weight,
        current: value
      };
      // Recalcular IMC
      if (height) {
        const heightM = parseFloat(height) / 100;
        updatedProgress.imc = calculateIMC(value, heightM);
      }
    }
    
    // Verificar se completou
    if (updatedProgress.currentValue >= challenge.duration) {
      updatedProgress.status = "completed";
      Alert.alert(
        "🎉 Parabéns!",
        `Você completou o desafio "${challenge.title}" e ganhou ${challenge.points} pontos!`,
        [{ text: "Celebrar!", style: "default" }]
      );
    }
    
    await AsyncStorage.setItem(`challenge_progress_${challenge.id}`, JSON.stringify(updatedProgress));
    setProgress(updatedProgress);
    setDailyValue("");
    setDailyTime("");
    setDailyNotes("");
    
    Alert.alert("✅ Registrado!", "Progresso do dia salvo com sucesso!");
  };

  const addDifficulty = async () => {
    if (!difficulty.trim() || !progress) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updatedProgress = {
      ...progress,
      difficulties: [...progress.difficulties, `${new Date().toLocaleDateString("pt-BR")}: ${difficulty}`]
    };
    
    await AsyncStorage.setItem(`challenge_progress_${challenge?.id}`, JSON.stringify(updatedProgress));
    setProgress(updatedProgress);
    setDifficulty("");
    
    Alert.alert("📝 Registrado", "Sua dificuldade foi registrada. A equipe de saúde pode ajudar!");
  };

  const pickImage = async () => {
    if (!progress) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newPhoto: PhotoEntry = {
        uri: result.assets[0].uri,
        date: new Date().toLocaleDateString("pt-BR"),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        category: photoCategory,
        description: photoDescription || undefined,
      };
      
      const updatedProgress = {
        ...progress,
        photos: [...progress.photos, newPhoto]
      };
      
      await AsyncStorage.setItem(`challenge_progress_${challenge?.id}`, JSON.stringify(updatedProgress));
      setProgress(updatedProgress);
      setPhotoDescription("");
      
      Alert.alert("📸 Foto adicionada!", "Sua foto foi salva como comprovação.");
    }
  };

  const takePhoto = async () => {
    if (!progress) return;
    
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à câmera para tirar fotos.");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newPhoto: PhotoEntry = {
        uri: result.assets[0].uri,
        date: new Date().toLocaleDateString("pt-BR"),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        category: photoCategory,
        description: photoDescription || undefined,
      };
      
      const updatedProgress = {
        ...progress,
        photos: [...progress.photos, newPhoto]
      };
      
      await AsyncStorage.setItem(`challenge_progress_${challenge?.id}`, JSON.stringify(updatedProgress));
      setProgress(updatedProgress);
      setPhotoDescription("");
      
      Alert.alert("📸 Foto adicionada!", "Sua foto foi salva como comprovação.");
    }
  };

  const renderCalendar = () => {
    if (!challenge || !progress) return null;
    
    const days = [];
    const startDate = new Date(progress.startDate);
    
    for (let i = 0; i < challenge.duration; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayProgress = progress.days.find(d => d.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      const isPast = date < new Date() && !isToday;
      
      days.push(
        <View
          key={i}
          className={`w-10 h-10 rounded-full items-center justify-center m-1 ${
            dayProgress?.completed ? "bg-success" :
            isToday ? "bg-primary" :
            isPast ? "bg-error/30" :
            "bg-surface border border-border"
          }`}
        >
          <Text className={`text-xs font-bold ${
            dayProgress?.completed || isToday ? "text-white" : "text-foreground"
          }`}>
            {i + 1}
          </Text>
        </View>
      );
    }
    
    return (
      <View className="flex-row flex-wrap justify-center">
        {days}
      </View>
    );
  };

  if (!challenge) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-6xl mb-4">❌</Text>
        <Text className="text-xl font-bold text-foreground text-center mb-4">
          Desafio não encontrado
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }]}
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="p-4">
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Text className="text-primary text-base mb-4">← Voltar</Text>
          </Pressable>
          
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-20 h-20 rounded-2xl items-center justify-center" style={{ backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + "20" }}>
              <Text className="text-5xl">{challenge.icon}</Text>
            </View>
            <View className="flex-1">
              <View className="px-3 py-1 rounded-full self-start mb-2" style={{ backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + "20" }}>
                <Text className="text-xs font-bold" style={{ color: DIFFICULTY_COLORS[challenge.difficulty] }}>
                  {DIFFICULTY_LABELS[challenge.difficulty]}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">{challenge.title}</Text>
            </View>
          </View>
          
          <Text className="text-base text-muted leading-relaxed">{challenge.description}</Text>
          
          {/* Info Cards */}
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
              <Text className="text-xs text-muted">Duração</Text>
              <Text className="text-lg font-bold text-foreground">{challenge.duration} dias</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
              <Text className="text-xs text-muted">Pontos</Text>
              <Text className="text-lg font-bold text-primary">+{challenge.points}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
              <Text className="text-xs text-muted">Meta</Text>
              <Text className="text-lg font-bold text-foreground">{challenge.goal}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {isStarted && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
            {[
              { key: "info", label: "📋 Guia" },
              { key: "progress", label: "📅 Progresso" },
              { key: "photos", label: "📸 Fotos" },
              { key: "difficulties", label: "⚠️ Dificuldades" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`px-4 py-2 rounded-full mr-2 ${activeTab === tab.key ? "bg-primary" : "bg-surface border border-border"}`}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text className={`text-sm font-semibold ${activeTab === tab.key ? "text-white" : "text-foreground"}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View className="px-4 gap-4">
          {/* Conteúdo baseado na tab */}
          {(!isStarted || activeTab === "info") && (
            <>
              {/* Guia do Desafio */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">📖 Como Completar</Text>
                {challenge.guide.map((step, idx) => (
                  <View key={idx} className="flex-row gap-3 mb-2">
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                      <Text className="text-xs font-bold text-white">{idx + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm text-foreground leading-relaxed">{step}</Text>
                  </View>
                ))}
              </View>

              {/* Dicas */}
              <View className="bg-success/10 rounded-xl p-4 border border-success">
                <Text className="text-lg font-semibold text-success mb-3">💡 Dicas para Encaixar na Rotina</Text>
                {challenge.tips.map((tip, idx) => (
                  <Text key={idx} className="text-sm text-foreground mb-2">• {tip}</Text>
                ))}
              </View>

              {/* Formulário de peso/altura para desafio de peso */}
              {challenge.type === "weight" && !isStarted && (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">⚖️ Seus Dados</Text>
                  <Text className="text-sm text-muted mb-3">Informe seu peso e altura para calcularmos seu IMC</Text>
                  
                  <View className="gap-3">
                    <View>
                      <Text className="text-sm text-muted mb-1">Peso atual (kg)</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="Ex: 75"
                        keyboardType="numeric"
                        value={weight}
                        onChangeText={setWeight}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                    <View>
                      <Text className="text-sm text-muted mb-1">Altura (cm)</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="Ex: 170"
                        keyboardType="numeric"
                        value={height}
                        onChangeText={setHeight}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Botão Iniciar */}
              {!isStarted && (
                <TouchableOpacity
                  className="bg-primary rounded-xl py-4"
                  onPress={startChallenge}
                >
                  <Text className="text-white font-bold text-center text-lg">🚀 Iniciar Desafio</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Tab de Progresso */}
          {isStarted && activeTab === "progress" && progress && (
            <>
              {/* Barra de Progresso */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted">Progresso</Text>
                  <Text className="text-sm font-bold text-primary">
                    {progress.currentValue}/{challenge.duration} dias
                  </Text>
                </View>
                <View className="h-4 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(progress.currentValue / challenge.duration) * 100}%` }}
                  />
                </View>
                {progress.status === "completed" && (
                  <View className="bg-success/20 rounded-lg p-3 mt-3">
                    <Text className="text-success font-bold text-center">🎉 Desafio Completado!</Text>
                  </View>
                )}
              </View>

              {/* Calendário */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">📅 Calendário</Text>
                <View className="flex-row mb-2">
                  <View className="flex-row items-center mr-4">
                    <View className="w-4 h-4 rounded-full bg-success mr-1" />
                    <Text className="text-xs text-muted">Completado</Text>
                  </View>
                  <View className="flex-row items-center mr-4">
                    <View className="w-4 h-4 rounded-full bg-primary mr-1" />
                    <Text className="text-xs text-muted">Hoje</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 rounded-full bg-error/30 mr-1" />
                    <Text className="text-xs text-muted">Perdido</Text>
                  </View>
                </View>
                {renderCalendar()}
              </View>

              {/* IMC (se for desafio de peso) */}
              {challenge.type === "weight" && progress.imc && (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">📊 Seu IMC</Text>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-3xl font-bold text-foreground">{progress.imc.value}</Text>
                      <Text className="text-sm text-muted">{progress.imc.classification}</Text>
                    </View>
                    {progress.weight && (
                      <View className="items-end">
                        <Text className="text-sm text-muted">Peso atual</Text>
                        <Text className="text-xl font-bold text-foreground">{progress.weight.current} kg</Text>
                        <Text className="text-xs text-success">
                          {progress.weight.initial - progress.weight.current > 0 
                            ? `↓ ${(progress.weight.initial - progress.weight.current).toFixed(1)} kg`
                            : "Início do desafio"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Registrar Progresso do Dia */}
              {progress.status === "active" && (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">✏️ Registrar Hoje</Text>
                  
                  <View className="gap-3">
                    {challenge.type === "weight" && (
                      <View>
                        <Text className="text-sm text-muted mb-1">Peso de hoje (kg)</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                          placeholder="Ex: 74.5"
                          keyboardType="numeric"
                          value={dailyValue}
                          onChangeText={setDailyValue}
                          placeholderTextColor={colors.muted}
                        />
                      </View>
                    )}
                    
                    <View>
                      <Text className="text-sm text-muted mb-1">Horário</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="Ex: 08:30"
                        value={dailyTime}
                        onChangeText={setDailyTime}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                    
                    <View>
                      <Text className="text-sm text-muted mb-1">Observações (opcional)</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="Como foi hoje?"
                        multiline
                        numberOfLines={2}
                        value={dailyNotes}
                        onChangeText={setDailyNotes}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                    
                    <TouchableOpacity
                      className="bg-success rounded-lg py-3"
                      onPress={registerDailyProgress}
                    >
                      <Text className="text-white font-semibold text-center">✓ Registrar Dia</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Histórico */}
              {progress.days.length > 0 && (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">📜 Histórico</Text>
                  {progress.days.slice().reverse().map((day, idx) => (
                    <View key={idx} className="flex-row items-center justify-between py-2 border-b border-border">
                      <View>
                        <Text className="text-sm font-semibold text-foreground">{day.date}</Text>
                        {day.time && <Text className="text-xs text-muted">{day.time}</Text>}
                      </View>
                      {day.value && <Text className="text-sm text-primary font-semibold">{day.value} {challenge.unit.split("/")[0]}</Text>}
                      <Text className="text-success">✓</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Tab de Fotos */}
          {isStarted && activeTab === "photos" && progress && (
            <>
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">📸 Adicionar Foto</Text>
                <Text className="text-sm text-muted mb-4">
                  Tire fotos como comprovação: pesagens, refeições, atividades realizadas
                </Text>
                
                {/* Seletor de Categoria */}
                <View className="mb-4">
                  <Text className="text-sm text-muted mb-2">Categoria da foto:</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: "pesagem", label: "⚖️ Pesagem", icon: "⚖️" },
                      { id: "refeicao", label: "🍽️ Refeição", icon: "🍽️" },
                      { id: "atividade", label: "🏃 Atividade", icon: "🏃" },
                      { id: "outro", label: "📝 Outro", icon: "📝" },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        className={`px-3 py-2 rounded-lg border ${photoCategory === cat.id ? "bg-primary border-primary" : "bg-background border-border"}`}
                        onPress={() => setPhotoCategory(cat.id as typeof photoCategory)}
                      >
                        <Text className={photoCategory === cat.id ? "text-white font-semibold" : "text-foreground"}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Descrição opcional */}
                <View className="mb-4">
                  <Text className="text-sm text-muted mb-2">Descrição (opcional):</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Ex: Pesagem após treino, Almoço saudável..."
                    value={photoDescription}
                    onChangeText={setPhotoDescription}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-3"
                    onPress={takePhoto}
                  >
                    <Text className="text-white font-semibold text-center">📷 Tirar Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-primary rounded-lg py-3"
                    onPress={pickImage}
                  >
                    <Text className="text-primary font-semibold text-center">🖼️ Galeria</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Galeria de Fotos */}
              {progress.photos.length > 0 ? (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">
                    🖼️ Suas Fotos ({progress.photos.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {progress.photos.map((photo, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setSelectedPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                      >
                        <View className="relative">
                          <Image
                            source={{ uri: photo.uri }}
                            className="w-24 h-24 rounded-lg"
                            resizeMode="cover"
                          />
                          <View className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-1 py-0.5">
                            <Text className="text-white text-xs text-center">
                              {photo.category === "pesagem" ? "⚖️" : photo.category === "refeicao" ? "🍽️" : photo.category === "atividade" ? "🏃" : "📝"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="bg-surface rounded-xl p-6 border border-border items-center">
                  <Text className="text-4xl mb-2">📷</Text>
                  <Text className="text-muted text-center">
                    Nenhuma foto adicionada ainda.{"\n"}
                    Registre seu progresso com fotos!
                  </Text>
                </View>
              )}
              
              {/* Modal de Visualização */}
              {showPhotoModal && selectedPhoto && (
                <View className="absolute inset-0 bg-black/90 z-50 items-center justify-center" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                  <TouchableOpacity
                    className="absolute top-12 right-4 z-10 bg-white/20 rounded-full p-2"
                    onPress={() => setShowPhotoModal(false)}
                  >
                    <Text className="text-white text-xl">✕</Text>
                  </TouchableOpacity>
                  <Image
                    source={{ uri: selectedPhoto.uri }}
                    className="w-full h-96"
                    resizeMode="contain"
                  />
                  <View className="bg-white/10 rounded-lg p-4 mt-4 mx-4">
                    <Text className="text-white text-center font-semibold">
                      {selectedPhoto.category === "pesagem" ? "⚖️ Pesagem" : selectedPhoto.category === "refeicao" ? "🍽️ Refeição" : selectedPhoto.category === "atividade" ? "🏃 Atividade" : "📝 Outro"}
                    </Text>
                    <Text className="text-white/70 text-center text-sm mt-1">
                      {selectedPhoto.date} às {selectedPhoto.time}
                    </Text>
                    {selectedPhoto.description && (
                      <Text className="text-white text-center mt-2">{selectedPhoto.description}</Text>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Tab de Dificuldades */}
          {isStarted && activeTab === "difficulties" && progress && (
            <>
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">⚠️ Relatar Dificuldade</Text>
                <Text className="text-sm text-muted mb-3">
                  Está tendo dificuldades? Conte para nós. A equipe de saúde pode ajudar!
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
                  placeholder="Descreva sua dificuldade..."
                  multiline
                  numberOfLines={3}
                  value={difficulty}
                  onChangeText={setDifficulty}
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity
                  className="bg-warning rounded-lg py-3"
                  onPress={addDifficulty}
                >
                  <Text className="text-white font-semibold text-center">📝 Registrar Dificuldade</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Dificuldades */}
              {progress.difficulties.length > 0 && (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">📋 Dificuldades Registradas</Text>
                  {progress.difficulties.map((diff, idx) => (
                    <View key={idx} className="bg-warning/10 rounded-lg p-3 mb-2">
                      <Text className="text-sm text-foreground">{diff}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Suporte */}
              <View className="bg-primary/10 rounded-xl p-4 border border-primary">
                <Text className="text-lg font-semibold text-primary mb-2">🤝 Precisa de Apoio?</Text>
                <Text className="text-sm text-foreground mb-3">
                  A equipe de saúde ocupacional pode ajudar você a superar as dificuldades:
                </Text>
                <View className="gap-2">
                  <Text className="text-sm text-foreground">• Agendar consulta com nutricionista</Text>
                  <Text className="text-sm text-foreground">• Orientação sobre exercícios</Text>
                  <Text className="text-sm text-foreground">• Acompanhamento personalizado</Text>
                  <Text className="text-sm text-foreground">• Suporte psicológico se necessário</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
