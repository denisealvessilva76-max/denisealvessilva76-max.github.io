import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminBackupConfigScreen() {
  const [loading, setLoading] = useState(false);

  // Configurações de e-mail
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // Configurações de backup
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupEmail, setBackupEmail] = useState("");
  const [backupHour, setBackupHour] = useState("8");
  const [backupMinute, setBackupMinute] = useState("0");

  // Carregar configurações salvas
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem("backup_config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setSmtpHost(config.smtpHost || "smtp.gmail.com");
        setSmtpPort(config.smtpPort || "587");
        setSmtpSecure(config.smtpSecure || false);
        setSmtpUser(config.smtpUser || "");
        setSmtpPass(config.smtpPass || "");
        setBackupEnabled(config.backupEnabled || false);
        setBackupEmail(config.backupEmail || "");
        setBackupHour(config.backupHour || "8");
        setBackupMinute(config.backupMinute || "0");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);

      // Validar campos
      if (!smtpUser || !smtpPass) {
        Alert.alert("Erro", "Preencha o e-mail e senha SMTP");
        return;
      }

      if (backupEnabled && !backupEmail) {
        Alert.alert("Erro", "Preencha o e-mail de destino do backup");
        return;
      }

      // Salvar configurações localmente
      const config = {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        backupEnabled,
        backupEmail,
        backupHour,
        backupMinute,
      };

      await AsyncStorage.setItem("backup_config", JSON.stringify(config));

      Alert.alert(
        "Sucesso",
        "Configurações salvas com sucesso!\n\nNOTA: O envio automático será ativado quando o backend estiver em produção."
      );
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      Alert.alert("Erro", "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = () => {
    Alert.alert(
      "Teste de E-mail",
      "Para testar o envio de e-mail, configure as variáveis de ambiente SMTP no servidor:\n\n" +
        "SMTP_HOST=" +
        smtpHost +
        "\n" +
        "SMTP_PORT=" +
        smtpPort +
        "\n" +
        "SMTP_USER=" +
        smtpUser +
        "\n" +
        "SMTP_PASS=sua_senha\n\n" +
        "Após configurar, reinicie o servidor e use o botão 'Enviar Relatório Agora'."
    );
  };

  const sendManualBackup = () => {
    Alert.alert(
      "Envio Manual",
      "O envio manual de relatórios será implementado quando o backend estiver configurado com as credenciais SMTP.\n\n" +
        "Configure as variáveis de ambiente no servidor e reinicie o serviço."
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Configuração de Backup</Text>
          <Text className="text-muted mt-2">
            Configure o envio automático de relatórios diários por e-mail
          </Text>
        </View>

        {/* Status */}
        <View className="p-4 rounded-lg mb-6 bg-blue-50 border-l-4 border-blue-500">
          <Text className="font-bold text-blue-800">ℹ️ Informação</Text>
          <Text className="text-sm mt-1 text-blue-700">
            As configurações são salvas localmente. Para ativar o envio automático, configure as
            variáveis de ambiente SMTP no servidor.
          </Text>
        </View>

        {/* Configurações SMTP */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Configurações SMTP</Text>

          <Text className="text-sm text-muted mb-2">Servidor SMTP</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
            placeholder="smtp.gmail.com"
            value={smtpHost}
            onChangeText={setSmtpHost}
            autoCapitalize="none"
          />

          <Text className="text-sm text-muted mb-2">Porta</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
            placeholder="587"
            value={smtpPort}
            onChangeText={setSmtpPort}
            keyboardType="numeric"
          />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm text-foreground">Conexão Segura (SSL/TLS)</Text>
            <Switch value={smtpSecure} onValueChange={setSmtpSecure} />
          </View>

          <Text className="text-sm text-muted mb-2">E-mail</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
            placeholder="seu-email@gmail.com"
            value={smtpUser}
            onChangeText={setSmtpUser}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text className="text-sm text-muted mb-2">Senha do E-mail</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
            placeholder="Senha ou App Password"
            value={smtpPass}
            onChangeText={setSmtpPass}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={testEmailConnection}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Ver Instruções de Teste</Text>
          </TouchableOpacity>
        </View>

        {/* Configurações de Backup */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Backup Automático</Text>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm text-foreground">Ativar Backup Diário</Text>
            <Switch value={backupEnabled} onValueChange={setBackupEnabled} />
          </View>

          {backupEnabled && (
            <>
              <Text className="text-sm text-muted mb-2">E-mail de Destino (SESMT)</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
                placeholder="sesmt@empresa.com.br"
                value={backupEmail}
                onChangeText={setBackupEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text className="text-sm text-muted mb-2">Horário de Envio</Text>
              <View className="flex-row gap-2 mb-4">
                <TextInput
                  className="bg-surface border border-border rounded-lg p-3 flex-1 text-foreground"
                  placeholder="08"
                  value={backupHour}
                  onChangeText={setBackupHour}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text className="text-2xl text-foreground self-center">:</Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg p-3 flex-1 text-foreground"
                  placeholder="00"
                  value={backupMinute}
                  onChangeText={setBackupMinute}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View className="bg-blue-50 p-4 rounded-lg mb-4">
                <Text className="text-blue-800 text-sm">
                  📧 O relatório será enviado automaticamente todos os dias às {backupHour}:
                  {backupMinute} para {backupEmail || "(e-mail não configurado)"}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Botões de Ação */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            onPress={saveConfig}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
            className="bg-primary py-4 rounded-lg items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Salvar Configurações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={sendManualBackup}
            className="bg-surface border-2 border-primary py-4 rounded-lg items-center"
          >
            <Text className="text-primary font-bold text-base">Enviar Relatório Agora (Teste)</Text>
          </TouchableOpacity>
        </View>

        {/* Instruções */}
        <View className="bg-surface p-4 rounded-lg mb-4">
          <Text className="text-foreground font-bold mb-2">📝 Instruções para Gmail:</Text>
          <Text className="text-muted text-sm mb-2">
            1. Acesse sua conta Google em myaccount.google.com
          </Text>
          <Text className="text-muted text-sm mb-2">2. Vá em "Segurança" → "Senhas de app"</Text>
          <Text className="text-muted text-sm mb-2">
            3. Crie uma senha de app para "E-mail" e copie
          </Text>
          <Text className="text-muted text-sm mb-2">
            4. Use essa senha no campo "Senha do E-mail" acima
          </Text>
        </View>

        {/* Instruções de Produção */}
        <View className="bg-yellow-50 p-4 rounded-lg mb-8">
          <Text className="text-yellow-800 font-bold mb-2">⚙️ Configuração do Servidor:</Text>
          <Text className="text-yellow-700 text-sm mb-2">
            Para ativar o envio automático em produção, configure estas variáveis de ambiente no
            servidor:
          </Text>
          <View className="bg-white p-3 rounded mt-2">
            <Text className="text-xs font-mono text-foreground">SMTP_HOST={smtpHost}</Text>
            <Text className="text-xs font-mono text-foreground">SMTP_PORT={smtpPort}</Text>
            <Text className="text-xs font-mono text-foreground">SMTP_USER={smtpUser}</Text>
            <Text className="text-xs font-mono text-foreground">SMTP_PASS=***</Text>
            <Text className="text-xs font-mono text-foreground">
              BACKUP_ENABLED={backupEnabled ? "true" : "false"}
            </Text>
            <Text className="text-xs font-mono text-foreground">BACKUP_EMAIL={backupEmail}</Text>
            <Text className="text-xs font-mono text-foreground">
              BACKUP_SCHEDULE="0 {backupHour} * * *"
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
