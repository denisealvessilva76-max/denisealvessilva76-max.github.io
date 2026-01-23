import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { useRewards } from "@/hooks/use-rewards";
import { Reward, RewardCategory, RewardStatus } from "@/lib/rewards-types";

export default function AdminCatalogoPremiosScreen() {
  const router = useRouter();
  const colors = useColors();
  const { rewards, addReward, updateReward, deleteReward, adjustStock, resetCatalog, loadRewards } = useRewards(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<Reward, "id">>({
    title: "",
    description: "",
    category: "vale-compras",
    pointsCost: 0,
    icon: "🎁",
    status: "disponivel",
    stock: -1,
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const handleOpenModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description,
        category: reward.category,
        pointsCost: reward.pointsCost,
        icon: reward.icon,
        status: reward.status,
        stock: reward.stock,
      });
    } else {
      setEditingReward(null);
      setFormData({
        title: "",
        description: "",
        category: "vale-compras",
        pointsCost: 0,
        icon: "🎁",
        status: "disponivel",
        stock: -1,
      });
    }
    setIsModalOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReward(null);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || formData.pointsCost <= 0) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    let result;

    if (editingReward) {
      result = await updateReward(editingReward.id, formData);
    } else {
      result = await addReward(formData);
    }

    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso!", result.message);
      handleCloseModal();
      await loadRewards();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", result.message);
    }
  };

  const handleDelete = (reward: Reward) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir "${reward.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const result = await deleteReward(reward.id);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Sucesso!", result.message);
              await loadRewards();
            } else {
              Alert.alert("Erro", result.message);
            }
          },
        },
      ]
    );
  };

  const handleAdjustStock = (reward: Reward) => {
    Alert.prompt(
      "Ajustar Estoque",
      `Estoque atual: ${reward.stock === -1 ? "Ilimitado" : reward.stock}\n\nDigite o novo estoque (-1 para ilimitado):`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (value?: string) => {
            const newStock = parseInt(value || "0", 10);
            if (isNaN(newStock)) {
              Alert.alert("Erro", "Valor inválido");
              return;
            }
            const result = await adjustStock(reward.id, newStock);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Sucesso!", result.message);
              await loadRewards();
            } else {
              Alert.alert("Erro", result.message);
            }
          },
        },
      ],
      "plain-text",
      reward.stock.toString()
    );
  };

  const handleResetCatalog = () => {
    Alert.alert(
      "Restaurar Catálogo Padrão",
      "Deseja restaurar o catálogo para os prêmios padrão? Todos os prêmios personalizados serão removidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            const result = await resetCatalog();
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Sucesso!", result.message);
              await loadRewards();
            } else {
              Alert.alert("Erro", result.message);
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: RewardCategory) => {
    const colorMap = {
      "vale-compras": colors.primary,
      "brindes": "#EC4899",
      "beneficios": "#10B981",
      "reconhecimento": "#F59E0B",
    };
    return colorMap[category];
  };

  const getCategoryLabel = (category: RewardCategory) => {
    const labelMap = {
      "vale-compras": "Vale-Compras",
      "brindes": "Brindes",
      "beneficios": "Benefícios",
      "reconhecimento": "Reconhecimento",
    };
    return labelMap[category];
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">🎁 Catálogo de Prêmios</Text>
              <Text className="text-base text-muted">Gerenciar recompensas disponíveis</Text>
            </View>
          </View>

          {/* Estatísticas */}
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-foreground">{rewards.length}</Text>
              <Text className="text-xs text-muted text-center">Total de Prêmios</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-success">
                {rewards.filter((r) => r.status === "disponivel").length}
              </Text>
              <Text className="text-xs text-muted text-center">Disponíveis</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-error">
                {rewards.filter((r) => r.status === "esgotado").length}
              </Text>
              <Text className="text-xs text-muted text-center">Esgotados</Text>
            </Card>
          </View>

          {/* Botões de Ação */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleOpenModal()}
              className="flex-1 bg-primary rounded-lg py-3 active:opacity-80"
            >
              <Text className="text-center text-background font-semibold">➕ Adicionar Prêmio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleResetCatalog}
              className="flex-1 bg-surface border border-border rounded-lg py-3 active:opacity-80"
            >
              <Text className="text-center text-foreground font-semibold">🔄 Restaurar Padrão</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Prêmios */}
          {rewards.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Prêmios Cadastrados</Text>
              {rewards.map((reward) => (
                <Card key={reward.id} className="gap-3">
                  <View className="flex-row items-start gap-4">
                    {/* Ícone */}
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: getCategoryColor(reward.category) + "20" }}
                    >
                      <Text className="text-3xl">{reward.icon}</Text>
                    </View>

                    {/* Informações */}
                    <View className="flex-1 gap-2">
                      <Text className="text-base font-bold text-foreground">{reward.title}</Text>
                      <Text className="text-sm text-muted" numberOfLines={2}>
                        {reward.description}
                      </Text>

                      <View className="flex-row items-center gap-3 flex-wrap">
                        <View
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: getCategoryColor(reward.category) + "20" }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: getCategoryColor(reward.category) }}
                          >
                            {getCategoryLabel(reward.category).toUpperCase()}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm font-bold text-primary">{reward.pointsCost}</Text>
                          <Text className="text-xs text-muted">pts</Text>
                        </View>

                        <Text className="text-xs text-muted">
                          Estoque: {reward.stock === -1 ? "Ilimitado" : reward.stock}
                        </Text>

                        <View
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor:
                              reward.status === "disponivel"
                                ? colors.success + "20"
                                : colors.error + "20",
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: reward.status === "disponivel" ? colors.success : colors.error,
                            }}
                          >
                            {reward.status === "disponivel" ? "DISPONÍVEL" : "ESGOTADO"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Ações */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleOpenModal(reward)}
                      className="flex-1 bg-primary rounded-lg py-2 active:opacity-80"
                    >
                      <Text className="text-center text-background font-semibold text-sm">
                        ✏️ Editar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAdjustStock(reward)}
                      className="flex-1 bg-warning rounded-lg py-2 active:opacity-80"
                    >
                      <Text className="text-center text-background font-semibold text-sm">
                        📦 Estoque
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(reward)}
                      className="flex-1 bg-error rounded-lg py-2 active:opacity-80"
                    >
                      <Text className="text-center text-background font-semibold text-sm">
                        🗑️ Excluir
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card className="items-center py-12 gap-3">
              <Text className="text-6xl">🎁</Text>
              <Text className="text-lg font-semibold text-foreground">Nenhum prêmio cadastrado</Text>
              <Text className="text-sm text-muted text-center px-4">
                Adicione prêmios ao catálogo para que os trabalhadores possam resgatar
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Modal de Adição/Edição */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "90%" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4">
                <Text className="text-2xl font-bold text-foreground">
                  {editingReward ? "Editar Prêmio" : "Adicionar Prêmio"}
                </Text>

                {/* Título */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">Título *</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Ex: Vale-Compras R$ 50"
                    placeholderTextColor={colors.muted}
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                  />
                </View>

                {/* Descrição */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">Descrição *</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Descreva o prêmio"
                    placeholderTextColor={colors.muted}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Categoria */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">Categoria *</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["vale-compras", "brindes", "beneficios", "reconhecimento"] as RewardCategory[]).map(
                      (cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setFormData({ ...formData, category: cat })}
                          className={`px-4 py-2 rounded-lg ${
                            formData.category === cat ? "bg-primary" : "bg-surface"
                          }`}
                          style={{
                            borderWidth: formData.category === cat ? 0 : 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Text
                            className={`font-semibold text-sm ${
                              formData.category === cat ? "text-background" : "text-foreground"
                            }`}
                          >
                            {getCategoryLabel(cat)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Pontos */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">Custo em Pontos *</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Ex: 500"
                    placeholderTextColor={colors.muted}
                    value={formData.pointsCost.toString()}
                    onChangeText={(text) =>
                      setFormData({ ...formData, pointsCost: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>

                {/* Ícone */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">Ícone (Emoji)</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-2xl"
                    placeholder="🎁"
                    placeholderTextColor={colors.muted}
                    value={formData.icon}
                    onChangeText={(text) => setFormData({ ...formData, icon: text })}
                    maxLength={2}
                  />
                </View>

                {/* Estoque */}
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">
                    Estoque (-1 para ilimitado)
                  </Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="-1"
                    placeholderTextColor={colors.muted}
                    value={formData.stock.toString()}
                    onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || -1 })}
                    keyboardType="numeric"
                  />
                </View>

                {/* Botões */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    className="flex-1 bg-surface border border-border rounded-lg py-3 active:opacity-80"
                  >
                    <Text className="text-center text-foreground font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading}
                    className="flex-1 bg-success rounded-lg py-3 active:opacity-80"
                    style={{ opacity: isLoading ? 0.5 : 1 }}
                  >
                    <Text className="text-center text-background font-semibold">
                      {isLoading ? "Salvando..." : "Salvar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
