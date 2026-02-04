import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateDashboardPDF, sharePDF } from "@/lib/pdf-generator";

interface DashboardStats {
  totalEmployees: number;
  activeToday: number;
  checkInsToday: number;
  hydrationAverage: number;
  complaintsThisWeek: number;
  challengesActive: number;
  ergonomicsAdherence: number;
  mentalHealthUsage: number;
}

interface EmployeeRecord {
  id: string;
  name: string;
  matricula: string;
  lastCheckIn: string | null;
  hydrationToday: number;
  hydrationGoal: number;
  lastPressure: { systolic: number; diastolic: number } | null;
  complaintsCount: number;
  challengesActive: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeToday: 0,
    checkInsToday: 0,
    hydrationAverage: 0,
    complaintsThisWeek: 0,
    challengesActive: 0,
    ergonomicsAdherence: 0,
    mentalHealthUsage: 0,
  });
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "reports">("overview");

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true);

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

      // Carregar dados com tratamento de erro robusto
      try {
        await loadDashboardData();
      } catch (dataError) {
        console.error("[Dashboard] Erro ao carregar dados, mas não vai crashar:", dataError);
        // Não mostrar alert, apenas logar. Dashboard vai exibir "Nenhum dado disponível"
      }

    } catch (error) {
      console.error("[Dashboard] Erro crítico:", error);
      // Tentar voltar para login se houver erro crítico
      try {
        router.replace("/admin-login");
      } catch (navError) {
        console.error("[Dashboard] Erro ao navegar:", navError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Buscar dados de TODOS os funcionários cadastrados
      const employeesData = await loadAllEmployeesFromStorage();
      setEmployees(employeesData);

      // Calcular estatísticas
      const calculatedStats = calculateStats(employeesData);
      setStats(calculatedStats);

    } catch (error) {
      console.error("[Dashboard] Erro ao carregar dados:", error);
      Alert.alert("Erro", "Erro ao carregar dados dos funcionários.");
    }
  };

  const loadAllEmployeesFromStorage = async (): Promise<EmployeeRecord[]> => {
    try {
      // Buscar lista de IDs de funcionários cadastrados
      const employeeIdsStr = await AsyncStorage.getItem("employee_ids");
      if (!employeeIdsStr) {
        console.log("[Dashboard] Nenhum funcionário cadastrado ainda");
        return [];
      }

      let employeeIds: string[] = [];
      try {
        employeeIds = JSON.parse(employeeIdsStr);
      } catch (parseError) {
        console.error("[Dashboard] Erro ao parsear employee_ids:", parseError);
        return [];
      }
      console.log(`[Dashboard] Encontrados ${employeeIds.length} funcionários cadastrados`);

      const employeesData: EmployeeRecord[] = [];

      for (const empId of employeeIds) {
        try {
          // Buscar dados do funcionário
          const empDataStr = await AsyncStorage.getItem(`employee_${empId}`);
          if (!empDataStr) continue;

          const empData = JSON.parse(empDataStr);

          // Buscar check-ins
          const checkInsStr = await AsyncStorage.getItem(`check_ins_${empId}`);
          const checkIns = checkInsStr ? JSON.parse(checkInsStr) : [];
          const today = new Date().toISOString().split("T")[0];
          const lastCheckIn = checkIns.find((c: any) => c.date === today);

          // Buscar hidratação
          const hydrationStr = await AsyncStorage.getItem(`hydration_${empId}`);
          const hydration = hydrationStr ? JSON.parse(hydrationStr) : { intake: 0, goal: 2000 };

          // Buscar pressão
          const pressureStr = await AsyncStorage.getItem(`pressure_${empId}`);
          const pressureRecords = pressureStr ? JSON.parse(pressureStr) : [];
          const lastPressure = pressureRecords.length > 0 ? pressureRecords[pressureRecords.length - 1] : null;

          // Buscar queixas
          const complaintsStr = await AsyncStorage.getItem(`complaints_${empId}`);
          const complaints = complaintsStr ? JSON.parse(complaintsStr) : [];

          // Buscar desafios
          const challengesStr = await AsyncStorage.getItem(`challenges_${empId}`);
          const challenges = challengesStr ? JSON.parse(challengesStr) : [];
          const activeChallenges = challenges.filter((c: any) => c.status === "active");

          employeesData.push({
            id: empId,
            name: empData.name || "Sem nome",
            matricula: empData.matricula || "Sem matrícula",
            lastCheckIn: lastCheckIn ? lastCheckIn.status : null,
            hydrationToday: hydration.intake || 0,
            hydrationGoal: hydration.goal || 2000,
            lastPressure: lastPressure ? { systolic: lastPressure.systolic, diastolic: lastPressure.diastolic } : null,
            complaintsCount: complaints.length,
            challengesActive: activeChallenges.length,
          });

        } catch (error) {
          console.error(`[Dashboard] Erro ao carregar dados do funcionário ${empId}:`, error);
        }
      }

      return employeesData;

    } catch (error) {
      console.error("[Dashboard] Erro ao buscar funcionários:", error);
      return [];
    }
  };

  const calculateStats = (employeesData: EmployeeRecord[]): DashboardStats => {
    const totalEmployees = employeesData.length;
    const activeToday = employeesData.filter(e => e.lastCheckIn !== null).length;
    const checkInsToday = activeToday;
    const hydrationAverage = totalEmployees > 0
      ? Math.round(employeesData.reduce((sum, e) => sum + (e.hydrationToday / e.hydrationGoal * 100), 0) / totalEmployees)
      : 0;
    const complaintsThisWeek = employeesData.reduce((sum, e) => sum + e.complaintsCount, 0);
    const challengesActive = employeesData.reduce((sum, e) => sum + e.challengesActive, 0);

    return {
      totalEmployees,
      activeToday,
      checkInsToday,
      hydrationAverage,
      complaintsThisWeek,
      challengesActive,
      ergonomicsAdherence: 0, // TODO: Implementar
      mentalHealthUsage: 0, // TODO: Implementar
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
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

      const pdfUri = await generateDashboardPDF(stats, employees, period);
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

      const pdfUri = await generateDashboardPDF(stats, employees, period);
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Dashboard Admin</Text>
              <Text className="text-sm text-muted mt-1">{email}</Text>
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
                    <Text className="text-foreground text-3xl font-bold mt-1">{stats.hydrationAverage}%</Text>
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
                        Hidratação: {emp.hydrationToday}ml / {emp.hydrationGoal}ml (
                        {Math.round((emp.hydrationToday / emp.hydrationGoal) * 100)}%)
                      </Text>
                      {emp.lastPressure && (
                        <Text className="text-muted text-sm">
                          Pressão: {emp.lastPressure.systolic}/{emp.lastPressure.diastolic} mmHg
                        </Text>
                      )}
                      <Text className="text-muted text-sm">Queixas: {emp.complaintsCount}</Text>
                      <Text className="text-muted text-sm">Desafios ativos: {emp.challengesActive}</Text>
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
                  <Text className="text-white font-semibold text-center">Exportar PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendEmail}
                  className="bg-primary p-4 rounded-lg"
                  style={{ opacity: 0.9 }}
                >
                  <Text className="text-white font-semibold text-center">Enviar por Email</Text>
                </TouchableOpacity>

                <View className="bg-surface p-4 rounded-lg">
                  <Text className="text-muted text-sm text-center">
                    Funcionalidades de relatório em desenvolvimento
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
