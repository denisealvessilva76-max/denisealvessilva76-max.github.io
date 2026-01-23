import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="p-6 bg-primary items-center">
          <Text className="text-3xl font-bold text-white mb-2">🌱 Canteiro Saudável</Text>
          <Text className="text-sm text-white/80">Versão 1.0.0</Text>
        </View>

        {/* Criadora */}
        <View className="p-6 bg-surface border-b border-border">
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-4xl">👩‍⚕️</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground text-center">
              Denise Alves da Silva
            </Text>
            <Text className="text-base text-primary font-semibold mt-1 text-center">
              Técnica de Enfermagem do Trabalho
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              Criadora e Idealizadora
            </Text>
          </View>

          <View className="bg-background rounded-xl p-4 border border-border">
            <Text className="text-sm text-foreground leading-relaxed text-center">
              O <Text className="font-bold">Canteiro Saudável</Text> foi desenvolvido com dedicação e expertise em saúde ocupacional, 
              visando promover o bem-estar e a segurança dos trabalhadores da construção civil, mineração e indústria.
            </Text>
          </View>
        </View>

        {/* Selo de Propriedade Intelectual */}
        <View className="p-6 bg-background">
          <View className="bg-surface rounded-xl p-6 border-2 border-primary items-center">
            <Image
              source={require("@/assets/images/selo-propriedade.png")}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />
            
            <Text className="text-lg font-bold text-foreground text-center mb-2">
              PROPRIEDADE INTELECTUAL PROTEGIDA
            </Text>
            
            <View className="w-full bg-background rounded-lg p-4 mt-3">
              <Text className="text-xs text-muted text-center leading-relaxed">
                © 2026 Denise Alves da Silva. Todos os direitos reservados.
              </Text>
              <Text className="text-xs text-muted text-center leading-relaxed mt-2">
                Este aplicativo, incluindo seu conceito, design, funcionalidades e metodologia, 
                é propriedade intelectual exclusiva de Denise Alves da Silva.
              </Text>
              <Text className="text-xs text-muted text-center leading-relaxed mt-2">
                É proibida a reprodução, distribuição, modificação ou uso comercial 
                sem autorização expressa por escrito da criadora.
              </Text>
              <Text className="text-xs text-muted text-center leading-relaxed mt-2 font-semibold">
                Registro de Propriedade Intelectual em processo.
              </Text>
            </View>

            <View className="flex-row items-center mt-4 bg-warning/10 rounded-lg p-3">
              <Text className="text-2xl mr-2">⚠️</Text>
              <Text className="flex-1 text-xs text-foreground font-semibold">
                Plágio ou apropriação indevida estão sujeitos às penalidades da Lei nº 9.610/98 (Lei de Direitos Autorais)
              </Text>
            </View>
          </View>
        </View>

        {/* Sobre o App */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-foreground mb-3">Sobre o Aplicativo</Text>
          
          <View className="bg-surface rounded-xl p-4 border border-border mb-3">
            <Text className="text-sm font-semibold text-foreground mb-2">🎯 Missão</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Promover a saúde ocupacional e prevenir lesões no ambiente de trabalho através de 
              tecnologia acessível e monitoramento contínuo.
            </Text>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border mb-3">
            <Text className="text-sm font-semibold text-foreground mb-2">✨ Funcionalidades</Text>
            <Text className="text-sm text-muted leading-relaxed">
              • Check-in diário de saúde{'\n'}
              • Monitoramento de pressão arterial{'\n'}
              • Contador de hidratação{'\n'}
              • Registro de sintomas e dores{'\n'}
              • Dicas de ergonomia e prevenção{'\n'}
              • Desafios de saúde gamificados{'\n'}
              • Painel administrativo SESMT{'\n'}
              • Notificações inteligentes
            </Text>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">📧 Contato</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Para informações sobre licenciamento, parcerias ou sugestões:{'\n'}
              <Text className="text-primary font-semibold">denise.silva@mip.com.br</Text>
            </Text>
          </View>
        </View>

        {/* Botão Voltar */}
        <View className="px-6 pb-6">
          <TouchableOpacity
            className="bg-primary rounded-xl p-4"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-center font-semibold text-white">← Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
