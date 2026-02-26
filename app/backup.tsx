import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useBackup } from "@/hooks/use-backup";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

export default function BackupScreen() {
  const colors = useColors();
  const {
    createBackup,
    restoreBackup,
    clearAllData,
    getDataSize,
    formatBytes,
    isBackingUp,
    isRestoring,
  } = useBackup();

  const [dataSize, setDataSize] = useState<string>("Calculando...");

  useEffect(() => {
    loadDataSize();
  }, []);

  const loadDataSize = async () => {
    const size = await getDataSize();
    setDataSize(formatBytes(size));
  };

  const handleCreateBackup = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      "Criar Backup",
      "Deseja criar um backup de todos os seus dados?\n\nO arquivo será salvo e você poderá compartilhá-lo ou salvá-lo em um local seguro.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar Backup",
          onPress: async () => {
            const success = await createBackup();
            if (success) {
              Alert.alert(
                "Backup Criado",
                "Seu backup foi criado com sucesso! Guarde-o em um local seguro."
              );
              await loadDataSize();
            }
          },
        },
      ]
    );
  };

  const handleRestoreBackup = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      "Restaurar Backup",
      "⚠️ ATENÇÃO: Restaurar um backup irá SUBSTITUIR todos os dados atuais do app.\n\nDeseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: async () => {
            try {
              // Selecionar arquivo
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
                copyToCacheDirectory: true,
              });

              if (result.canceled) {
                return;
              }

              // Ler arquivo
              const fileUri = result.assets[0].uri;
              let fileContent = "";
              if (Platform.OS !== "web") {
                fileContent = await FileSystem.readAsStringAsync(fileUri, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
              } else {
                Alert.alert("Erro", "Restauração de backup não disponível na web. Use um dispositivo móvel.");
                return;
              }

              // Restaurar backup
              const success = await restoreBackup(fileContent);
              if (success) {
                await loadDataSize();
              }
            } catch (error) {
              console.error("Erro ao selecionar arquivo:", error);
              Alert.alert("Erro", "Não foi possível ler o arquivo de backup");
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Alert.alert(
      "Limpar Todos os Dados",
      "⚠️ ATENÇÃO: Esta ação irá APAGAR PERMANENTEMENTE todos os dados do app.\n\nEsta ação NÃO PODE ser desfeita!\n\nCrie um backup antes de continuar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar Tudo",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmação Final",
              "Tem certeza absoluta?\n\nTodos os seus dados serão perdidos!",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sim, Limpar Tudo",
                  style: "destructive",
                  onPress: async () => {
                    await clearAllData();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            style={{ opacity: 0.8 }}
          >
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">
            💾 Backup e Restauração
          </Text>
          <Text className="text-muted text-base">
            Proteja seus dados criando backups regulares
          </Text>
        </View>

        {/* Informações dos Dados */}
        <Card className="mb-6 bg-primary/10 border border-primary">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted mb-1">Tamanho dos Dados</Text>
              <Text className="text-2xl font-bold text-foreground">{dataSize}</Text>
            </View>
            <TouchableOpacity
              onPress={loadDataSize}
              className="bg-primary rounded-full p-3"
            >
              <Text className="text-white text-xs font-semibold">Atualizar</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Criar Backup */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">
            📤 Criar Backup
          </Text>
          <Text className="text-sm text-muted mb-4">
            Crie uma cópia de segurança de todos os seus dados: perfil, check-ins, pressão arterial, hidratação, desafios e mais.
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 active:opacity-80"
            onPress={handleCreateBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center font-semibold text-white">
                Criar Backup Agora
              </Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* Restaurar Backup */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">
            📥 Restaurar Backup
          </Text>
          <Text className="text-sm text-muted mb-4">
            Restaure seus dados de um arquivo de backup anterior. Todos os dados atuais serão substituídos.
          </Text>
          <TouchableOpacity
            className="bg-orange-500 rounded-lg py-3 active:opacity-80"
            onPress={handleRestoreBackup}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center font-semibold text-white">
                Selecionar Arquivo de Backup
              </Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* Limpar Dados */}
        <Card className="mb-6 bg-error/10 border border-error">
          <Text className="text-lg font-semibold text-error mb-2">
            🗑️ Limpar Todos os Dados
          </Text>
          <Text className="text-sm text-muted mb-4">
            Remove permanentemente todos os dados do app. Use apenas se quiser começar do zero.
          </Text>
          <TouchableOpacity
            className="bg-error rounded-lg py-3 active:opacity-80"
            onPress={handleClearData}
          >
            <Text className="text-center font-semibold text-white">
              Limpar Tudo (Irreversível)
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Dicas */}
        <Card className="bg-success/10 border border-success">
          <Text className="text-sm font-semibold text-success mb-2">💡 Dicas Importantes</Text>
          <Text className="text-sm text-foreground leading-relaxed">
            • Crie backups regularmente (semanal ou mensalmente){"\n"}
            • Guarde os arquivos de backup em locais seguros (nuvem, email){"\n"}
            • Teste a restauração ocasionalmente{"\n"}
            • Sempre crie um backup antes de limpar os dados{"\n"}
            • O formato do backup é JSON (legível e portável)
          </Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
