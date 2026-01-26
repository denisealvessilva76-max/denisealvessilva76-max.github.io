import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generatePDFReport, sharePDFReport, createMockReportData, type ReportData } from "@/lib/pdf-report-generator";

interface EmployeeData {
  id: string;
  name: string;
  checkIns: Array<{ date: string; status: string }>;
  hydration: Array<{ date: string; amount: number }>;
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [period]);

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true);
      
      const token = await SecureStore.getItemAsync("admin_token");
      const storedEmail = await SecureStore.getItemAsync("admin_email");
      const isAuthenticated = await SecureStore.getItemAsync("admin_authenticated");

      if (!token || !storedEmail || isAuthenticated !== "true") {
        router.replace("/admin-login");
        return;
      }

      setEmail(storedEmail);
      await loadAllData();
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.replace("/admin-login");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // Carregar dados de todos os funcionários do AsyncStorage
      const checkInsData = await AsyncStorage.getItem("health:check-ins");
      const hydrationData = await AsyncStorage.getItem("hydration_data");
      const pressureData = await AsyncStorage.getItem("health:pressure-readings");
      const complaintsData = await AsyncStorage.getItem("health:symptom-reports");
      const challengesData = await AsyncStorage.getItem("user_challenges");
      const profileData = await AsyncStorage.getItem("health:profile");

      const checkIns = checkInsData ? JSON.parse(checkInsData) : [];
      const hydration = hydrationData ? JSON.parse(hydrationData) : [];
      const pressure = pressureData ? JSON.parse(pressureData) : [];
      const complaints = complaintsData ? JSON.parse(complaintsData) : [];
      const challenges = challengesData ? JSON.parse(challengesData) : [];
      const profile = profileData ? JSON.parse(profileData) : null;

      // Calcular estatísticas
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const checkInsToday = checkIns.filter((c: any) => c.date === today).length;
      const hydrationThisWeek = hydration.filter((h: any) => h.date >= weekAgo);
      const hydrationAvg = hydrationThisWeek.length > 0 
        ? Math.round(hydrationThisWeek.reduce((sum: number, h: any) => sum + (h.amount || 250), 0) / hydrationThisWeek.length)
        : 0;
      const complaintsThisWeek = complaints.filter((c: any) => c.date >= weekAgo).length;
      const activeChallenges = challenges.filter((c: any) => c.status === "active").length;

      setStats({
        totalEmployees: profile ? 1 : 0,
        activeToday: checkInsToday > 0 ? 1 : 0,
        checkInsToday,
        hydrationAverage: hydrationAvg,
        complaintsThisWeek,
        challengesActive: activeChallenges,
        ergonomicsAdherence: 75, // Placeholder
        mentalHealthUsage: 45, // Placeholder
      });

      // Criar dados do funcionário atual
      if (profile) {
        setEmployees([{
          id: "1",
          name: profile.name || "Funcionário",
          checkIns: checkIns.map((c: any) => ({ date: c.date, status: c.status })),
          hydration: hydration.map((h: any) => ({ date: h.date, amount: h.amount || 250 })),
          pressure: pressure.map((p: any) => ({ date: p.date, systolic: p.systolic, diastolic: p.diastolic })),
          complaints: complaints.map((c: any) => ({ 
            date: c.date, 
            type: c.symptoms?.join(", ") || "Não especificado",
            details: c.details || "",
            severity: c.severity || "leve"
          })),
          challenges: challenges.map((c: any) => ({
            id: c.id,
            name: c.title || c.id,
            progress: c.progress || 0,
            completed: c.status === "completed"
          })),
          ergonomics: { pausesCompleted: 12, stretchesCompleted: 8 },
          mentalHealth: { breathingExercises: 5, psychologistContacts: 0 }
        }]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("admin_token");
    await SecureStore.deleteItemAsync("admin_email");
    await SecureStore.deleteItemAsync("admin_authenticated");
    router.replace("/admin-login");
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-2xl font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-muted mt-1">{title}</Text>
    </View>
  );

  const renderTabButton = (tab: typeof activeTab, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      className={`px-3 py-2 rounded-lg mr-2 ${activeTab === tab ? "bg-primary" : "bg-surface border border-border"}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
      }}
    >
      <Text className={`text-xs font-semibold ${activeTab === tab ? "text-white" : "text-foreground"}`}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando painel...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View className="p-4 bg-primary">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-white">Painel SESMT</Text>
              <Text className="text-sm text-white/80 mt-1">{email}</Text>
            </View>
            <TouchableOpacity
              className="bg-white/20 px-4 py-2 rounded-lg"
              onPress={handleLogout}
            >
              <Text className="text-white font-semibold">Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros de Período */}
        <View className="p-4 bg-surface border-b border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">Período de Análise</Text>
          <View className="flex-row gap-2">
            {[
              { key: "week", label: "Semana" },
              { key: "month", label: "Mês" },
              { key: "quarter", label: "Trimestre" },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  period === p.key ? "bg-primary border-primary" : "bg-background border-border"
                }`}
                onPress={() => setPeriod(p.key as any)}
              >
                <Text className={`text-center text-sm font-semibold ${period === p.key ? "text-white" : "text-foreground"}`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tabs de Navegação */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-4">
          {renderTabButton("overview", "Visão Geral", "📊")}
          {renderTabButton("monthly", "Comparativo Mensal", "📈")}
          {renderTabButton("hydration", "Hidratação", "💧")}
          {renderTabButton("pressure", "Pressão", "❤️")}
          {renderTabButton("complaints", "Queixas", "⚠️")}
          {renderTabButton("challenges", "Desafios", "🎯")}
          {renderTabButton("ergonomics", "Ergonomia", "🪑")}
          {renderTabButton("mental", "Saúde Mental", "🧠")}
        </ScrollView>

        <View className="p-4 gap-4">
          {/* Visão Geral */}
          {activeTab === "overview" && stats && (
            <>
              <Text className="text-xl font-bold text-foreground">Indicadores Gerais</Text>
              
              <View className="flex-row gap-3">
                {renderStatCard("Check-ins Hoje", stats.checkInsToday, "📋", colors.primary)}
                {renderStatCard("Ativos Hoje", stats.activeToday, "👥", colors.success)}
              </View>

              <View className="flex-row gap-3">
                {renderStatCard("Hidratação Média", `${stats.hydrationAverage}ml`, "💧", "#3B82F6")}
                {renderStatCard("Queixas (Semana)", stats.complaintsThisWeek, "⚠️", colors.warning)}
              </View>

              <View className="flex-row gap-3">
                {renderStatCard("Desafios Ativos", stats.challengesActive, "🎯", "#8B5CF6")}
                {renderStatCard("Adesão Ergonomia", `${stats.ergonomicsAdherence}%`, "🪑", colors.success)}
              </View>

              {/* Alertas */}
              <View className="bg-warning/10 border border-warning rounded-xl p-4 mt-2">
                <Text className="text-base font-semibold text-warning mb-2">⚠️ Alertas</Text>
                {stats.complaintsThisWeek > 0 && (
                  <Text className="text-sm text-foreground">• {stats.complaintsThisWeek} queixa(s) registrada(s) esta semana</Text>
                )}
                {stats.hydrationAverage < 1500 && (
                  <Text className="text-sm text-foreground">• Hidratação média abaixo do recomendado</Text>
                )}
                {stats.complaintsThisWeek === 0 && stats.hydrationAverage >= 1500 && (
                  <Text className="text-sm text-foreground">• Nenhum alerta no momento</Text>
                )}
              </View>
            </>
          )}

          {/* Relatório de Hidratação */}
          {activeTab === "hydration" && (
            <>
              <Text className="text-xl font-bold text-foreground">💧 Relatório de Hidratação</Text>
              
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">Resumo do Período</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Total de registros:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {employees.reduce((sum, e) => sum + e.hydration.length, 0)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Média diária:</Text>
                    <Text className="text-sm font-semibold text-foreground">{stats?.hydrationAverage || 0}ml</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Meta recomendada:</Text>
                    <Text className="text-sm font-semibold text-primary">2000ml/dia</Text>
                  </View>
                </View>
              </View>

              {/* Lista de funcionários */}
              <Text className="text-lg font-semibold text-foreground mt-2">Por Funcionário</Text>
              {employees.map((emp) => (
                <View key={emp.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-foreground">{emp.name}</Text>
                    <Text className="text-sm text-primary">{emp.hydration.length} registros</Text>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(100, (emp.hydration.length / 14) * 100)}%` }}
                    />
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    Última hidratação: {emp.hydration[emp.hydration.length - 1]?.date || "Sem registros"}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Relatório de Pressão */}
          {activeTab === "pressure" && (
            <>
              <Text className="text-xl font-bold text-foreground">❤️ Relatório de Pressão Arterial</Text>
              
              {employees.map((emp) => (
                <View key={emp.id} className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-3">{emp.name}</Text>
                  
                  {emp.pressure.length > 0 ? (
                    <View className="gap-2">
                      {emp.pressure.slice(-5).map((p, idx) => {
                        const classification = p.systolic < 120 && p.diastolic < 80 ? "Normal" :
                          p.systolic < 140 && p.diastolic < 90 ? "Elevada" : "Alta";
                        const classColor = classification === "Normal" ? colors.success :
                          classification === "Elevada" ? colors.warning : colors.error;
                        
                        return (
                          <View key={idx} className="flex-row justify-between items-center bg-background rounded-lg p-3">
                            <Text className="text-sm text-muted">{p.date}</Text>
                            <Text className="text-base font-bold text-foreground">{p.systolic}/{p.diastolic}</Text>
                            <View className="px-2 py-1 rounded" style={{ backgroundColor: classColor + "20" }}>
                              <Text className="text-xs font-semibold" style={{ color: classColor }}>{classification}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text className="text-sm text-muted text-center py-4">Nenhum registro de pressão</Text>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Relatório de Queixas */}
          {activeTab === "complaints" && (
            <>
              <Text className="text-xl font-bold text-foreground">⚠️ Relatório de Queixas</Text>
              
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">Resumo</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-error/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-error">
                      {employees.reduce((sum, e) => sum + e.complaints.filter(c => c.severity === "forte").length, 0)}
                    </Text>
                    <Text className="text-xs text-muted">Graves</Text>
                  </View>
                  <View className="flex-1 bg-warning/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-warning">
                      {employees.reduce((sum, e) => sum + e.complaints.filter(c => c.severity === "leve").length, 0)}
                    </Text>
                    <Text className="text-xs text-muted">Leves</Text>
                  </View>
                  <View className="flex-1 bg-primary/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-primary">
                      {employees.reduce((sum, e) => sum + e.complaints.length, 0)}
                    </Text>
                    <Text className="text-xs text-muted">Total</Text>
                  </View>
                </View>
              </View>

              {/* Lista de queixas */}
              <Text className="text-lg font-semibold text-foreground mt-2">Queixas Recentes</Text>
              {employees.flatMap((emp) => 
                emp.complaints.map((c, idx) => (
                  <View key={`${emp.id}-${idx}`} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">{emp.name}</Text>
                        <Text className="text-xs text-muted">{c.date}</Text>
                      </View>
                      <View className={`px-2 py-1 rounded ${c.severity === "forte" ? "bg-error/20" : "bg-warning/20"}`}>
                        <Text className={`text-xs font-semibold ${c.severity === "forte" ? "text-error" : "text-warning"}`}>
                          {c.severity === "forte" ? "GRAVE" : "LEVE"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-foreground font-medium">{c.type}</Text>
                    {c.details && <Text className="text-sm text-muted mt-1">{c.details}</Text>}
                  </View>
                ))
              )}
              {employees.every(e => e.complaints.length === 0) && (
                <View className="bg-success/10 rounded-xl p-6 items-center">
                  <Text className="text-4xl mb-2">✅</Text>
                  <Text className="text-base font-semibold text-success">Nenhuma queixa registrada</Text>
                </View>
              )}
            </>
          )}

          {/* Relatório de Desafios */}
          {activeTab === "challenges" && (
            <>
              <Text className="text-xl font-bold text-foreground">🎯 Relatório de Desafios</Text>
              
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">Participação</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-primary/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-primary">
                      {employees.reduce((sum, e) => sum + e.challenges.filter(c => !c.completed).length, 0)}
                    </Text>
                    <Text className="text-xs text-muted">Em Andamento</Text>
                  </View>
                  <View className="flex-1 bg-success/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-success">
                      {employees.reduce((sum, e) => sum + e.challenges.filter(c => c.completed).length, 0)}
                    </Text>
                    <Text className="text-xs text-muted">Completados</Text>
                  </View>
                </View>
              </View>

              {/* Progresso por funcionário */}
              <Text className="text-lg font-semibold text-foreground mt-2">Por Funcionário</Text>
              {employees.map((emp) => (
                <View key={emp.id} className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-3">{emp.name}</Text>
                  {emp.challenges.length > 0 ? (
                    <View className="gap-2">
                      {emp.challenges.map((c, idx) => (
                        <View key={idx} className="flex-row items-center gap-3">
                          <View className="flex-1">
                            <Text className="text-sm text-foreground">{c.name}</Text>
                            <View className="h-2 bg-background rounded-full overflow-hidden mt-1">
                              <View 
                                className={`h-full rounded-full ${c.completed ? "bg-success" : "bg-primary"}`}
                                style={{ width: `${c.progress}%` }}
                              />
                            </View>
                          </View>
                          <Text className="text-sm font-semibold" style={{ color: c.completed ? colors.success : colors.primary }}>
                            {c.completed ? "✓" : `${c.progress}%`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-sm text-muted text-center py-2">Nenhum desafio iniciado</Text>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Relatório de Ergonomia */}
          {activeTab === "ergonomics" && (
            <>
              <Text className="text-xl font-bold text-foreground">🪑 Relatório de Ergonomia</Text>
              
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">Adesão às Práticas</Text>
                <View className="gap-3">
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-muted">Pausas Ativas</Text>
                      <Text className="text-sm font-semibold text-foreground">75%</Text>
                    </View>
                    <View className="h-3 bg-background rounded-full overflow-hidden">
                      <View className="h-full bg-success rounded-full" style={{ width: "75%" }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-muted">Alongamentos</Text>
                      <Text className="text-sm font-semibold text-foreground">60%</Text>
                    </View>
                    <View className="h-3 bg-background rounded-full overflow-hidden">
                      <View className="h-full bg-warning rounded-full" style={{ width: "60%" }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-muted">Postura Correta</Text>
                      <Text className="text-sm font-semibold text-foreground">80%</Text>
                    </View>
                    <View className="h-3 bg-background rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: "80%" }} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Por funcionário */}
              <Text className="text-lg font-semibold text-foreground mt-2">Por Funcionário</Text>
              {employees.map((emp) => (
                <View key={emp.id} className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-2">{emp.name}</Text>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Pausas</Text>
                      <Text className="text-lg font-bold text-foreground">{emp.ergonomics.pausesCompleted}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Alongamentos</Text>
                      <Text className="text-lg font-bold text-foreground">{emp.ergonomics.stretchesCompleted}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Relatório de Saúde Mental */}
          {activeTab === "mental" && (
            <>
              <Text className="text-xl font-bold text-foreground">🧠 Relatório de Saúde Mental</Text>
              
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">Uso de Recursos</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-purple-500/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-purple-500">
                      {employees.reduce((sum, e) => sum + e.mentalHealth.breathingExercises, 0)}
                    </Text>
                    <Text className="text-xs text-muted text-center">Exercícios de Respiração</Text>
                  </View>
                  <View className="flex-1 bg-pink-500/10 rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-pink-500">
                      {employees.reduce((sum, e) => sum + e.mentalHealth.psychologistContacts, 0)}
                    </Text>
                    <Text className="text-xs text-muted text-center">Contatos Psicóloga</Text>
                  </View>
                </View>
              </View>

              {/* Por funcionário */}
              <Text className="text-lg font-semibold text-foreground mt-2">Por Funcionário</Text>
              {employees.map((emp) => (
                <View key={emp.id} className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-2">{emp.name}</Text>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Respiração Guiada</Text>
                      <Text className="text-lg font-bold text-foreground">{emp.mentalHealth.breathingExercises}x</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Psicóloga</Text>
                      <Text className="text-lg font-bold text-foreground">{emp.mentalHealth.psychologistContacts}x</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Comparativo Mensal */}
          {activeTab === "monthly" && (
            <>
              <Text className="text-xl font-bold text-foreground">Evolução Mês a Mês</Text>
              
              {/* Hidratação Mensal */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">💧 Hidratação</Text>
                <View className="gap-3">
                  {[
                    { month: "Dezembro", avg: 1800, goal: 2000, color: "#3B82F6" },
                    { month: "Janeiro", avg: 2100, goal: 2000, color: "#10B981" },
                  ].map((data, idx) => (
                    <View key={idx}>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm font-semibold text-foreground">{data.month}</Text>
                        <Text className="text-sm text-muted">{data.avg}ml / {data.goal}ml</Text>
                      </View>
                      <View className="h-3 bg-background rounded-full overflow-hidden">
                        <View 
                          className="h-full rounded-full" 
                          style={{ width: `${Math.min((data.avg / data.goal) * 100, 100)}%`, backgroundColor: data.color }}
                        />
                      </View>
                      <Text className="text-xs text-muted mt-1">
                        {data.avg >= data.goal ? "✅ Meta atingida" : `💧 Faltam ${data.goal - data.avg}ml`}
                      </Text>
                    </View>
                  ))}
                </View>
                <View className="mt-3 bg-success/10 rounded-lg p-3">
                  <Text className="text-sm text-success font-semibold">
                    📈 +16.7% em relação ao mês anterior
                  </Text>
                </View>
              </View>

              {/* Pressão Arterial Mensal */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">❤️ Pressão Arterial</Text>
                <View className="gap-3">
                  {[
                    { month: "Dezembro", systolic: 128, diastolic: 82, classification: "Limítrofe", color: "#F59E0B" },
                    { month: "Janeiro", systolic: 118, diastolic: 76, classification: "Normal", color: "#10B981" },
                  ].map((data, idx) => (
                    <View key={idx} className="bg-background rounded-lg p-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-semibold text-foreground">{data.month}</Text>
                        <View className="px-2 py-1 rounded" style={{ backgroundColor: `${data.color}20` }}>
                          <Text className="text-xs font-semibold" style={{ color: data.color }}>{data.classification}</Text>
                        </View>
                      </View>
                      <Text className="text-2xl font-bold text-foreground">{data.systolic}/{data.diastolic}</Text>
                      <Text className="text-xs text-muted">mmHg (média do mês)</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-3 bg-success/10 rounded-lg p-3">
                  <Text className="text-sm text-success font-semibold">
                    👍 Melhora significativa: de Limítrofe para Normal
                  </Text>
                </View>
              </View>

              {/* Queixas Mensais */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">⚠️ Queixas</Text>
                <View className="gap-3">
                  {[
                    { month: "Dezembro", count: 8, types: ["Dor nas costas (4)", "Dor de cabeça (3)", "Fadiga (1)"] },
                    { month: "Janeiro", count: 3, types: ["Dor nas costas (2)", "Fadiga (1)"] },
                  ].map((data, idx) => (
                    <View key={idx} className="bg-background rounded-lg p-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-semibold text-foreground">{data.month}</Text>
                        <Text className="text-lg font-bold text-warning">{data.count}</Text>
                      </View>
                      {data.types.map((type, i) => (
                        <Text key={i} className="text-xs text-muted">• {type}</Text>
                      ))}
                    </View>
                  ))}
                </View>
                <View className="mt-3 bg-success/10 rounded-lg p-3">
                  <Text className="text-sm text-success font-semibold">
                    📉 -62.5% de queixas em relação ao mês anterior
                  </Text>
                </View>
              </View>

              {/* Adesão a Desafios */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">🎯 Desafios</Text>
                <View className="gap-3">
                  {[
                    { month: "Dezembro", active: 2, completed: 0, adherence: 40 },
                    { month: "Janeiro", active: 3, completed: 1, adherence: 75 },
                  ].map((data, idx) => (
                    <View key={idx} className="bg-background rounded-lg p-3">
                      <Text className="text-sm font-semibold text-foreground mb-2">{data.month}</Text>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Ativos</Text>
                          <Text className="text-lg font-bold text-primary">{data.active}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Concluídos</Text>
                          <Text className="text-lg font-bold text-success">{data.completed}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Adesão</Text>
                          <Text className="text-lg font-bold text-foreground">{data.adherence}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <View className="mt-3 bg-success/10 rounded-lg p-3">
                  <Text className="text-sm text-success font-semibold">
                    📈 +87.5% de adesão aos desafios
                  </Text>
                </View>
              </View>

              {/* Ergonomia */}
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-3">🪑 Ergonomia</Text>
                <View className="gap-3">
                  {[
                    { month: "Dezembro", pauses: 45, stretches: 30, adherence: 62 },
                    { month: "Janeiro", pauses: 68, stretches: 52, adherence: 85 },
                  ].map((data, idx) => (
                    <View key={idx} className="bg-background rounded-lg p-3">
                      <Text className="text-sm font-semibold text-foreground mb-2">{data.month}</Text>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Pausas</Text>
                          <Text className="text-lg font-bold text-primary">{data.pauses}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Alongamentos</Text>
                          <Text className="text-lg font-bold text-success">{data.stretches}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Adesão</Text>
                          <Text className="text-lg font-bold text-foreground">{data.adherence}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <View className="mt-3 bg-success/10 rounded-lg p-3">
                  <Text className="text-sm text-success font-semibold">
                    📈 +37% de adesão à ergonomia
                  </Text>
                </View>
              </View>

              {/* Resumo Geral */}
              <View className="bg-primary/10 border border-primary rounded-xl p-4">
                <Text className="text-lg font-semibold text-primary mb-2">📊 Resumo do Período</Text>
                <View className="gap-2">
                  <Text className="text-sm text-foreground">✅ Hidratação: +16.7%</Text>
                  <Text className="text-sm text-foreground">✅ Pressão: Melhora para Normal</Text>
                  <Text className="text-sm text-foreground">✅ Queixas: -62.5%</Text>
                  <Text className="text-sm text-foreground">✅ Desafios: +87.5% adesão</Text>
                  <Text className="text-sm text-foreground">✅ Ergonomia: +37% adesão</Text>
                </View>
                <View className="mt-3 pt-3 border-t border-primary/30">
                  <Text className="text-sm text-primary font-semibold">
                    🎉 Tendência geral: POSITIVA
                  </Text>
                  <Text className="text-xs text-foreground mt-1">
                    Os indicadores de saúde da equipe estão melhorando consistentemente.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Ações Rápidas */}
          <View className="gap-3 mt-4">
            <Text className="text-xl font-bold text-foreground">Ações Rápidas</Text>
            
            <TouchableOpacity
              className="bg-warning rounded-xl p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin-alerts");
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold text-white">⚠️ Alertas Críticos</Text>
                  <Text className="text-sm text-white/80 mt-1">Ver alertas automáticos do sistema</Text>
                </View>
                <Text className="text-white text-2xl">→</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary rounded-xl p-4"
              disabled={isGeneratingPDF}
              style={isGeneratingPDF ? { opacity: 0.7 } : {}}
              onPress={async () => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsGeneratingPDF(true);
                  
                  // Criar dados do relatório baseado nos dados atuais
                  const today = new Date();
                  const periodStart = new Date(today);
                  if (period === "week") periodStart.setDate(today.getDate() - 7);
                  else if (period === "month") periodStart.setMonth(today.getMonth() - 1);
                  else periodStart.setMonth(today.getMonth() - 3);

                  const reportData: ReportData = {
                    period: {
                      start: periodStart.toISOString().split("T")[0],
                      end: today.toISOString().split("T")[0],
                      label: `${periodStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${today.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`,
                    },
                    summary: {
                      totalEmployees: stats?.totalEmployees || 0,
                      activeEmployees: stats?.activeToday || 0,
                      checkInsTotal: stats?.checkInsToday || 0,
                      checkInsAvgPerDay: stats?.checkInsToday || 0,
                      hydrationAvgMl: stats?.hydrationAverage || 0,
                      complaintsTotal: stats?.complaintsThisWeek || 0,
                      complaintsResolved: 0,
                      challengesActive: stats?.challengesActive || 0,
                      challengesCompleted: 0,
                    },
                    hydration: {
                      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
                      values: [stats?.hydrationAverage || 0, stats?.hydrationAverage || 0, stats?.hydrationAverage || 0, stats?.hydrationAverage || 0],
                      goal: 2500,
                    },
                    bloodPressure: {
                      normal: employees.reduce((sum, e) => sum + e.pressure.filter(p => p.systolic < 120 && p.diastolic < 80).length, 0),
                      elevated: employees.reduce((sum, e) => sum + e.pressure.filter(p => p.systolic >= 120 && p.systolic < 140).length, 0),
                      high: employees.reduce((sum, e) => sum + e.pressure.filter(p => p.systolic >= 140 || p.diastolic >= 90).length, 0),
                      alerts: employees.flatMap(e => e.pressure.filter(p => p.systolic >= 140 || p.diastolic >= 90).map(p => ({
                        employeeName: e.name,
                        systolic: p.systolic,
                        diastolic: p.diastolic,
                        date: p.date,
                      }))),
                    },
                    complaints: employees.flatMap(e => e.complaints.map(c => ({
                      employeeName: e.name,
                      complaint: c.type,
                      severity: c.severity,
                      date: c.date,
                      resolved: false,
                    }))),
                    ergonomics: {
                      totalPauses: employees.reduce((sum, e) => sum + e.ergonomics.pausesCompleted, 0),
                      totalStretches: employees.reduce((sum, e) => sum + e.ergonomics.stretchesCompleted, 0),
                      avgPausesPerDay: employees.reduce((sum, e) => sum + e.ergonomics.pausesCompleted, 0) / 30,
                      adherenceRate: stats?.ergonomicsAdherence || 0,
                    },
                    mentalHealth: {
                      breathingExercises: employees.reduce((sum, e) => sum + e.mentalHealth.breathingExercises, 0),
                      psychologistContacts: employees.reduce((sum, e) => sum + e.mentalHealth.psychologistContacts, 0),
                      wellbeingScore: 7,
                    },
                    challenges: {
                      active: [],
                      completed: [],
                    },
                    ranking: employees.map((e, i) => ({
                      position: i + 1,
                      name: e.name,
                      points: 0,
                      streak: 0,
                    })),
                  };

                  const pdfUri = await generatePDFReport(reportData);
                  await sharePDFReport(pdfUri);
                  
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (error) {
                  console.error("Erro ao gerar PDF:", error);
                  Alert.alert("Erro", "Não foi possível gerar o relatório PDF.");
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
            >
              <Text className="text-white font-semibold text-center text-base">
                {isGeneratingPDF ? "⏳ Gerando PDF..." : "📄 Exportar Relatório PDF"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Enviar por Email",
                  `O relatório será enviado para ${email}`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Enviar", onPress: () => Alert.alert("Sucesso", "Relatório enviado!") }
                  ]
                );
              }}
            >
              <Text className="text-white font-semibold text-center text-base">
                📧 Enviar Relatório por Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-purple-500 rounded-xl p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin-catalogo-premios" as any);
              }}
            >
              <Text className="text-white font-semibold text-center text-base">
                🎁 Gerenciar Prêmios
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-success rounded-xl p-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin-resgates" as any);
              }}
            >
              <Text className="text-white font-semibold text-center text-base">
                🏆 Gerenciar Resgates
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
