import { ScrollView, Text, View, TouchableOpacity, TextInput, Pressable, Alert, Linking } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthData } from "@/hooks/use-health-data";
import { UserProfile } from "@/lib/types";
import * as Haptics from "expo-haptics";

const SESMT_PHONE = "21998225493";
const SESMT_NAME = "Saúde Ocupacional";

export default function PerfilScreen() {
  const { profile, saveProfile } = useHealthData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: "",
    cpf: "",
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

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.cpf || !formData.cargo || !formData.turno) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    const newProfile: UserProfile = {
      id: profile?.id || Date.now().toString(),
      name: formData.name,
      cpf: formData.cpf,
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
    const url = `whatsapp://send?phone=${SESMT_PHONE}&text=${encodeURIComponent(message)}`;

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
                  <Text className="text-xs text-muted mb-1">CPF</Text>
                  <Text className="text-base text-foreground">{profile.cpf}</Text>
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
                  <Text className="text-xs text-muted mb-1">CPF</Text>
                  <TextInput
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholder="000.000.000-00"
                    placeholderTextColor="#687076"
                    value={formData.cpf}
                    onChangeText={(text) => setFormData({ ...formData, cpf: text })}
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

          {/* Sobre o App */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Sobre</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Versão</Text>
                <Text className="text-sm text-foreground font-semibold">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Desenvolvido por</Text>
                <Text className="text-sm text-foreground font-semibold">Denise Alves</Text>
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
