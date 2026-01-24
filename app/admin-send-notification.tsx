import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

type TargetType = "user" | "group";
type TargetGroup = "all" | "high_pressure" | "pending_complaints" | "inactive";
type Template = "exam_reminder" | "appointment" | "safety_alert" | "custom";

export default function AdminSendNotificationScreen() {
  const colors = useColors();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await SecureStore.getItemAsync("admin_authenticated");
      if (authenticated === "true") {
        setIsAuthenticated(true);
      } else {
        router.replace("/admin-login");
      }
    } catch (error) {
      router.replace("/admin-login");
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Verificando acesso...</Text>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const [targetType, setTargetType] = useState<TargetType>("group");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [template, setTemplate] = useState<Template>("custom");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sendNotification = trpc.admin.sendNotification.useMutation();

  const handleSend = async () => {
    // Validação
    if (targetType === "user" && !targetUserId) {
      Alert.alert("Erro", "Digite o ID do usuário");
      return;
    }

    if (!title || !body) {
      Alert.alert("Erro", "Preencha o título e a mensagem");
      return;
    }

    try {
      const result = await sendNotification.mutateAsync({
        targetUserId: targetType === "user" ? parseInt(targetUserId) : undefined,
        targetGroup: targetType === "group" ? targetGroup : undefined,
        title,
        body,
        template,
      });

      Alert.alert("Sucesso!", `Notificações enviadas para ${result.sent} usuário(s)`, [
        {
          text: "OK",
          onPress: () => {
            // Limpar formulário
            setTitle("");
            setBody("");
            setTargetUserId("");
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar notificações. Tente novamente.");
    }
  };

  const groupDescriptions: Record<TargetGroup, string> = {
    all: "Todos os usuários",
    high_pressure: "Usuários com pressão elevada (≥140/90)",
    pending_complaints: "Usuários com queixas pendentes",
    inactive: "Usuários sem check-in nos últimos 7 dias",
  };

  const templateTitles: Record<Template, string> = {
    exam_reminder: "👨‍⚕️ Lembrete de Exame",
    appointment: "📅 Consulta Agendada",
    safety_alert: "⚠️ Alerta de Segurança",
    custom: "Personalizado",
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Enviar Notificações</Text>
          <Text className="text-muted mt-1">Envie alertas para usuários ou grupos</Text>
        </View>

        {/* Tipo de Destino */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Enviar para:</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setTargetType("group")}
              className="flex-1 rounded-xl p-3 border"
              style={{
                backgroundColor: targetType === "group" ? colors.primary : colors.surface,
                borderColor: targetType === "group" ? colors.primary : colors.border,
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: targetType === "group" ? colors.background : colors.foreground }}
              >
                Grupo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTargetType("user")}
              className="flex-1 rounded-xl p-3 border"
              style={{
                backgroundColor: targetType === "user" ? colors.primary : colors.surface,
                borderColor: targetType === "user" ? colors.primary : colors.border,
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: targetType === "user" ? colors.background : colors.foreground }}
              >
                Usuário Específico
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seleção de Grupo ou ID */}
        {targetType === "group" ? (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">Selecione o grupo:</Text>
            {(["all", "high_pressure", "pending_complaints", "inactive"] as TargetGroup[]).map((group) => (
              <TouchableOpacity
                key={group}
                onPress={() => setTargetGroup(group)}
                className="rounded-xl p-3 mb-2 border"
                style={{
                  backgroundColor: targetGroup === group ? colors.primary + "20" : colors.surface,
                  borderColor: targetGroup === group ? colors.primary : colors.border,
                }}
              >
                <Text className="text-foreground font-semibold">{groupDescriptions[group]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">ID do usuário:</Text>
            <TextInput
              value={targetUserId}
              onChangeText={setTargetUserId}
              placeholder="Digite o ID (ex: 123)"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-xl p-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
        )}

        {/* Template */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Template:</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["exam_reminder", "appointment", "safety_alert", "custom"] as Template[]).map((tmpl) => (
              <TouchableOpacity
                key={tmpl}
                onPress={() => setTemplate(tmpl)}
                className="rounded-xl px-4 py-2 border"
                style={{
                  backgroundColor: template === tmpl ? colors.primary : colors.surface,
                  borderColor: template === tmpl ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: template === tmpl ? colors.background : colors.foreground }}
                >
                  {templateTitles[tmpl]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Título */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Título:</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Digite o título da notificação"
            maxLength={100}
            className="bg-surface border border-border rounded-xl p-3 text-foreground"
            placeholderTextColor={colors.muted}
          />
          <Text className="text-xs text-muted mt-1">{title.length}/100 caracteres</Text>
        </View>

        {/* Mensagem */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">Mensagem:</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Digite a mensagem da notificação"
            maxLength={500}
            multiline
            numberOfLines={4}
            className="bg-surface border border-border rounded-xl p-3 text-foreground"
            placeholderTextColor={colors.muted}
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
          <Text className="text-xs text-muted mt-1">{body.length}/500 caracteres</Text>
        </View>

        {/* Botão de Enviar */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={sendNotification.isPending}
          className="bg-primary rounded-xl p-4 items-center"
          style={{
            backgroundColor: sendNotification.isPending ? colors.muted : colors.primary,
            opacity: sendNotification.isPending ? 0.6 : 1,
          }}
        >
          {sendNotification.isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text className="text-background font-semibold text-base">📤 Enviar Notificação</Text>
          )}
        </TouchableOpacity>

        {/* Aviso */}
        <View className="mt-4 bg-warning/10 rounded-xl p-3 border border-warning">
          <Text className="text-warning text-sm">
            ⚠️ <Text className="font-semibold">Atenção:</Text> As notificações serão enviadas imediatamente para os usuários
            selecionados. Verifique cuidadosamente antes de enviar.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
