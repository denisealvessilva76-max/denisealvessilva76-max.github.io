import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { usePersonalDashboard } from "@/hooks/use-personal-dashboard";
import { CheckInStatus } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { useCheckinReminder } from "@/hooks/use-checkin-reminder";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHECK_IN_OPTIONS: Array<{
  status: CheckInStatus;
  emoji: string;
  label: string;
  sub: string;
  bg: string;
  border: string;
}> = [
  { status: "bem", emoji: "😊", label: "Tudo bem!", sub: "Sem dores hoje", bg: "#E8F5E9", border: "#16A34A" },
  { status: "dor-leve", emoji: "😐", label: "Com dor leve", sub: "Dor suportável", bg: "#FFF8E1", border: "#D97706" },
  { status: "dor-forte", emoji: "😞", label: "Com dor forte", sub: "Preciso de ajuda", bg: "#FFEBEE", border: "#DC2626" },
];

const QUICK_ACTIONS = [
  { icon: "💧", label: "Hidratação", route: "/(tabs)/saude", color: "#1B6CA8", bg: "#DBEAFE" },
  { icon: "🫀", label: "Pressão", route: "/(tabs)/saude", color: "#DC2626", bg: "#FEE2E2" },
  { icon: "🧘", label: "Ergonomia", route: "/(tabs)/ergonomia", color: "#2E8B57", bg: "#DCFCE7" },
  { icon: "🏆", label: "Desafios", route: "/desafios", color: "#D97706", bg: "#FEF3C7" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCheckIn, getTodayCheckIn, checkIns } = useHealthData();
  const { stats: gamificationStats } = useGamification(checkIns);
  const { stats: dashboardStats, refresh } = usePersonalDashboard();
  const [todayCheckIn, setTodayCheckIn] = useState(getTodayCheckIn());
  const [refreshing, setRefreshing] = useState(false);
  const [workerName, setWorkerName] = useState("Trabalhador");
  const { markCheckinDone } = useCheckinReminder();

  useEffect(() => {
    setTodayCheckIn(getTodayCheckIn());
  }, [checkIns]);

  useEffect(() => {
    AsyncStorage.getItem("worker_profile").then((data) => {
      if (data) {
        const p = JSON.parse(data);
        if (p.name) setWorkerName(p.name.split(" ")[0]);
      }
    });
  }, []);

  const handleCheckIn = async (status: CheckInStatus) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (status === "dor-leve" || status === "dor-forte") {
      await markCheckinDone();
      router.push({ pathname: "/complaint-form", params: { severity: status === "dor-leve" ? "leve" : "forte" } });
      return;
    }
    const result = await addCheckIn(status);
    if (result) {
      setTodayCheckIn(result);
      await markCheckinDone();
      refresh();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getCheckInEmoji = (s: CheckInStatus) => CHECK_IN_OPTIONS.find((o) => o.status === s)?.emoji || "❓";
  const getCheckInLabel = (s: CheckInStatus) => CHECK_IN_OPTIONS.find((o) => o.status === s)?.label || "—";

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting()}, {workerName} 👋</Text>
              <Text style={styles.headerSub}>Canteiro Saudável • Cuide-se!</Text>
            </View>
            <TouchableOpacity style={styles.pointsBadge} onPress={() => router.push("/conquistas")}>
              <Text style={styles.pointsIcon}>⭐</Text>
              <Text style={styles.pointsText}>{gamificationStats.totalPoints} pts</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekBar}>
            {Array.from({ length: 7 }).map((_, i) => {
              const day = (dashboardStats.checkIns as any).history?.[i];
              const filled = day?.status === "bem" || day?.status === "dor-leve" || day?.status === "dor-forte";
              return <View key={i} style={[styles.weekDot, { backgroundColor: filled ? "#fff" : "rgba(255,255,255,0.3)" }]} />;
            })}
            <Text style={styles.weekLabel}>{dashboardStats.checkIns.streak} dias 🔥</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* CHECK-IN */}
          {!todayCheckIn ? (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Como você está hoje?</Text>
              <Text style={[styles.cardSub, { color: colors.muted }]}>Faça seu check-in diário de saúde</Text>
              <View style={styles.checkinOptions}>
                {CHECK_IN_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.status}
                    onPress={() => handleCheckIn(opt.status)}
                    style={({ pressed }) => [
                      styles.checkinBtn,
                      { backgroundColor: opt.bg, borderColor: opt.border, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={styles.checkinEmoji}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkinLabel, { color: opt.border }]}>{opt.label}</Text>
                      <Text style={[styles.checkinSub, { color: colors.muted }]}>{opt.sub}</Text>
                    </View>
                    <Text style={{ color: opt.border, fontSize: 20, fontWeight: "700" }}>›</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: "#E8F5E9", borderWidth: 2, borderColor: colors.success }]}>
              <View style={styles.checkinDoneRow}>
                <Text style={{ fontSize: 36 }}>{getCheckInEmoji(todayCheckIn.status)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>Check-in de hoje</Text>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{getCheckInLabel(todayCheckIn.status)}</Text>
                </View>
                <View style={[styles.doneBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.doneBadgeText}>✓ Feito</Text>
                </View>
              </View>
            </View>
          )}

          {/* AÇÕES RÁPIDAS */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ações Rápidas</Text>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.quickCard, { backgroundColor: a.bg }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(a.route as any);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickIcon}>{a.icon}</Text>
                  <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* RESUMO DA SEMANA */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📊 Resumo da Semana</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: "#DBEAFE" }]}>
                <Text style={[styles.statValue, { color: "#1B6CA8" }]}>{dashboardStats.checkIns.thisWeek}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Check-ins</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: "#DCFCE7" }]}>
                <Text style={[styles.statValue, { color: "#16A34A" }]}>
                  {(((dashboardStats.hydration as any).todayTotal || 0) / 1000).toFixed(1)}L
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Água hoje</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.statValue, { color: "#D97706" }]}>{gamificationStats.totalPoints}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Pontos</Text>
              </View>
            </View>
          </View>

          {/* GAMIFICAÇÃO */}
          <View style={styles.gamRow}>
            <TouchableOpacity
              style={[styles.gamCard, { backgroundColor: "#FEF3C7", borderColor: "#D97706" }]}
              onPress={() => router.push("/ranking")}
              activeOpacity={0.75}
            >
              <Text style={styles.gamIcon}>🏆</Text>
              <Text style={[styles.gamLabel, { color: "#D97706" }]}>Ranking</Text>
              <Text style={[styles.gamSub, { color: colors.muted }]}>Posição</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gamCard, { backgroundColor: "#DBEAFE", borderColor: "#1B6CA8" }]}
              onPress={() => router.push("/conquistas")}
              activeOpacity={0.75}
            >
              <Text style={styles.gamIcon}>🎖️</Text>
              <Text style={[styles.gamLabel, { color: "#1B6CA8" }]}>Conquistas</Text>
              <Text style={[styles.gamSub, { color: colors.muted }]}>Medalhas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gamCard, { backgroundColor: "#DCFCE7", borderColor: "#16A34A" }]}
              onPress={() => router.push("/recompensas")}
              activeOpacity={0.75}
            >
              <Text style={styles.gamIcon}>🎁</Text>
              <Text style={[styles.gamLabel, { color: "#16A34A" }]}>Prêmios</Text>
              <Text style={[styles.gamSub, { color: colors.muted }]}>Resgatar</Text>
            </TouchableOpacity>
          </View>

          {/* DICA DO DIA */}
          <View style={[styles.tipCard, { backgroundColor: "#DBEAFE", borderColor: "#1B6CA8" }]}>
            <Text style={[styles.tipTitle, { color: "#1B6CA8" }]}>💡 Dica do Dia</Text>
            <Text style={[styles.tipText, { color: colors.foreground }]}>
              Faça uma pausa a cada 2 horas para alongar ombros e costas. Isso reduz o risco de doenças musculoesqueléticas.
            </Text>
          </View>

          {/* BOTÃO LIMPAR DADOS */}
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.error }]}
            onPress={() => {
              Alert.alert("Limpar Todos os Dados", "Isso vai apagar todos os dados locais. Deseja continuar?", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Limpar",
                  style: "destructive",
                  onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace("/cadastro");
                  },
                },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetText, { color: colors.error }]}>🗑️ Limpar Dados e Recomeçar</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontSize: 23, fontWeight: "800", color: "#fff", marginBottom: 3, letterSpacing: -0.4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", letterSpacing: 0.2 },
  pointsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  pointsIcon: { fontSize: 15 },
  pointsText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  weekBar: { flexDirection: "row", alignItems: "center", gap: 7 },
  weekDot: { width: 12, height: 12, borderRadius: 6 },
  weekLabel: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginLeft: 4, fontWeight: "700" },
  body: { padding: 16, gap: 14 },
  card: {
    borderRadius: 22, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 3, letterSpacing: -0.2 },
  cardSub: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  checkinOptions: { gap: 10 },
  checkinBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 15, borderRadius: 16, borderWidth: 1.5,
  },
  checkinEmoji: { fontSize: 30 },
  checkinLabel: { fontSize: 15, fontWeight: "700", letterSpacing: -0.1 },
  checkinSub: { fontSize: 12, marginTop: 2 },
  checkinDoneRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  doneBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  doneBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12, letterSpacing: -0.2 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    flex: 1, minWidth: "44%", borderRadius: 18,
    padding: 18, alignItems: "center", gap: 7,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  quickIcon: { fontSize: 30 },
  quickLabel: { fontSize: 13, fontWeight: "700", letterSpacing: -0.1 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 3, fontWeight: "500" },
  gamRow: { flexDirection: "row", gap: 10 },
  gamCard: {
    flex: 1, borderRadius: 18, padding: 16,
    alignItems: "center", gap: 5, borderWidth: 1.5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  gamIcon: { fontSize: 28 },
  gamLabel: { fontSize: 13, fontWeight: "700" },
  gamSub: { fontSize: 11, fontWeight: "500" },
  tipCard: { borderRadius: 18, padding: 18, borderWidth: 1.5, gap: 8 },
  tipTitle: { fontSize: 14, fontWeight: "800" },
  tipText: { fontSize: 13, lineHeight: 21 },
  resetBtn: {
    borderRadius: 16, padding: 14, borderWidth: 1.5,
    alignItems: "center", marginTop: 4,
  },
  resetText: { fontSize: 14, fontWeight: "600" },
});
