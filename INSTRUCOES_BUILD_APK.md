# 📦 Instruções para Gerar APK do Canteiro Saudável

## 🎯 Objetivo

Este documento fornece instruções passo a passo para gerar um arquivo APK do aplicativo **Canteiro Saudável** para instalação e testes em dispositivos Android reais.

---

## 🔧 Pré-requisitos

1. **Conta Expo** (gratuita)
   - Criar em: https://expo.dev/signup
   - Anote seu email e senha

2. **EAS CLI instalado**
   ```bash
   npm install -g eas-cli
   ```

3. **Projeto baixado**
   - Baixe o checkpoint mais recente do projeto
   - Extraia para uma pasta local

---

## 📱 Opção 1: Build via Expo EAS (Recomendado)

### Passo 1: Fazer Login no EAS CLI

```bash
cd /caminho/para/canteiro-saudavel
eas login
```

Digite seu email e senha da conta Expo.

### Passo 2: Configurar EAS Build

```bash
eas build:configure
```

Isso criará o arquivo `eas.json` com as configurações de build.

### Passo 3: Iniciar Build do APK

```bash
eas build --platform android --profile preview
```

**Opções:**
- `--profile preview`: Gera APK para testes (não precisa de Google Play)
- `--profile production`: Gera AAB para publicação na Play Store

### Passo 4: Aguardar Build

O build é feito na nuvem da Expo e pode levar **10-20 minutos**.

Você verá o progresso no terminal e receberá um link para acompanhar online:
```
https://expo.dev/accounts/[seu-usuario]/projects/canteiro-saudavel/builds/[build-id]
```

### Passo 5: Baixar APK

Quando o build terminar, você receberá um link para download do APK:
```
https://expo.dev/artifacts/eas/[artifact-id].apk
```

Baixe o arquivo e transfira para o dispositivo Android.

---

## 🔨 Opção 2: Build Local (Avançado)

### Pré-requisitos Adicionais

1. **Android Studio** instalado
2. **Java JDK 17** instalado
3. **Android SDK** configurado

### Passo 1: Configurar Variáveis de Ambiente

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

### Passo 2: Gerar APK Local

```bash
cd /caminho/para/canteiro-saudavel
eas build --platform android --profile preview --local
```

O APK será gerado na pasta do projeto.

---

## 📲 Instalação no Dispositivo Android

### Método 1: Via USB

1. Conecte o dispositivo Android ao computador via USB
2. Ative "Depuração USB" nas Configurações do Desenvolvedor
3. Copie o APK para o dispositivo:
   ```bash
   adb install canteiro-saudavel.apk
   ```

### Método 2: Via Download Direto

1. Envie o APK para o dispositivo (email, WhatsApp, Google Drive, etc.)
2. No dispositivo, abra o arquivo APK
3. Permita "Instalar de fontes desconhecidas" se solicitado
4. Toque em "Instalar"

---

## 🧪 Testes Recomendados

Após instalar o APK, teste as seguintes funcionalidades:

### 1. Cadastro e Login
- [ ] Cadastrar novo funcionário
- [ ] Fazer login com CPF e matrícula
- [ ] Verificar persistência de login (fechar e reabrir app)

### 2. Check-in Diário
- [ ] Fazer check-in "Tudo bem"
- [ ] Fazer check-in "Dor leve" (deve abrir formulário)
- [ ] Fazer check-in "Dor forte" (deve abrir formulário)

### 3. Hidratação
- [ ] Registrar ingestão de água
- [ ] Verificar atualização do progresso
- [ ] Verificar meta de hidratação

### 4. Pressão Arterial
- [ ] Registrar pressão arterial
- [ ] Verificar classificação (Normal/Pré-hipertensão/Hipertensão)
- [ ] Verificar alertas para valores elevados

### 5. Queixas de Saúde
- [ ] Registrar queixa detalhada
- [ ] Verificar gravidade (leve/moderada/grave)
- [ ] Verificar salvamento

### 6. Dashboard Admin
- [ ] Fazer login como admin (admin / 1234)
- [ ] Gerar dados de teste
- [ ] Verificar estatísticas gerais
- [ ] Abrir modals (Queixas, Desafios, Check-ins)
- [ ] Visualizar aba de Gráficos
- [ ] Exportar PDF
- [ ] Configurar backup automático

### 7. Perfil
- [ ] Editar dados pessoais
- [ ] Verificar salvamento automático
- [ ] Selecionar avatar

### 8. Notificações
- [ ] Verificar lembretes de hidratação
- [ ] Verificar notificações de medalhas

---

## 🐛 Solução de Problemas

### Erro: "App not installed"
- Desinstale versões antigas do app antes de instalar
- Verifique se o dispositivo tem espaço suficiente

### Erro: "Parse error"
- O APK pode estar corrompido, baixe novamente
- Verifique se o dispositivo é Android 8.0 ou superior

### App crasha ao abrir
- Limpe o cache do app nas configurações
- Reinstale o app
- Verifique logs com `adb logcat`

### Gráficos não aparecem
- Verifique se o dispositivo tem OpenGL ES 2.0 ou superior
- Reinicie o app

---

## 📊 Configuração do Banco de Dados (Opcional)

Se quiser testar sincronização com backend PostgreSQL:

1. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   DATABASE_URL=postgresql://usuario:senha@host:porta/banco
   ```

2. Execute as migrations:
   ```bash
   pnpm db:push
   ```

3. Reinicie o servidor:
   ```bash
   pnpm dev
   ```

---

## 🔐 Credenciais de Teste

**Admin:**
- Login: `admin`
- Senha: `1234`

**Funcionário de Teste:**
- CPF: `123.456.789-00`
- Matrícula: `FUNC001`

---

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação Expo: https://docs.expo.dev/build/setup/
- Fórum Expo: https://forums.expo.dev/
- GitHub Issues: (adicione o link do seu repositório)

---

## 🎉 Próximos Passos

Após validar o APK:

1. **Migrar para backend PostgreSQL**
   - Atualizar hook `useHealthData` para usar APIs tRPC
   - Atualizar Dashboard Admin para buscar dados do banco
   - Testar sincronização em tempo real

2. **Adicionar gráficos dinâmicos**
   - Conectar gráficos aos dados reais do banco
   - Implementar filtros por período (semana/mês)

3. **Publicar na Google Play Store**
   - Criar conta de desenvolvedor (US$ 25 única vez)
   - Gerar AAB de produção: `eas build --platform android --profile production`
   - Enviar para revisão da Google

---

**Desenvolvido por:** Denise Alves - Obra 345  
**Versão:** 1.0.0  
**Data:** Fevereiro 2026
