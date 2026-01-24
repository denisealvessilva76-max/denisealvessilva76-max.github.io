import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function AdminStatsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = trpc.admin.dashboardStats.useQuery(undefined, {
    refetchOnMount: true,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !stats) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando estatísticas...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Dashboard Admin</Text>
          <Text className="text-muted mt-1">Estatísticas gerais da equipe</Text>
        </View>

        {/* Check-ins */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">📋 Check-ins</Text>
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats?.checkIns.today || 0}</Text>
              <Text className="text-sm text-muted">Hoje</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats?.checkIns.week || 0}</Text>
              <Text className="text-sm text-muted">Esta semana</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats?.checkIns.month || 0}</Text>
              <Text className="text-sm text-muted">Este mês</Text>
            </View>
          </View>
        </View>

        {/* Hidratação */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">💧 Hidratação</Text>
          <Text className="text-2xl font-bold text-foreground">{stats?.hydration.averageWeekly || 0} ml</Text>
          <Text className="text-sm text-muted">Média diária da equipe (últimos 7 dias)</Text>
        </View>

        {/* Alertas de Pressão */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">⚠️ Alertas de Pressão</Text>
          <Text className="text-2xl font-bold text-error">{stats?.pressureAlerts.count || 0}</Text>
          <Text className="text-sm text-muted mb-3">Usuários com pressão elevada (≥140/90)</Text>

          {stats?.pressureAlerts.recent && stats.pressureAlerts.recent.length > 0 && (
            <View className="mt-2 pt-3 border-t border-border">
              <Text className="text-sm font-semibold text-foreground mb-2">Últimos alertas:</Text>
              {stats.pressureAlerts.recent.map((alert, index) => (
                <View key={index} className="flex-row justify-between py-1">
                  <Text className="text-sm text-muted">Usuário #{alert.userId}</Text>
                  <Text className="text-sm text-error font-semibold">
                    {alert.systolic}/{alert.diastolic}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Queixas Pendentes */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">🩺 Queixas Pendentes</Text>
          <Text className="text-2xl font-bold text-warning">{stats?.complaints.pending || 0}</Text>
          <Text className="text-sm text-muted">Aguardando resposta</Text>
        </View>

        {/* Desafios */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">🏆 Desafios</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl font-bold text-success">{stats?.challenges.completionRate || 0}%</Text>
            <Text className="text-sm text-muted ml-2">Taxa de conclusão</Text>
          </View>
          <Text className="text-sm text-muted">
            {stats?.challenges.completed || 0} de {stats?.challenges.total || 0} completados
          </Text>
        </View>

        {/* Ranking */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">🥇 Ranking (Top 10)</Text>
          {stats?.ranking && stats.ranking.length > 0 ? (
            stats.ranking.map((user) => (
              <View key={user.userId} className="flex-row items-center justify-between py-2 border-b border-border">
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor:
                        user.position === 1 ? "#FFD700" : user.position === 2 ? "#C0C0C0" : user.position === 3 ? "#CD7F32" : colors.surface,
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: user.position <= 3 ? "#000" : colors.foreground }}>
                      {user.position}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-foreground">Usuário #{user.userId}</Text>
                    <Text className="text-xs text-muted">Sequência: {user.streak} dias</Text>
                  </View>
                </View>
                <Text className="text-base font-bold text-primary">{user.points} pts</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-muted">Nenhum dado disponível</Text>
          )}
        </View>

        {/* Botão de Enviar Notificações */}
        <TouchableOpacity
          onPress={() => router.push("/admin-send-notification")}
          className="bg-primary rounded-xl p-4 items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background font-semibold text-base">📬 Enviar Notificações</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
