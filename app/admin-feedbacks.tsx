import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Feedback,
  FeedbackType,
  FeedbackStatus,
  FEEDBACK_TYPES,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/feedback-types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://3000-i84jlsmq8t12oldkdpl95-0fe92ffe.us2.manus.computer";

export default function AdminFeedbacksScreen() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("admin_token");
      if (!token) {
        Alert.alert("Acesso Negado", "Você precisa fazer login como administrador");
        router.replace("/admin-login");
        return;
      }
      loadFeedbacks();
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.replace("/admin-login");
    }
  };

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterType !== "all") params.type = filterType;
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await axios.get(`${API_URL}/api/feedback`, { params });
      
      if (response.data.success) {
        setFeedbacks(response.data.feedbacks);
      }
    } catch (error) {
      console.error("Erro ao carregar feedbacks:", error);
      Alert.alert("Erro", "Não foi possível carregar os feedbacks");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const response = await axios.patch(`${API_URL}/api/feedback/${feedbackId}`, {
        status: newStatus,
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadFeedbacks();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Alert.alert("Erro", "Não foi possível atualizar o status");
    }
  };

  const getTypeInfo = (type: FeedbackType) => {
    return FEEDBACK_TYPES.find((t) => t.id === type) || FEEDBACK_TYPES[3];
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case "pendente":
        return "bg-warning/20 text-warning";
      case "em_analise":
        return "bg-primary/20 text-primary";
      case "resolvido":
        return "bg-success/20 text-success";
      case "arquivado":
        return "bg-muted/20 text-muted";
      default:
        return "bg-muted/20 text-muted";
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadFeedbacks} />
        }
      >
        {/* Header */}
        <View className="p-6 bg-primary">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mb-3"
          >
            <Text className="text-white">← Voltar ao Dashboard</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white mb-1">💬 Feedbacks dos Usuários</Text>
          <Text className="text-sm text-white/80">
            Total: {filteredFeedbacks.length} feedback(s)
          </Text>
        </View>

        <View className="p-6 gap-4">
          {/* Filtros */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Filtros</Text>
            
            {/* Filtro por Tipo */}
            <Text className="text-xs text-muted mb-2">Tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setFilterType("all")}
                  className={`px-3 py-2 rounded-lg ${
                    filterType === "all" ? "bg-primary" : "bg-background"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${
                    filterType === "all" ? "text-white" : "text-foreground"
                  }`}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {FEEDBACK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setFilterType(type.id)}
                    className={`px-3 py-2 rounded-lg ${
                      filterType === type.id ? "bg-primary" : "bg-background"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      filterType === type.id ? "text-white" : "text-foreground"
                    }`}>
                      {type.icon} {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Filtro por Status */}
            <Text className="text-xs text-muted mb-2">Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setFilterStatus("all")}
                  className={`px-3 py-2 rounded-lg ${
                    filterStatus === "all" ? "bg-primary" : "bg-background"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${
                    filterStatus === "all" ? "text-white" : "text-foreground"
                  }`}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {(["pendente", "em_analise", "resolvido", "arquivado"] as FeedbackStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg ${
                      filterStatus === status ? "bg-primary" : "bg-background"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      filterStatus === status ? "text-white" : "text-foreground"
                    }`}>
                      {FEEDBACK_STATUS_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Lista de Feedbacks */}
          {filteredFeedbacks.length === 0 ? (
            <View className="bg-surface rounded-xl p-8 border border-border items-center">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-base font-semibold text-foreground mb-1">
                Nenhum feedback encontrado
              </Text>
              <Text className="text-sm text-muted text-center">
                Não há feedbacks com os filtros selecionados
              </Text>
            </View>
          ) : (
            filteredFeedbacks.map((feedback) => {
              const typeInfo = getTypeInfo(feedback.type);
              return (
                <View key={feedback.id} className="bg-surface rounded-xl p-4 border border-border">
                  {/* Header do Card */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-lg">{typeInfo.icon}</Text>
                        <Text className="text-base font-bold text-foreground flex-1">
                          {feedback.title}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted">
                        {feedback.userName} • {new Date(feedback.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${getStatusColor(feedback.status)}`}>
                      <Text className="text-xs font-semibold">
                        {FEEDBACK_STATUS_LABELS[feedback.status]}
                      </Text>
                    </View>
                  </View>

                  {/* Descrição */}
                  <Text className="text-sm text-foreground mb-3 leading-relaxed">
                    {feedback.description}
                  </Text>

                  {/* Categoria */}
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="bg-background px-2 py-1 rounded">
                      <Text className="text-xs text-muted">
                        Categoria: {feedback.category}
                      </Text>
                    </View>
                    <View className="bg-background px-2 py-1 rounded">
                      <Text className="text-xs text-muted">
                        CPF: {feedback.userCpf}
                      </Text>
                    </View>
                  </View>

                  {/* Ações */}
                  {feedback.status !== "resolvido" && (
                    <View className="flex-row gap-2">
                      {feedback.status === "pendente" && (
                        <TouchableOpacity
                          onPress={() => updateFeedbackStatus(feedback.id, "em_analise")}
                          className="flex-1 bg-primary rounded-lg py-2"
                        >
                          <Text className="text-xs font-semibold text-white text-center">
                            Analisar
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => updateFeedbackStatus(feedback.id, "resolvido")}
                        className="flex-1 bg-success rounded-lg py-2"
                      >
                        <Text className="text-xs font-semibold text-white text-center">
                          ✓ Resolver
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
