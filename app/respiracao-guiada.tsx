import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Phase = "inspire" | "segure" | "expire" | "repouso" | "completo";
type BackgroundSound = "none" | "rain" | "ocean" | "forest";

const BACKGROUND_SOUNDS = [
  { id: "none" as BackgroundSound, name: "Silêncio", emoji: "🔇", description: "Apenas a voz guiada" },
  { id: "rain" as BackgroundSound, name: "Chuva", emoji: "🌧️", description: "Som suave de chuva" },
  { id: "ocean" as BackgroundSound, name: "Ondas do Mar", emoji: "🌊", description: "Ondas relaxantes" },
  { id: "forest" as BackgroundSound, name: "Floresta", emoji: "🌳", description: "Pássaros e natureza" },
];

// URLs de sons gratuitos do Pixabay (royalty-free)
const SOUND_URLS: Record<BackgroundSound, string | null> = {
  none: null,
  rain: "https://cdn.pixabay.com/audio/2022/05/13/audio_2fe2aa08e4.mp3", // Rain sound
  ocean: "https://cdn.pixabay.com/audio/2022/03/10/audio_4d48654d4a.mp3", // Ocean waves
  forest: "https://cdn.pixabay.com/audio/2022/03/10/audio_12b0c7443c.mp3", // Forest birds
};

export default function RespiracaoGuiadaScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("inspire");
  const [timeLeft, setTimeLeft] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [cicloAtual, setCicloAtual] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedSound, setSelectedSound] = useState<BackgroundSound>("none");
  const [showSoundSelector, setShowSoundSelector] = useState(true);

  const totalCiclos = 5;

  // Player de áudio para som de fundo
  const rainPlayer = useAudioPlayer(SOUND_URLS.rain || "");
  const oceanPlayer = useAudioPlayer(SOUND_URLS.ocean || "");
  const forestPlayer = useAudioPlayer(SOUND_URLS.forest || "");

  // Carregar preferência salva
  useEffect(() => {
    loadSoundPreference();
  }, []);

  const loadSoundPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem("breathing_sound_preference");
      if (saved) {
        setSelectedSound(saved as BackgroundSound);
      }
    } catch (error) {
      console.log("Erro ao carregar preferência de som:", error);
    }
  };

  const saveSoundPreference = async (sound: BackgroundSound) => {
    try {
      await AsyncStorage.setItem("breathing_sound_preference", sound);
    } catch (error) {
      console.log("Erro ao salvar preferência de som:", error);
    }
  };

  // Controlar reprodução do som de fundo
  useEffect(() => {
    if (!isRunning || selectedSound === "none") return;

    const player = 
      selectedSound === "rain" ? rainPlayer :
      selectedSound === "ocean" ? oceanPlayer :
      forestPlayer;

    player.volume = 0.3; // Volume baixo para não atrapalhar a voz
    player.loop = true;
    player.play();

    return () => {
      player.pause();
    };
  }, [isRunning, selectedSound]);

  // Falar instrução de voz quando muda de fase
  useEffect(() => {
    if (!isRunning) return;

    const speakInstruction = () => {
      Speech.stop(); // Para qualquer fala anterior
      
      let text = "";
      if (phase === "inspire") {
        text = "Inspire lentamente pelo nariz";
      } else if (phase === "segure") {
        text = "Segure a respiração";
      } else if (phase === "expire") {
        text = "Expire lentamente pela boca";
      } else if (phase === "completo") {
        text = "Parabéns! Exercício completo";
      }

      if (text) {
        Speech.speak(text, {
          language: "pt-BR",
          pitch: 1.0,
          rate: 0.85,
        });
      }
    };

    speakInstruction();
  }, [phase, isRunning]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Passar para próxima fase
          if (phase === "inspire") {
            setPhase("segure");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return 4;
          } else if (phase === "segure") {
            setPhase("expire");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return 4;
          } else if (phase === "expire") {
            if (cicloAtual < totalCiclos) {
              setCicloAtual((prev) => prev + 1);
              setPhase("inspire");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return 4;
            } else {
              setPhase("completo");
              setIsRunning(false);
              setIsCompleted(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return 0;
            }
          }
          return prev - 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase, cicloAtual]);

  const getPhaseText = () => {
    switch (phase) {
      case "inspire":
        return "Inspire lentamente";
      case "segure":
        return "Segure a respiração";
      case "expire":
        return "Expire lentamente";
      case "completo":
        return "Respiração Completa!";
      default:
        return "";
    }
  };

  const getPhaseEmoji = () => {
    switch (phase) {
      case "inspire":
        return "🫁";
      case "segure":
        return "⏸️";
      case "expire":
        return "💨";
      case "completo":
        return "✨";
      default:
        return "🫁";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "inspire":
        return "bg-blue-500/10 border-blue-500";
      case "segure":
        return "bg-yellow-500/10 border-yellow-500";
      case "expire":
        return "bg-green-500/10 border-green-500";
      case "completo":
        return "bg-success/10 border-success";
      default:
        return "bg-primary/10 border-primary";
    }
  };

  const handleSoundSelect = (sound: BackgroundSound) => {
    setSelectedSound(sound);
    saveSoundPreference(sound);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStart = () => {
    setShowSoundSelector(false);
    setIsRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Seletor de Som de Fundo
  if (showSoundSelector && !isRunning && !isCompleted) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-6 justify-center py-8">
            {/* Cabeçalho */}
            <View className="gap-2">
              <Text className="text-3xl font-bold text-foreground text-center">
                Respiração Guiada
              </Text>
              <Text className="text-sm text-muted text-center">
                Escolha um som de fundo relaxante
              </Text>
            </View>

            {/* Opções de Som */}
            <View className="gap-3">
              {BACKGROUND_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  className={`border-2 rounded-xl p-4 active:opacity-80 ${
                    selectedSound === sound.id
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => handleSoundSelect(sound.id)}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-4xl">{sound.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {sound.name}
                      </Text>
                      <Text className="text-sm text-muted">{sound.description}</Text>
                    </View>
                    {selectedSound === sound.id && (
                      <Text className="text-2xl">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Instruções */}
            <Card className="gap-3">
              <Text className="text-sm font-semibold text-foreground">Como funciona:</Text>
              <View className="gap-2">
                <Text className="text-xs text-foreground">
                  • <Text className="font-semibold">Inspire:</Text> Respire profundamente pelo nariz por 4 segundos
                </Text>
                <Text className="text-xs text-foreground">
                  • <Text className="font-semibold">Segure:</Text> Mantenha a respiração por 4 segundos
                </Text>
                <Text className="text-xs text-foreground">
                  • <Text className="font-semibold">Expire:</Text> Solte o ar lentamente pela boca por 4 segundos
                </Text>
                <Text className="text-xs text-foreground">
                  • <Text className="font-semibold">Repita:</Text> 5 ciclos completos
                </Text>
              </View>
            </Card>

            {/* Botões */}
            <View className="gap-3">
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 active:opacity-80"
                onPress={handleStart}
              >
                <Text className="text-center font-semibold text-white">Começar Exercício</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-surface border border-border rounded-lg py-3 active:opacity-80"
                onPress={() => router.back()}
              >
                <Text className="text-center text-foreground font-semibold">Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Tela de Exercício
  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-6 justify-center">
        {/* Cabeçalho */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground text-center">
            Respiração Guiada
          </Text>
          <Text className="text-sm text-muted text-center">
            {BACKGROUND_SOUNDS.find(s => s.id === selectedSound)?.name || "Silêncio"}
          </Text>
        </View>

        {/* Indicador de Ciclo */}
        <View className="flex-row justify-center gap-2">
          {Array.from({ length: totalCiclos }).map((_, index) => (
            <View
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < cicloAtual ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </View>

        {/* Visualização da Respiração */}
        {!isCompleted && (
          <Card className={`gap-6 items-center py-12 ${getPhaseColor()}`}>
            <Text className="text-6xl">{getPhaseEmoji()}</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              {getPhaseText()}
            </Text>
            <Text className="text-5xl font-bold text-primary">{timeLeft}</Text>
            <Text className="text-sm text-muted">
              Ciclo {cicloAtual} de {totalCiclos}
            </Text>
          </Card>
        )}

        {/* Conclusão */}
        {isCompleted && (
          <Card className="gap-4 items-center py-12 bg-success/10 border border-success">
            <Text className="text-6xl">🎉</Text>
            <Text className="text-2xl font-bold text-success">Excelente!</Text>
            <Text className="text-center text-foreground">
              Você completou a respiração guiada. Sinta-se mais calmo e relaxado.
            </Text>
          </Card>
        )}

        {/* Botões de Controle */}
        <View className="gap-3">
          {!isCompleted && (
            <>
              {!isRunning ? (
                <TouchableOpacity
                  className="bg-primary rounded-lg py-3 active:opacity-80"
                  onPress={() => {
                    setIsRunning(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text className="text-center font-semibold text-white">Continuar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-warning rounded-lg py-3 active:opacity-80"
                  onPress={() => {
                    setIsRunning(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text className="text-center font-semibold text-white">Pausar</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {isCompleted && (
            <TouchableOpacity
              className="bg-success rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              }}
            >
              <Text className="text-center font-semibold text-white">Concluído</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-surface border border-border rounded-lg py-3 active:opacity-80"
            onPress={() => {
              setShowSoundSelector(true);
              setIsRunning(false);
            }}
          >
            <Text className="text-center text-foreground font-semibold">
              Trocar Som de Fundo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-lg py-3 active:opacity-80"
            onPress={() => router.back()}
          >
            <Text className="text-center text-foreground font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
