import { View, Text, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ScreenContainer } from "@/components/screen-container";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function VideoPlayerScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const { title, url } = params;
  const { checkIns } = useHealthData();
  const { addVideoPoints } = useGamification(checkIns);
  const [hasWatched, setHasWatched] = useState(false);

  const handleOpenVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (url) {
      await WebBrowser.openBrowserAsync(url as string);
      // Adicionar pontos após abrir o vídeo (assumindo que o usuário assistiu)
      if (!hasWatched) {
        const points = await addVideoPoints();
        setHasWatched(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground" numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        {/* Player Placeholder */}
        <View className="bg-surface rounded-xl overflow-hidden mb-6" style={{ aspectRatio: 16 / 9 }}>
          <View className="flex-1 items-center justify-center bg-primary/10">
            <Text className="text-6xl mb-4">🎥</Text>
            <TouchableOpacity
              onPress={handleOpenVideo}
              className="bg-primary px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-background font-semibold">Abrir Vídeo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instruções */}
        <View className="bg-surface rounded-xl p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-base font-semibold text-foreground mb-3">📝 Instruções</Text>
          <Text className="text-sm text-muted leading-relaxed mb-2">
            • Assista o vídeo completo antes de começar
          </Text>
          <Text className="text-sm text-muted leading-relaxed mb-2">
            • Faça os movimentos devagar e com cuidado
          </Text>
          <Text className="text-sm text-muted leading-relaxed mb-2">
            • Pare se sentir dor ou desconforto
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            • Respire profundamente durante os alongamentos
          </Text>
        </View>

        {/* Dica */}
        <View className="bg-primary/10 rounded-xl p-4 mt-4" style={{ borderWidth: 1, borderColor: colors.primary }}>
          <Text className="text-sm text-primary font-semibold mb-1">💡 Dica</Text>
          <Text className="text-sm text-foreground">
            Faça este alongamento durante as pausas ativas (10h e 15h) para prevenir lesões e melhorar sua postura!
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
