import { ScrollView, Text, View, TouchableOpacity, TextInput, Pressable, Alert, Linking } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthData } from "@/hooks/use-health-data";
import { UserProfile } from "@/lib/types";
import { useOnboarding } from "@/hooks/use-onboarding";
import * as Haptics from "expo-haptics";

const SESMT_PHONE = "21998225493";
const SESMT_NAME = "Saúde Ocupacional";

export default function PerfilScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useHealthData();
  const { resetOnboarding } = useOnboarding();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: "",
    matricula: "",
    cargo: "",
    turno: "matutino",
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setIsEditing(true);
    }
  }, [profile]);

  // Recarregar perfil ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      const reloadProfile = async () => {
        try {
          const stored = await AsyncStorage.getItem("health:profile");
          if (stored) {
            const reloadedProfile = JSON.parse(stored);
            setFormData(reloadedProfile);
            console.log("[PERFIL] Avatar recarregado:", reloadedProfile.avatar);
          }
        } catch (error) {
          console.error("Erro ao recarregar perfil:", error);
        }
      };
      reloadProfile();
    }, [])
  );

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.matricula || !formData.cargo || !formData.turno) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    const newProfile: UserProfile = {
      id: profile?.id || Date.now().toString(),
      name: formData.name,
      matricula: formData.matricula,
      cargo: formData.cargo,
      turno: formData.turno as "matutino" | "vespertino" | "noturno",
      createdAt: profile?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveProfile(newProfile);
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Sucesso", "Perfil salvo com sucesso!");
  };

  const getTurnoLabel = (turno: string) => {
    switch (turno) {
      case "matutino":
        return "Matutino (6h - 14h)";
      case "vespertino":
        return "Vespertino (14h - 22h)";
      case "noturno":
        return "Noturno (22h - 6h)";
      default:
        return "Desconhecido";
    }
  };

  const handleContatoSESMT = async () => {
    const message = `Olá, sou trabalhador da Obra 345 e gostaria de falar sobre saúde ocupacional.`;
    const url = `whatsapp://send?phone=+55${SESMT_PHONE}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("WhatsApp não instalado", "Por favor, instale o WhatsApp para enviar mensagem");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
    }
  };

  const handleLigarSESMT = async () => {
    const url = `tel:+55${SESMT_PHONE}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer a chamada");
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Perfil</Text>
            <Text className="text-base text-muted">Seus dados e preferências</Text>
          </View>

          {/* Avatar */}
          <Card className="gap-4">
            <View className="items-center gap-3">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/select-avatar");
                }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#E6F4FE",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: "#0a7ea4",
                }}
              >
                <Text style={{ fontSize: 60 }}>{profile?.avatar || "\ud83d\udc77"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/select-avatar");
                }}
              >
                <Text className="text-primary font-semibold">Alterar Avatar</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Dados Pessoais */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Dados Pessoais</Text>
              {!isEditing && profile && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsEditing(true);
                  }}
                >
                  <Text className="text-primary font-semibold">Editar</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isEditing && profile ? (
              <View className="gap-3">
                <View>
                  <Text className="text-xs text-muted mb-1">Nome</Text>
                  <Text className="text-base text-foreground">{profile.name}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Matrícula</Text>
                  <Text className="text-base text-foreground">{profile.matricula}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Cargo</Text>
                  <Text className="text-base text-foreground">{profile.cargo}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Turno</Text>
                  <Text className="text-base text-foreground">{getTurnoLabel(profile.turno)}</Text>
                </View>
              </View>
            ) : (
              <View className="gap-3">
                <View>
                  <Text className="text-xs text-muted mb-1">Nome</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholder="Seu nome"
                    placeholderTextColor="#687076"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Matrícula</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholder="Ex: 12345"
                    placeholderTextColor="#687076"
                    value={formData.matricula}
                    onChangeText={(text) => setFormData({ ...formData, matricula: text })}
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Cargo</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholder="Ex: Pedreiro, Armador"
                    placeholderTextColor="#687076"
                    value={formData.cargo}
                    onChangeText={(text) => setFormData({ ...formData, cargo: text })}
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Turno</Text>
                  <View className="flex-row gap-2">
                    {(["matutino", "vespertino", "noturno"] as const).map((turno) => (
                      <Pressable
                        key={turno}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFormData({ ...formData, turno });
                        }}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View
                          className={`flex-1 py-2 px-3 rounded-lg border ${
                            formData.turno === turno
                              ? "bg-primary border-primary"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold text-center ${
                              formData.turno === turno ? "text-white" : "text-foreground"
                            }`}
                          >
                            {turno === "matutino" ? "Matutino" : turno === "vespertino" ? "Vespertino" : "Noturno"}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-3 active:opacity-80"
                    onPress={handleSaveProfile}
                  >
                    <Text className="text-center font-semibold text-white">Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-border rounded-lg py-3 active:opacity-80"
                    onPress={() => {
                      setIsEditing(false);
                      if (profile) setFormData(profile);
                    }}
                  >
                    <Text className="text-center font-semibold text-foreground">Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Saúde Mental */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">💙 Saúde Mental</Text>
            <Text className="text-sm text-muted">
              Acesse recursos de apoio emocional e profissionais disponíveis
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/saude-mental");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Acessar Recursos
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Área Administrativa */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🔐 Área Administrativa</Text>
            <Text className="text-sm text-muted">
              Acesso exclusivo para gestão de saúde ocupacional
            </Text>
            <TouchableOpacity
              className="bg-orange-500 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin-login");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Entrar como Administrador
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Dashboard Admin (Estatísticas) */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📊 Dashboard Admin</Text>
            <Text className="text-sm text-muted">
              Visualize estatísticas da equipe e envie notificações
            </Text>
            <TouchableOpacity
              className="bg-purple-600 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("../admin-stats" as any);
              }}
            >
              <Text className="text-center font-semibold text-white">
                Acessar Dashboard
              </Text>
            </TouchableOpacity>
          </Card>



          {/* Notificações Semanais */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📬 Notificações Semanais</Text>
            <Text className="text-sm text-muted">
              Receba resumos do seu progresso de saúde toda semana
            </Text>
            <TouchableOpacity
              className="bg-indigo-600 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notificacoes-semanais");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Configurar Notificações
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Preferências e Notificações */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">⚙️ Preferências</Text>
            <Text className="text-sm text-muted">
              Configure notificações, lembretes e horários personalizados
            </Text>
            <TouchableOpacity
              className="bg-purple-500 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/preferencias");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Abrir Preferências
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Configuração de Pausas Ativas */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🧘 Pausas Ativas</Text>
            <Text className="text-sm text-muted">
              Personalize os horários das pausas ativas
            </Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/configurar-pausas");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Configurar Horários
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Configuração de Notificações */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🔔 Notificações</Text>
            <Text className="text-sm text-muted">
              Configure lembretes de check-in e pausas ativas
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notification-settings");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Configurar Notificações
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Backup e Restauração */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">💾 Backup</Text>
            <Text className="text-sm text-muted">
              Proteja seus dados criando backups regulares
            </Text>
            <TouchableOpacity
              className="bg-green-600 rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/backup");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Gerenciar Backups
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Rever Tutorial */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🎓 Tutorial</Text>
            <Text className="text-sm text-muted">
              Quer rever como usar o aplicativo? Assista ao tutorial novamente
            </Text>
            <TouchableOpacity
              className="bg-purple-500 rounded-lg py-3 active:opacity-80"
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await resetOnboarding();
                router.replace("/onboarding");
              }}
            >
              <Text className="text-center font-semibold text-white">
                🔄 Rever Tutorial
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Contato SESMT */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Contato SESMT</Text>
            <Text className="text-sm text-muted">
              Precisa falar com o Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho?
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={handleLigarSESMT}
            >
              <Text className="text-center font-semibold text-white">
                📞 Ligar para SESMT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-green-500 rounded-lg py-3 active:opacity-80"
              onPress={handleContatoSESMT}
            >
              <Text className="text-center font-semibold text-white">
                💬 Enviar Mensagem WhatsApp
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-muted text-center">
              Saúde Ocupacional: (21) 99822-5493
            </Text>
          </Card>

          {/* Enviar Feedback */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">💬 Enviar Feedback</Text>
            <Text className="text-sm text-muted">
              Ajude-nos a melhorar! Envie sugestões, relate problemas ou compartilhe elogios
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/enviar-feedback");
              }}
            >
              <Text className="text-center font-semibold text-white">
                📤 Enviar Feedback
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Sobre o App */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🌱 Sobre o App</Text>
            <Text className="text-sm text-muted">
              Conheça a criadora, propriedade intelectual e funcionalidades do Canteiro Saudável
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/sobre");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Ver Informações Completas
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Versão e Obra */}
          <Card className="gap-3">
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Versão</Text>
                <Text className="text-sm text-foreground font-semibold">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Obra</Text>
                <Text className="text-sm text-foreground font-semibold">345</Text>
              </View>
            </View>
          </Card>

          {/* Dica */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Mantenha seus dados atualizados para que o SESMT possa entrar em contato em caso de necessidade.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
