import { View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type PhotoCategory = "pesagem" | "refeicao" | "atividade" | "outro" | "all";

export default function AdminChallengePhotosScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  // Query para buscar fotos
  const { data: photosData, isLoading, refetch } = trpc.challengePhotos.listAll.useQuery({
    workerId: selectedWorkerId || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 100,
  });
  
  const photos = photosData?.photos || [];
  
  const categories: { id: PhotoCategory; label: string; icon: string }[] = [
    { id: "all", label: "Todas", icon: "📸" },
    { id: "pesagem", label: "Pesagens", icon: "⚖️" },
    { id: "refeicao", label: "Refeições", icon: "🍽️" },
    { id: "atividade", label: "Atividades", icon: "🏃" },
    { id: "outro", label: "Outras", icon: "📷" },
  ];
  
  const handlePhotoPress = (photo: any) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          
          <Text className="text-2xl font-bold text-foreground">📸 Fotos dos Desafios</Text>
          <Text className="text-sm text-muted mt-1">
            Visualize todas as fotos enviadas pelos funcionários como comprovação dos desafios
          </Text>
        </View>
        
        {/* Filtros */}
        <View className="p-4 bg-surface border-b border-border">
          {/* Filtro de Categoria */}
          <Text className="text-sm font-semibold text-foreground mb-2">Categoria:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedCategory === cat.id ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategory === cat.id ? "text-white" : "text-foreground"
                  }`}
                >
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Filtro de Funcionário */}
          <Text className="text-sm font-semibold text-foreground mb-2">Funcionário (ID):</Text>
          <TextInput
            value={selectedWorkerId}
            onChangeText={setSelectedWorkerId}
            placeholder="Digite o ID do funcionário..."
            placeholderTextColor={colors.muted}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
          />
          
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-3 bg-primary rounded-lg py-3"
          >
            <Text className="text-white font-semibold text-center">🔍 Filtrar</Text>
          </TouchableOpacity>
        </View>
        
        {/* Galeria de Fotos */}
        <View className="p-4">
          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-center text-muted mt-4">Carregando fotos...</Text>
            </View>
          ) : photos.length === 0 ? (
            <View className="py-8">
              <Text className="text-center text-muted text-base">
                📭 Nenhuma foto encontrada com os filtros selecionados
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-lg font-semibold text-foreground mb-4">
                {photos.length} {photos.length === 1 ? "foto encontrada" : "fotos encontradas"}
              </Text>
              
              <View className="flex-row flex-wrap gap-2">
                {photos.map((photo: any) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => handlePhotoPress(photo)}
                    className="w-[48%] bg-surface rounded-xl overflow-hidden border border-border"
                  >
                    <Image
                      source={{ uri: photo.photoUrl }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                        {photo.challengeName}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {photo.category === "pesagem" && "⚖️ Pesagem"}
                        {photo.category === "refeicao" && "🍽️ Refeição"}
                        {photo.category === "atividade" && "🏃 Atividade"}
                        {photo.category === "outro" && "📷 Outra"}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {formatDate(photo.uploadedAt)}
                      </Text>
                      <Text className="text-xs text-muted">
                        ID: {photo.workerId}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Modal de Foto em Tela Cheia */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <TouchableOpacity
            onPress={() => setShowPhotoModal(false)}
            className="absolute top-12 right-4 bg-white/20 rounded-full p-3 z-10"
          >
            <Text className="text-white font-bold text-lg">✕</Text>
          </TouchableOpacity>
          
          {selectedPhoto && (
            <View className="w-full px-4">
              <Image
                source={{ uri: selectedPhoto.photoUrl }}
                className="w-full h-96"
                resizeMode="contain"
              />
              
              <View className="mt-6 bg-white/10 rounded-xl p-4">
                <Text className="text-white text-lg font-bold mb-2">
                  {selectedPhoto.challengeName}
                </Text>
                <Text className="text-white/80 text-sm mb-1">
                  📅 {formatDate(selectedPhoto.uploadedAt)}
                </Text>
                <Text className="text-white/80 text-sm mb-1">
                  👤 Funcionário: {selectedPhoto.workerId}
                </Text>
                <Text className="text-white/80 text-sm mb-1">
                  🏷️ Categoria: {
                    selectedPhoto.category === "pesagem" ? "Pesagem" :
                    selectedPhoto.category === "refeicao" ? "Refeição" :
                    selectedPhoto.category === "atividade" ? "Atividade" :
                    "Outra"
                  }
                </Text>
                {selectedPhoto.description && (
                  <Text className="text-white/80 text-sm mt-2">
                    💬 {selectedPhoto.description}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}
