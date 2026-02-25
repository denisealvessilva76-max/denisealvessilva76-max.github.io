import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateDashboardPDF, sharePDF } from "@/lib/pdf-generator";
import { useFirebaseAdmin } from "@/hooks/use-firebase-admin";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "reports">("overview");
  
  // Buscar dados do Firebase em tempo real
  const { stats, employees, isLoading, error, refresh } = useFirebaseAdmin();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Verificar autenticação admin
      const isAuth = await AsyncStorage.getItem("admin_authenticated");
      if (isAuth !== "true") {
        console.log("[Dashboard] Não autenticado, redirecionando para login");
        router.replace("/admin-login");
        return;
      }

      // Carregar email do admin
      const storedEmail = await AsyncStorage.getItem("admin_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }

      console.log("[Dashboard] Autenticado, dados sendo carregados do Firebase");
    } catch (error) {
      console.error("[Dashboard] Erro crítico:", error);
      try {
        router.replace("/admin-login");
      } catch (navError) {
        console.error("[Dashboard] Erro ao navegar:", navError);
      }
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("admin_authenticated");
      await AsyncStorage.removeItem("admin_email");
      router.replace("/admin-login");
    } catch (error) {
      console.error("[Dashboard] Erro ao fazer logout:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("Gerando PDF", "Por favor, aguarde...");

      // Converter dados do Firebase para formato esperado pelo PDF
      const pdfEmployees = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        matricula: emp.matricula,
        lastCheckIn: emp.lastCheckIn,
        hydrationToday: emp.hydrationToday,
        hydrationGoal: emp.hydrationGoal,
        lastPressure: emp.lastPressure,
        complaintsCount: emp.complaintsCount,
        challengesActive: emp.challengesActive,
      }));

      const pdfUri = await generateDashboardPDF(stats, pdfEmployees, period);
      if (!pdfUri) {
        Alert.alert("Erro", "Não foi possível gerar o PDF");
        return;
      }

      Alert.alert(
        "PDF Gerado",
        "O relatório foi gerado com sucesso. Deseja compartilhar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Compartilhar",
            onPress: async () => {
              try {
                await sharePDF(pdfUri);
              } catch (error) {
                Alert.alert("Erro", "Não foi possível compartilhar o PDF");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Dashboard] Erro ao exportar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    }
  };

  const handleSendEmail = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("Gerando PDF", "Por favor, aguarde...");

      // Converter dados do Firebase para formato esperado pelo PDF
      const pdfEmployees = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        matricula: emp.matricula,
        lastCheckIn: emp.lastCheckIn,
        hydrationToday: emp.hydrationToday,
        hydrationGoal: emp.hydrationGoal,
        lastPressure: emp.lastPressure,
        complaintsCount: emp.complaintsCount,
        challengesActive: emp.challengesActive,
      }));

      const pdfUri = await generateDashboardPDF(stats, pdfEmployees, period);
      if (!pdfUri) {
        Alert.alert("Erro", "Não foi possível gerar o PDF");
        return;
      }

      // Compartilhar diretamente (usuário pode escolher email)
      await sharePDF(pdfUri);
    } catch (error) {
      console.error("[Dashboard] Erro ao enviar email:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Carregando dashboard...</Text>
        <Text className="text-muted text-sm mt-2">Conectando ao Firebase...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text className="text-error text-lg font-bold mb-2">Erro ao carregar dados</Text>
        <Text className="text-muted text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Tentar Novamente</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Dashboard Admin</Text>
              <Text className="text-sm text-muted mt-1">{email}</Text>
              <Text className="text-xs text-success mt-1">🔥 Tempo Real (Firebase)</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-error px-4 py-2 rounded-lg"
              style={{ opacity: 0.9 }}
            >
              <Text className="text-white font-semibold">Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row p-2 border-b" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("overview");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-1 py-3 rounded-lg mx-1"
            style={{ backgroundColor: activeTab === "overview" ? colors.primary : colors.surface }}
          >
            <Text
              className="text-center font-semibold"
              style={{ color: activeTab === "overview" ? "#fff" : colors.foreground }}
            >
              Visão Geral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab("employees");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-1 py-3 rounded-lg mx-1"
            style={{ backgroundColor: activeTab === "employees" ? colors.primary : colors.surface }}
          >
            <Text
              className="text-center font-semibold"
              style={{ color: activeTab === "employees" ? "#fff" : colors.foreground }}
            >
              Funcionários
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab("reports");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-1 py-3 rounded-lg mx-1"
            style={{ backgroundColor: activeTab === "reports" ? colors.primary : colors.surface }}
          >
            <Text
              className="text-center font-semibold"
              style={{ color: activeTab === "reports" ? "#fff" : colors.foreground }}
            >
              Relatórios
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="p-4">
          {activeTab === "overview" && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">Estatísticas Gerais</Text>

              {/* Cards de estatísticas */}
              <View className="flex-row flex-wrap">
                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Total de Funcionários</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.totalEmployees}</Text>
                  </View>
                </View>

                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Ativos Hoje</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.activeToday}</Text>
                  </View>
                </View>

                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Check-ins Hoje</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.checkInsToday}</Text>
                  </View>
                </View>

                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Hidratação Média</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.hydrationAverage}ml</Text>
                  </View>
                </View>

                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Queixas (Semana)</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.complaintsThisWeek}</Text>
                  </View>
                </View>

                <View className="w-1/2 p-2">
                  <View className="bg-surface p-4 rounded-lg">
                    <Text className="text-muted text-sm">Desafios Ativos</Text>
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.challengesActive}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "employees" && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">
                Lista de Funcionários ({employees.length})
              </Text>

              {employees.length === 0 ? (
                <View className="bg-surface p-6 rounded-lg items-center">
                  <Text className="text-muted text-center">
                    Nenhum funcionário cadastrado ainda.{"\n"}
                    Os funcionários aparecerão aqui após se cadastrarem no app.
                  </Text>
                </View>
              ) : (
                employees.map((emp) => (
                  <View key={emp.id} className="bg-surface p-4 rounded-lg mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-bold text-lg">{emp.name}</Text>
                        <Text className="text-muted text-sm">Matrícula: {emp.matricula}</Text>
                        {emp.position && (
                          <Text className="text-muted text-xs">Cargo: {emp.position}</Text>
                        )}
                        {emp.turno && (
                          <Text className="text-muted text-xs">Turno: {emp.turno}</Text>
                        )}
                      </View>
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: emp.lastCheckIn ? colors.success : colors.error,
                          opacity: 0.2,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: emp.lastCheckIn ? colors.success : colors.error }}
                        >
                          {emp.lastCheckIn ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-2 space-y-1">
                      <Text className="text-muted text-sm">
                        💧 Hidratação: {emp.hydrationToday}ml / {emp.hydrationGoal}ml (
                        {Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}%)
                      </Text>
                      {emp.lastPressure && (
                        <Text className="text-muted text-sm">
                          ❤️ Pressão: {emp.lastPressure.systolic}/{emp.lastPressure.diastolic} mmHg
                        </Text>
                      )}
                      <Text className="text-muted text-sm">⚠️ Queixas: {emp.complaintsCount}</Text>
                      <Text className="text-muted text-sm">🎯 Desafios ativos: {emp.challengesActive}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "reports" && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">Relatórios</Text>

              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleExportPDF}
                  className="bg-primary p-4 rounded-lg"
                  style={{ opacity: 0.9 }}
                >
                  <Text className="text-white font-semibold text-center">📄 Exportar PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendEmail}
                  className="bg-primary p-4 rounded-lg"
                  style={{ opacity: 0.9 }}
                >
                  <Text className="text-white font-semibold text-center">📧 Enviar por Email</Text>
                </TouchableOpacity>

                <View className="bg-surface p-4 rounded-lg">
                  <Text className="text-muted text-sm text-center">
                    Relatórios baseados em dados do Firebase em tempo real
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
