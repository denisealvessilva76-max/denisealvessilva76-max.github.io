import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import * as Haptics from "expo-haptics";

export default function SaudeMentalScreen() {
  const router = useRouter();

  const handleOpenLink = async (url: string, errorMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erro", errorMessage);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o link");
    }
  };

  const handleContatoPsicologa = () => {
    Alert.alert(
      "Contato com Psicóloga Brenda",
      "Psicóloga/Analista Brenda\nAtendimento presencial na obra ou teleconsulta\n\n📱 WhatsApp: (31) 99589-2351\n\n✅ Sigilo profissional garantido por lei.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir WhatsApp", onPress: () => Linking.openURL("https://wa.me/5531995892351?text=Olá, gostaria de agendar um atendimento com a Psicóloga Brenda") },
      ]
    );
  };

  const handleContatoAssistenteSocial = () => {
    Alert.alert(
      "Contato com Assistente Social Luciana",
      "Assistente Social Luciana\nOrientação e apoio em questões sociais\n\n📱 WhatsApp: (31) 99589-2351\n\n✅ Sigilo profissional garantido por lei.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir WhatsApp", onPress: () => Linking.openURL("https://wa.me/5531995892351?text=Olá, gostaria de agendar um atendimento com a Assistente Social Luciana") },
      ]
    );
  };

  const handleCVV = async () => {
    Alert.alert(
      "CVV - Centro de Valorização da Vida",
      "Ligue 188 (gratuito) ou acesse o chat online.\n\nAtendimento 24 horas, todos os dias.\nVoluntários treinados para apoio emocional e prevenção do suicídio.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ligar 188", onPress: () => Linking.openURL("tel:188") },
        { text: "Chat Online", onPress: () => handleOpenLink("https://www.cvv.org.br/", "Não foi possível abrir o site") },
      ]
    );
  };

  const handleCAPS = () => {
    Alert.alert(
      "CAPS - Canaã dos Carajás",
      "Centro de Atenção Psicossocial\n\n📍 Rua Asdrubal Bentes, 442\nCentro, Canaã dos Carajás - PA\n\nAtendimento psiquiátrico para pessoas com transtornos mentais.",
      [
        { text: "Fechar", style: "cancel" },
        { text: "Ver no Mapa", onPress: () => handleOpenLink("https://www.google.com/maps/search/?api=1&query=Rua+Asdrubal+Bentes+442+Canaa+dos+Carajas+PA", "Não foi possível abrir o mapa") },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-2">
              <Text className="text-primary text-base">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">💙 Saúde Mental</Text>
            <Text className="text-base text-muted">
              Você não está sozinho. Aqui estão recursos para te ajudar.
            </Text>
          </View>

          {/* Aviso de Sigilo */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">🔒 Sigilo Profissional</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Todos os atendimentos psicológicos e de assistência social são protegidos por{" "}
              <Text className="font-bold">sigilo profissional garantido por lei</Text>. Suas
              informações são confidenciais e não serão compartilhadas sem sua autorização.
            </Text>
          </Card>

          {/* Profissionais da Obra */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">👥 Profissionais da Obra</Text>

            <View className="gap-3">
              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">
                  🧠 Psicóloga/Analista - Brenda
                </Text>
                <Text className="text-sm text-muted">
                  Atendimento presencial na obra ou teleconsulta
                </Text>
                <Text className="text-sm text-foreground">
                  📱 (31) 99589-2351
                </Text>
                <TouchableOpacity
                  className="bg-green-600 rounded-lg py-3 active:opacity-80"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleContatoPsicologa();
                  }}
                >
                  <Text className="text-center font-semibold text-white">
                    💬 Agendar via WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">
                  🤝 Assistente Social - Luciana
                </Text>
                <Text className="text-sm text-muted">
                  Orientação e apoio em questões sociais
                </Text>
                <Text className="text-sm text-foreground">
                  📱 (31) 99589-2351
                </Text>
                <TouchableOpacity
                  className="bg-green-600 rounded-lg py-3 active:opacity-80"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleContatoAssistenteSocial();
                  }}
                >
                  <Text className="text-center font-semibold text-white">
                    💬 Agendar via WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-xs text-muted italic">
              💡 Clique no botão verde para enviar mensagem via WhatsApp
            </Text>
          </Card>

          {/* Recursos de Emergência */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">🚨 Recursos de Emergência</Text>

            <View className="gap-3">
              <TouchableOpacity
                className="bg-red-500 rounded-lg p-4 active:opacity-80"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleCVV();
                }}
              >
                <Text className="text-center font-bold text-white text-base">
                  📞 CVV - 188 (Gratuito)
                </Text>
                <Text className="text-center text-white text-sm mt-1">
                  Apoio emocional 24h - Ligue ou chat online
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary rounded-lg p-4 active:opacity-80"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleCAPS();
                }}
              >
                <Text className="text-center font-bold text-white text-base">
                  🏥 CAPS - Canaã dos Carajás
                </Text>
                <Text className="text-center text-white text-sm mt-1">
                  Centro de Atenção Psicossocial
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Guias de Apoio */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">📚 Guias de Apoio</Text>

            <View className="gap-3">
              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">
                  🌬️ Técnica de Respiração 4-7-8
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  1. Inspire pelo nariz por 4 segundos{"\n"}
                  2. Segure a respiração por 7 segundos{"\n"}
                  3. Expire pela boca por 8 segundos{"\n"}
                  4. Repita 3-4 vezes
                </Text>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">
                  💭 Quando Procurar Ajuda
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  • Sentimentos de tristeza ou ansiedade persistentes{"\n"}
                  • Dificuldade para dormir ou concentrar{"\n"}
                  • Perda de interesse em atividades{"\n"}
                  • Pensamentos negativos recorrentes{"\n"}
                  • Mudanças no apetite ou peso{"\n"}
                  • Isolamento social
                </Text>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">
                  🌟 Dicas para o Dia a Dia
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  • Converse com alguém de confiança{"\n"}
                  • Pratique atividades físicas regularmente{"\n"}
                  • Mantenha uma rotina de sono{"\n"}
                  • Evite álcool e drogas{"\n"}
                  • Faça pausas durante o trabalho{"\n"}
                  • Busque momentos de lazer
                </Text>
              </View>
            </View>
          </Card>

          {/* Mapa da Saúde Mental */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🗺️ Mapa da Saúde Mental</Text>
            <Text className="text-sm text-muted">
              Encontre recursos de saúde mental em todo o Brasil
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleOpenLink("https://mapasaudemental.com.br/", "Não foi possível abrir o mapa");
              }}
            >
              <Text className="text-center font-semibold text-white">
                Acessar Mapa
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Mensagem de Encorajamento */}
          <Card className="bg-green-500/10 border border-green-500 gap-2">
            <Text className="text-sm font-semibold text-green-600">💚 Lembre-se</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Cuidar da saúde mental é tão importante quanto cuidar da saúde física. Não hesite
              em buscar ajuda quando precisar. Você merece se sentir bem!
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
