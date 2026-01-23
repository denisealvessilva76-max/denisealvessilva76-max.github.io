import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const AVATARS = [
  "👷", "👷‍♀️", "👨‍🔧", "👩‍🔧", "👨‍🏭", "👩‍🏭",
  "👨‍💼", "👩‍💼", "👨‍⚕️", "👩‍⚕️", "🧑‍🔧", "🧑‍🏭",
  "😊", "😎", "🤓", "🥳", "😇", "🤗",
  "💪", "🦸", "🦸‍♀️", "🦸‍♂️", "🧠", "❤️",
];

export default function SelectAvatarScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState("");

  useEffect(() => {
    loadCurrentAvatar();
  }, []);

  const loadCurrentAvatar = async () => {
    try {
      const stored = await AsyncStorage.getItem("health:profile");
      if (stored) {
        const profile = JSON.parse(stored);
        setCurrentAvatar(profile.avatar || "");
        setSelectedAvatar(profile.avatar || "");
      }
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
    }
  };

  const handleSelectAvatar = async () => {
    if (!selectedAvatar) {
      Alert.alert("Atenção", "Por favor, selecione um avatar");
      return;
    }

    try {
      const stored = await AsyncStorage.getItem("health:profile");
      const profile = stored ? JSON.parse(stored) : {};
      
      const updatedProfile = {
        ...profile,
        avatar: selectedAvatar,
      };

      await AsyncStorage.setItem("health:profile", JSON.stringify(updatedProfile));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Avatar atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Não foi possível salvar o avatar");
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl">{selectedAvatar || "👤"}</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Escolha seu Avatar
            </Text>
            <Text className="text-sm text-muted text-center">
              Selecione um avatar para personalizar seu perfil
            </Text>
          </View>

          {/* Grid de Avatares */}
          <View className="flex-row flex-wrap justify-center gap-3">
            {AVATARS.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedAvatar(avatar);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor:
                    selectedAvatar === avatar
                      ? colors.primary
                      : colors.surface,
                  borderWidth: selectedAvatar === avatar ? 3 : 1,
                  borderColor:
                    selectedAvatar === avatar
                      ? colors.primary
                      : colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 36 }}>{avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botões */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleSelectAvatar}
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Salvar Avatar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
