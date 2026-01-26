import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert as RNAlert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { getAllAlerts, resolveAlert, runAlertCheck, type Alert } from "@/lib/alert-system";

export default function AdminAlertsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const allAlerts = await getAllAlerts();
      
      let filtered = allAlerts;
      if (filter === "active") {
        filtered = allAlerts.filter((a) => !a.resolved);
      } else if (filter === "resolved") {
        filtered = allAlerts.filter((a) => a.resolved);
      }

      // Ordenar por severidade e data
      filtered.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAlerts(filtered);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      const newAlerts = await runAlertCheck();
      
      if (newAlerts.length > 0) {
        RNAlert.alert(
          "✅ Verificação Concluída",
          `${newAlerts.length} novo(s) alerta(s) detectado(s).`
        );
      } else {
        RNAlert.alert(
          "✅ Verificação Concluída",
          "Nenhum novo alerta detectado."
        );
      }
      
      await loadAlerts();
    } catch (error) {
      console.error("Erro ao verificar alertas:", error);
      RNAlert.alert("Erro", "Não foi possível verificar alertas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alert: Alert) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      RNAlert.prompt(
        "Resolver Alerta",
        "Adicione notas sobre a resolução (opcional):",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Resolver",
            onPress: async (notes?: string) => {
              await resolveAlert(alert.id, "Admin SESMT", notes || undefined);
              RNAlert.alert("✅ Resolvido", "Alerta marcado como resolvido.");
              await loadAlerts();
            },
          },
        ],
        "plain-text"
      );
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
      RNAlert.alert("Erro", "Não foi possível resolver o alerta.");
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "#DC2626";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#10B981";
    }
  };

  const getSeverityIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "ℹ️";
      case "low":
        return "✅";
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando alertas...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="p-4 bg-warning">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-white">⚠️ Alertas Críticos</Text>
              <Text className="text-sm text-white/80 mt-1">Sistema de Monitoramento SESMT</Text>
            </View>
            <TouchableOpacity
              className="bg-white/20 rounded-full px-4 py-2"
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">← Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros */}
        <View className="p-4 flex-row gap-2">
          {[
            { id: "active", label: "Ativos", count: alerts.filter((a) => !a.resolved).length },
            { id: "resolved", label: "Resolvidos", count: alerts.filter((a) => a.resolved).length },
            { id: "all", label: "Todos", count: alerts.length },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              className={`flex-1 rounded-lg py-3 px-2 ${filter === f.id ? "bg-warning" : "bg-surface border border-border"}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f.id as typeof filter);
              }}
            >
              <Text className={`text-center font-semibold ${filter === f.id ? "text-white" : "text-foreground"}`}>
                {f.label}
              </Text>
              <Text className={`text-center text-xs mt-1 ${filter === f.id ? "text-white/80" : "text-muted"}`}>
                {f.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ação Rápida */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 flex-row items-center justify-center"
            onPress={handleCheckAlerts}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-center">
              🔍 Verificar Novos Alertas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Alertas */}
        <View className="p-4 gap-3">
          {alerts.length === 0 ? (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-4xl mb-2">✅</Text>
              <Text className="text-lg font-semibold text-foreground">Nenhum alerta</Text>
              <Text className="text-sm text-muted text-center mt-1">
                {filter === "active" ? "Não há alertas ativos no momento." : "Nenhum alerta encontrado."}
              </Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <View
                key={alert.id}
                className="bg-surface rounded-xl p-4 border-l-4"
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              >
                {/* Header do Alerta */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xl">{getSeverityIcon(alert.severity)}</Text>
                      <Text className="text-base font-bold text-foreground flex-1">{alert.title}</Text>
                    </View>
                    <View
                      className="self-start px-2 py-1 rounded"
                      style={{ backgroundColor: `${getSeverityColor(alert.severity)}20` }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: getSeverityColor(alert.severity) }}>
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Descrição */}
                <Text className="text-sm text-foreground mb-3">{alert.description}</Text>

                {/* Funcionários Afetados */}
                <View className="bg-background rounded-lg p-3 mb-3">
                  <Text className="text-xs text-muted mb-1">Funcionários afetados:</Text>
                  <Text className="text-sm text-foreground font-semibold">
                    {alert.affectedEmployees.join(", ")}
                  </Text>
                </View>

                {/* Data */}
                <Text className="text-xs text-muted mb-3">
                  Criado em: {new Date(alert.createdAt).toLocaleString("pt-BR")}
                </Text>

                {/* Status de Resolução */}
                {alert.resolved ? (
                  <View className="bg-success/10 rounded-lg p-3">
                    <Text className="text-sm text-success font-semibold">✅ Resolvido</Text>
                    {alert.resolvedAt && (
                      <Text className="text-xs text-muted mt-1">
                        Em: {new Date(alert.resolvedAt).toLocaleString("pt-BR")}
                      </Text>
                    )}
                    {alert.resolvedBy && (
                      <Text className="text-xs text-muted">Por: {alert.resolvedBy}</Text>
                    )}
                    {alert.notes && (
                      <Text className="text-xs text-foreground mt-2">Notas: {alert.notes}</Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    className="bg-success rounded-lg py-3"
                    onPress={() => handleResolveAlert(alert)}
                  >
                    <Text className="text-white font-semibold text-center">✓ Marcar como Resolvido</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Informações */}
        <View className="p-4">
          <View className="bg-primary/10 border border-primary rounded-xl p-4">
            <Text className="text-base font-semibold text-primary mb-2">ℹ️ Sobre os Alertas</Text>
            <View className="gap-1">
              <Text className="text-sm text-foreground">• Alertas são gerados automaticamente</Text>
              <Text className="text-sm text-foreground">• 3+ funcionários com mesma queixa = alerta</Text>
              <Text className="text-sm text-foreground">• Verificação diária de indicadores de saúde</Text>
              <Text className="text-sm text-foreground">• Notificações push em tempo real</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
