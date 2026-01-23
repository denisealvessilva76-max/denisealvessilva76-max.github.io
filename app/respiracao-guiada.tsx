import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

type Phase = "inspire" | "segure" | "expire" | "repouso" | "completo";

export default function RespiracaoGuiadaScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("inspire");
  const [timeLeft, setTimeLeft] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [cicloAtual, setCicloAtual] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalCiclos = 5;

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

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-6 justify-center">
        {/* Cabeçalho */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground text-center">
            Respiração Guiada
          </Text>
          <Text className="text-sm text-muted text-center">
            Reduza o estresse e a ansiedade
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
                  <Text className="text-center font-semibold text-white">Começar</Text>
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
            onPress={() => router.back()}
          >
            <Text className="text-center text-foreground font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
