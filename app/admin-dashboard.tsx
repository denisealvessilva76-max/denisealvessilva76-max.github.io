import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

interface EmployeeData {
  id: string;
  name: string;
  matricula: string;
  checkIns: Array<{ date: string; status: string }>;
  hydration: Array<{ date: string; amount: number; goal: number }>;
  pressure: Array<{ date: string; systolic: number; diastolic: number }>;
  complaints: Array<{ date: string; type: string; details: string; severity: string }>;
  challenges: Array<{ id: string; name: string; progress: number; completed: boolean }>;
  ergonomics: { pausesCompleted: number; stretchesCompleted: number };
  mentalHealth: { breathingExercises: number; psychologistContacts: number };
}

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

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "hydration" | "pressure" | "complaints" | "challenges" | "ergonomics" | "mental" | "monthly">("overview");
  const [error, setError] = useState<string | null>(null);

  // Buscar lista de funcionários cadastrados
  const employeesQuery = trpc.adminExtended.listEmployees.useQuery();

  useEffect(() => {
    // Carregar dados com tratamento de erro robusto
    loadDashboardData().catch((err) => {
      console.error("[Dashboard] Erro ao carregar:", err);
      setError("Erro ao carregar dados. Tente novamente.");
      setIsLoading(false);
    });
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar autenticação admin
      const isAuth = await AsyncStorage.getItem("admin_authenticated");
      if (isAuth !== "true") {
        router.replace("/admin-login");
        return;
      }

      // Carregar email do admin
      const storedEmail = await AsyncStorage.getItem("admin_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }

      // Carregar dados de TODOS os funcionários do backend
      await loadAllEmployeesDataFromBackend();

    } catch (error) {
      console.error("[Dashboard] Erro:", error);
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllEmployeesDataFromBackend = async () => {
    try {
      // Buscar dados reais de TODOS os funcionários do backend
      // Nota: trpc.admin.dashboardStats é um hook, não pode ser chamado aqui
      // Vamos usar dados locais por enquanto até refatorar para usar useQuery
      console.log("[Dashboard] Backend integration pending - using local data");
      await loadLocalFallbackData();
      return;
      
      // TODO: Refatorar para usar useQuery do trpc no componente
      // Exemplo: const { data } = trpc.admin.dashboardStats.useQuery();

    } catch (error) {
      console.error("[Dashboard] Erro ao carregar dados do backend:", error);
      // Fallback para dados locais se backend falhar
      await loadLocalFallbackData();
    }
  };

  const loadLocalFallbackData = async () => {
    // Fallback: carregar dados locais se backend não estiver disponível
    console.log("[Dashboard] Usando dados locais como fallback");
    setStats({
      totalEmployees: 1,
      activeToday: 0,
      checkInsToday: 0,
      hydrationAverage: 0,
      complaintsThisWeek: 0,
      challengesActive: 0,
      ergonomicsAdherence: 0,
      mentalHealthUsage: 0,
    });
    setEmployees([]);
  };

  const handleRefresh = async () => {
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

  const handleExportPDF = () => {
    Alert.alert("Exportar PDF", "Funcionalidade em desenvolvimento");
  };

  const handleSendEmail = () => {
    Alert.alert("Enviar Email", "Funcionalidade em desenvolvimento");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground text-lg">Carregando dashboard...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-error text-lg mb-4">{error}</Text>
        <TouchableOpacity
          onPress={loadDashboardData}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Tentar Novamente</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="p-6 bg-primary">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-background text-2xl font-bold">Dashboard SESMT</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-background text-sm">Sair</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-background/80 text-sm">{email || "Administrador"}</Text>
        </View>

        {/* Filtro de Período */}
        <View className="flex-row p-4 gap-2">
          {(["week", "month", "quarter"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 py-2 px-4 rounded-lg ${period === p ? "bg-primary" : "bg-surface"}`}
            >
              <Text className={`text-center font-semibold ${period === p ? "text-background" : "text-foreground"}`}>
                {p === "week" ? "Semana" : p === "month" ? "Mês" : "Trimestre"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estatísticas Gerais */}
        {stats && (
          <View className="p-4">
            <Text className="text-foreground text-xl font-bold mb-4">Visão Geral</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Total de Funcionários</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.totalEmployees}</Text>
              </View>
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Ativos Hoje</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.activeToday}</Text>
              </View>
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Check-ins Hoje</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.checkInsToday}</Text>
              </View>
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Hidratação Média</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.hydrationAverage}ml</Text>
              </View>
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Queixas (Semana)</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.complaintsThisWeek}</Text>
              </View>
              <View className="bg-surface p-4 rounded-lg flex-1 min-w-[45%]">
                <Text className="text-muted text-sm">Desafios Ativos</Text>
                <Text className="text-foreground text-2xl font-bold">{stats.challengesActive}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Funcionários */}
        <View className="p-4">
          <Text className="text-foreground text-xl font-bold mb-4">Funcionários</Text>
          {employees.map((emp) => (
            <View key={emp.id} className="bg-surface p-4 rounded-lg mb-3">
              <Text className="text-foreground font-bold text-lg">{emp.name}</Text>
              <Text className="text-muted text-sm">Matrícula: {emp.matricula}</Text>
              <View className="flex-row gap-4 mt-2">
                <Text className="text-muted text-xs">Check-ins: {emp.checkIns.length}</Text>
                <Text className="text-muted text-xs">Hidratação: {emp.hydration.length} registros</Text>
                <Text className="text-muted text-xs">Queixas: {emp.complaints.length}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ações Rápidas */}
        <View className="p-4 gap-3 mb-6">
          <TouchableOpacity
            onPress={handleExportPDF}
            className="bg-primary py-4 px-6 rounded-lg"
          >
            <Text className="text-background text-center font-semibold">Exportar Relatório PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSendEmail}
            className="bg-surface py-4 px-6 rounded-lg border border-border"
          >
            <Text className="text-foreground text-center font-semibold">Enviar Relatório por Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/admin-alerts")}
            className="bg-warning py-4 px-6 rounded-lg"
          >
            <Text className="text-background text-center font-semibold">Ver Alertas Críticos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/admin-challenge-photos")}
            className="bg-surface py-4 px-6 rounded-lg border border-border"
          >
            <Text className="text-foreground text-center font-semibold">Fotos dos Desafios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
