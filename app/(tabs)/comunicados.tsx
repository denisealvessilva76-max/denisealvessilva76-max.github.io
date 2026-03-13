import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { syncAnnouncementReadToPostgres } from "@/lib/sync-api";

const ANNOUNCEMENTS_KEY = "announcements:list";
const READ_ANNOUNCEMENTS_KEY = "announcements:read";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  category: "urgente" | "informativo" | "desafio" | "saude" | "geral";
  createdAt: string;
  createdBy?: string;
  expiresAt?: string;
}

const CATEGORY_CONFIG = {
  urgente: { label: "🚨 Urgente", color: "#EF4444", bg: "#FEF2F2" },
  informativo: { label: "ℹ️ Informativo", color: "#3B82F6", bg: "#EFF6FF" },
  desafio: { label: "🏆 Desafio", color: "#F59E0B", bg: "#FFFBEB" },
  saude: { label: "💚 Saúde", color: "#22C55E", bg: "#F0FDF4" },
  geral: { label: "📢 Geral", color: "#6B7280", bg: "#F9FAFB" },
};

// Comunicados de exemplo para quando não há dados do servidor
const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "sample-1",
    title: "Bem-vindo ao Canteiro Saudável!",
    body: "Este espaço é dedicado a comunicados importantes da equipe de saúde. Aqui você receberá avisos sobre campanhas de vacinação, lembretes de saúde e novidades do programa.",
    category: "informativo",
    createdAt: new Date().toISOString(),
    createdBy: "SESMT",
  },
  {
    id: "sample-2",
    title: "Campanha de Hidratação",
    body: "Lembre-se: em dias quentes, beba pelo menos 3 litros de água. Mantenha sempre uma garrafinha por perto durante o trabalho. Sua saúde é nossa prioridade! 💧",
    category: "saude",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: "Denise Silva - SESMT",
  },
];

export default function ComunicadosScreen() {
  const colors = useColors();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Carregar comunicados salvos localmente
      const [storedAnnouncements, storedRead] = await Promise.all([
        AsyncStorage.getItem(ANNOUNCEMENTS_KEY),
        AsyncStorage.getItem(READ_ANNOUNCEMENTS_KEY),
      ]);

      const localAnnouncements: Announcement[] = storedAnnouncements
        ? JSON.parse(storedAnnouncements)
        : [];

      const readSet = new Set<string>(storedRead ? JSON.parse(storedRead) : []);
      setReadIds(readSet);

      // Tentar buscar comunicados do servidor
      try {
        const response = await fetch("http://127.0.0.1:3000/api/painel/announcements", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.announcements && data.announcements.length > 0) {
            const serverAnnouncements = data.announcements as Announcement[];
            // Mesclar com locais, priorizando servidor
            const merged = mergeAnnouncements(serverAnnouncements, localAnnouncements);
            setAnnouncements(merged);
            await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(merged));
            return;
          }
        }
      } catch {
        // Servidor offline — usar dados locais
      }

      // Usar dados locais ou exemplos
      setAnnouncements(
        localAnnouncements.length > 0 ? localAnnouncements : SAMPLE_ANNOUNCEMENTS
      );
    } catch (error) {
      console.error("Erro ao carregar comunicados:", error);
      setAnnouncements(SAMPLE_ANNOUNCEMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeAnnouncements = (server: Announcement[], local: Announcement[]): Announcement[] => {
    const serverIds = new Set(server.map((a) => a.id));
    const onlyLocal = local.filter((a) => !serverIds.has(a.id));
    return [...server, ...onlyLocal].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const markAsRead = useCallback(
    async (id: string) => {
      if (readIds.has(id)) return;
      const newReadIds = new Set(readIds);
      newReadIds.add(id);
      setReadIds(newReadIds);
      await AsyncStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify([...newReadIds]));

      // Sincronizar com PostgreSQL
      const matricula =
        (await AsyncStorage.getItem("employee:matricula")) || "unknown";
      syncAnnouncementReadToPostgres({
        matricula,
        announcementId: id,
        readAt: new Date().toISOString(),
      }).catch(() => {});
    },
    [readIds]
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  const filteredAnnouncements =
    selectedCategory === "todos"
      ? announcements
      : announcements.filter((a) => a.category === selectedCategory);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Agora há pouco";
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Carregando comunicados...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📢 Comunicados</Text>
            <Text style={styles.headerSubtitle}>
              Avisos e informações da equipe de saúde
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} novo{unreadCount > 1 ? "s" : ""}</Text>
            </View>
          )}
        </View>

        {/* Filtros por categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === "todos" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCategory("todos")}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === "todos" ? "#fff" : colors.muted },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                selectedCategory === key && { backgroundColor: config.color },
              ]}
              onPress={() => setSelectedCategory(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedCategory === key ? "#fff" : colors.muted },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de comunicados */}
        <View style={styles.listContainer}>
          {filteredAnnouncements.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum comunicado
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Puxe para baixo para atualizar
              </Text>
            </View>
          ) : (
            filteredAnnouncements.map((announcement) => {
              const isRead = readIds.has(announcement.id);
              const catConfig = CATEGORY_CONFIG[announcement.category];
              return (
                <TouchableOpacity
                  key={announcement.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderLeftColor: catConfig.color,
                      opacity: isRead ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => markAsRead(announcement.id)}
                  activeOpacity={0.8}
                >
                  {/* Badge de não lido */}
                  {!isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: catConfig.color }]} />
                  )}

                  {/* Categoria */}
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: catConfig.bg },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: catConfig.color }]}>
                      {catConfig.label}
                    </Text>
                  </View>

                  {/* Título */}
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: colors.foreground,
                        fontWeight: isRead ? "500" : "700",
                      },
                    ]}
                  >
                    {announcement.title}
                  </Text>

                  {/* Imagem (se houver) */}
                  {announcement.imageUrl && (
                    <Image
                      source={{ uri: announcement.imageUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Corpo */}
                  <Text style={[styles.cardBody, { color: colors.muted }]}>
                    {announcement.body}
                  </Text>

                  {/* Rodapé */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardDate, { color: colors.muted }]}>
                      {formatDate(announcement.createdAt)}
                    </Text>
                    {announcement.createdBy && (
                      <Text style={[styles.cardAuthor, { color: colors.muted }]}>
                        • {announcement.createdBy}
                      </Text>
                    )}
                    {isRead && (
                      <Text style={[styles.readLabel, { color: colors.success }]}>
                        ✓ Lido
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  unreadBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  filterContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDate: {
    fontSize: 12,
  },
  cardAuthor: {
    fontSize: 12,
  },
  readLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
});
