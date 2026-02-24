import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, Alert, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface RegisterModalProps {
  visible: boolean;
  onRegister: (matricula: string, name: string) => Promise<boolean>;
  onClose?: () => void;
}

/**
 * Modal de cadastro simples para primeiro acesso
 * 
 * Solicita matrícula e nome completo do empregado
 * Valida campos obrigatórios e fornece feedback visual
 */
export function RegisterModal({ visible, onRegister, onClose }: RegisterModalProps) {
  const colors = useColors();
  const [matricula, setMatricula] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validação
    if (!matricula.trim()) {
      Alert.alert("Atenção", "Por favor, informe sua matrícula");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Atenção", "Por favor, informe seu nome completo");
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert("Atenção", "Nome deve ter pelo menos 3 caracteres");
      return;
    }

    try {
      setLoading(true);

      // Feedback háptico
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Chamar callback de registro
      const success = await onRegister(matricula.trim(), name.trim());

      if (success) {
        // Feedback de sucesso
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Limpar campos
        setMatricula("");
        setName("");
      } else {
        // Feedback de erro
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("Erro", "Não foi possível completar o cadastro. Tente novamente.");
      }
    } catch (error) {
      console.error("[RegisterModal] Error:", error);
      Alert.alert("Erro", "Ocorreu um erro ao salvar seus dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {/* Título */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.foreground,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Bem-vindo! 👋
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 24,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Para começar, precisamos de algumas informações básicas
          </Text>

          {/* Campo Matrícula */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Matrícula
            </Text>
            <TextInput
              value={matricula}
              defaultValue={matricula}
              onChangeText={setMatricula}
              placeholder="Digite sua matrícula"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!loading}
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Campo Nome */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Nome Completo
            </Text>
            <TextInput
              value={name}
              defaultValue={name}
              onChangeText={setName}
              placeholder="Digite seu nome completo"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!loading}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {/* Botão Cadastrar */}
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: loading ? colors.muted : colors.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text
                style={{
                  color: colors.background,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Cadastrar
              </Text>
            )}
          </Pressable>

          {/* Informação adicional */}
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 16,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            Seus dados serão salvos com segurança e você poderá atualizá-los a qualquer momento no perfil
          </Text>
        </View>
      </View>
    </Modal>
  );
}
