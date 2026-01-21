import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Medal } from "@/lib/gamification";
import * as Haptics from "expo-haptics";

interface MedalCardProps {
  medal: Medal;
  isUnlocked: boolean;
  onPress?: () => void;
  showProgress?: boolean;
  progress?: number;
}

export function MedalCard({
  medal,
  isUnlocked,
  onPress,
  showProgress = false,
  progress = 0,
}: MedalCardProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View
        className={`items-center gap-2 p-4 rounded-xl border ${
          isUnlocked
            ? "bg-success/10 border-success"
            : "bg-surface border-border"
        }`}
      >
        <Text className={`text-5xl ${isUnlocked ? "" : "opacity-40"}`}>
          {medal.emoji}
        </Text>
        <Text className={`text-sm font-semibold text-center ${isUnlocked ? "text-foreground" : "text-muted"}`}>
          {medal.name}
        </Text>
        {!isUnlocked && showProgress && (
          <View className="w-full gap-1">
            <View className="h-1 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-xs text-muted text-center">
              {progress}%
            </Text>
          </View>
        )}
        {isUnlocked && (
          <Text className="text-xs text-success font-semibold">
            ✓ Desbloqueada
          </Text>
        )}
      </View>
    </Pressable>
  );
}
