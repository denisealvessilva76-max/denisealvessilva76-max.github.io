import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHealthData } from "@/hooks/use-health-data";
import * as Haptics from "expo-haptics";
import axios from "axios";
import {
  FeedbackType,
  FeedbackCategory,
  FEEDBACK_TYPES,
  FEEDBACK_CATEGORIES,
} from "@/lib/feedback-types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://3000-i84jlsmq8t12oldkdpl95-0fe92ffe.us2.manus.computer";

export default function EnviarFeedbackScreen() {
  const router = useRouter();
  const { profile } = useHealthData();
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert("Erro", "Selecione o tipo de feedback");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Erro", "Selecione a categoria");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Erro", "Digite um título para o feedback");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Erro", "Digite uma descrição detalhada");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/feedback`, {
        userId: profile?.id || `user-${Date.now()}`,
        userName: profile?.name || "Usuário Anônimo",
        userCpf: profile?.cpf || "Não informado",
        type: selectedType,
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "✅ Feedback Enviado!",
          response.data.message || "Obrigado por contribuir para melhorar o Canteiro Saudável!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Não foi possível enviar o feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="p-6 bg-primary">
          <Text className="text-2xl font-bold text-white mb-1">💬 Enviar Feedback</Text>
          <Text className="text-sm text-white/80">
            Sua opinião é muito importante para nós!
          </Text>
        </View>

        <View className="p-6 gap-6">
          {/* Tipo de Feedback */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-3">
              Tipo de Feedback *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FEEDBACK_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={`px-4 py-3 rounded-xl border-2 ${
                      selectedType === type.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{type.icon}</Text>
                      <Text
                        className={`text-sm font-semibold ${
                          selectedType === type.id ? "text-white" : "text-foreground"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Categoria */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-3">
              Categoria *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category.id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={`px-4 py-3 rounded-xl border-2 ${
                      selectedCategory === category.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{category.icon}</Text>
                      <Text
                        className={`text-sm font-semibold ${
                          selectedCategory === category.id ? "text-white" : "text-foreground"
                        }`}
                      >
                        {category.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Título */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Título *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="Ex: Sugestão para melhorar o app"
              placeholderTextColor="#9BA1A6"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text className="text-xs text-muted mt-1">
              {title.length}/100 caracteres
            </Text>
          </View>

          {/* Descrição */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Descrição Detalhada *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="Descreva sua sugestão, problema ou elogio com o máximo de detalhes possível..."
              placeholderTextColor="#9BA1A6"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text className="text-xs text-muted mt-1">
              {description.length}/1000 caracteres
            </Text>
          </View>

          {/* Informações do Usuário */}
          {profile && (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Suas Informações
              </Text>
              <Text className="text-xs text-muted">
                Nome: {profile.name}
              </Text>
              <Text className="text-xs text-muted">
                CPF: {profile.cpf}
              </Text>
              <Text className="text-xs text-muted mt-2">
                Essas informações serão enviadas junto com o feedback para que possamos entrar em contato se necessário.
              </Text>
            </View>
          )}

          {/* Botões */}
          <View className="gap-3">
            <TouchableOpacity
              className={`rounded-xl p-4 ${isSubmitting ? "bg-primary/50" : "bg-primary"}`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text className="text-center font-semibold text-white">
                {isSubmitting ? "Enviando..." : "📤 Enviar Feedback"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface border border-border rounded-xl p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              disabled={isSubmitting}
            >
              <Text className="text-center font-semibold text-foreground">
                ← Cancelar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Aviso */}
          <View className="bg-primary/10 rounded-xl p-4">
            <Text className="text-xs text-foreground leading-relaxed">
              💡 <Text className="font-semibold">Dica:</Text> Quanto mais detalhes você fornecer, mais fácil será para nossa equipe entender e resolver sua solicitação.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
