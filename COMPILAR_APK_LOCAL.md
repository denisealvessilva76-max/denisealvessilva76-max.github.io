# 🚀 Guia Completo: Compilar APK Localmente

Este guia explica como compilar o APK do **Canteiro Saudável** na sua máquina, contornando o erro de timeout da plataforma Manus.

---

## 📋 Pré-requisitos

### 1. Instalar Node.js (v18 ou superior)
- **Windows/Mac:** Baixe em https://nodejs.org
- **Linux:** 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 2. Instalar Git
- **Windows:** https://git-scm.com/download/win
- **Mac:** `brew install git`
- **Linux:** `sudo apt-get install git`

### 3. Criar Conta no Expo (Gratuita)
- Acesse: https://expo.dev/signup
- Crie uma conta gratuita
- Confirme o e-mail

---

## 🔧 Passo 1: Extrair o Projeto

1. **Baixe o arquivo ZIP** que enviei
2. **Extraia** para uma pasta (ex: `C:\projetos\canteiro-saudavel`)
3. **Abra o terminal** nessa pasta:
   - **Windows:** Shift + Clique direito na pasta → "Abrir janela do PowerShell aqui"
   - **Mac/Linux:** Abra o Terminal e navegue até a pasta com `cd`

---

## 🔧 Passo 2: Instalar Dependências

Execute os comandos abaixo **um por vez**:

```bash
# Instalar pnpm (gerenciador de pacotes)
npm install -g pnpm

# Instalar dependências do projeto
pnpm install

# Instalar Expo CLI globalmente
npm install -g expo-cli

# Instalar EAS CLI (ferramenta de build)
npm install -g eas-cli
```

**Aguarde a instalação** (pode levar 5-10 minutos).

---

## 🔧 Passo 3: Fazer Login no Expo

```bash
# Fazer login com sua conta Expo
eas login
```

Digite seu **e-mail** e **senha** do Expo quando solicitado.

---

## 🔧 Passo 4: Configurar o Projeto

```bash
# Configurar EAS Build
eas build:configure
```

Quando perguntar:
- **"Select a platform"** → Escolha `Android`
- **"Would you like to automatically create an EAS project?"** → Digite `Y` (Yes)

---

## 🔧 Passo 5: Compilar o APK

### **Opção A: APK de Desenvolvimento (Mais Rápido - 5-10 min)**

```bash
eas build --platform android --profile preview
```

Este APK é ideal para **testes internos** e pode ser instalado diretamente no celular.

### **Opção B: APK de Produção (Mais Lento - 15-20 min)**

```bash
eas build --platform android --profile production
```

Este APK é otimizado para **distribuição final** (Play Store ou instalação manual).

---

## 📱 Passo 6: Baixar o APK

Após a compilação:

1. O terminal mostrará um **link** para baixar o APK
2. Exemplo: `https://expo.dev/accounts/seu-usuario/projects/canteiro-saudavel/builds/abc123`
3. **Abra o link** no navegador
4. **Clique em "Download"** para baixar o arquivo `.apk`

**Ou acesse:** https://expo.dev/accounts/[seu-usuario]/builds

---

## 📲 Passo 7: Instalar no Celular Android

### **Método 1: Via USB**
1. Conecte o celular no computador via USB
2. Copie o arquivo `.apk` para o celular
3. No celular, abra o arquivo `.apk`
4. Se aparecer "Instalar apps de fontes desconhecidas":
   - Vá em **Configurações → Segurança**
   - Ative **"Fontes desconhecidas"** ou **"Instalar apps desconhecidos"**
5. Toque em **"Instalar"**

### **Método 2: Via WhatsApp/Telegram**
1. Envie o arquivo `.apk` para você mesmo no WhatsApp/Telegram
2. No celular, baixe o arquivo
3. Abra e instale (ative "Fontes desconhecidas" se necessário)

### **Método 3: Via Google Drive**
1. Faça upload do `.apk` para o Google Drive
2. No celular, baixe do Drive
3. Abra e instale

---

## ⚠️ Solução de Problemas

### **Erro: "eas: command not found"**
```bash
npm install -g eas-cli
```

### **Erro: "No valid Expo account"**
```bash
eas logout
eas login
```

### **Erro: "Build failed"**
- Verifique sua conexão com a internet
- Tente novamente: `eas build --platform android --profile preview`
- Se persistir, execute: `eas build --platform android --profile preview --clear-cache`

### **Erro: "EACCES: permission denied"** (Linux/Mac)
```bash
sudo npm install -g eas-cli expo-cli pnpm
```

### **Compilação muito lenta?**
- Isso é normal na primeira vez (pode levar 20-30 minutos)
- Compilações futuras serão mais rápidas (5-10 minutos)

---

## 🎯 Comandos Úteis

```bash
# Ver histórico de builds
eas build:list

# Cancelar build em andamento
eas build:cancel

# Ver logs detalhados
eas build:view

# Limpar cache e recompilar
eas build --platform android --profile preview --clear-cache
```

---

## 📊 Comparação: Preview vs Production

| Característica | Preview (Desenvolvimento) | Production (Produção) |
|----------------|---------------------------|------------------------|
| **Tempo de build** | 5-10 minutos | 15-20 minutos |
| **Tamanho do APK** | ~50-80 MB | ~30-50 MB (otimizado) |
| **Uso** | Testes internos | Distribuição final |
| **Debug** | Habilitado | Desabilitado |
| **Performance** | Normal | Otimizada |

**Recomendação:** Use `preview` para testes rápidos e `production` para versão final.

---

## 🔐 Credenciais para Teste

### **Login Admin:**
- Usuário: `admin`
- Senha: `1234`

### **Gerar Dados de Teste:**
1. Faça login como admin
2. Vá em **Relatórios**
3. Clique em **"👥 Gerar 15 Funcionários Falsos"**
4. Valide o Dashboard com dados realistas

---

## 📝 Notas Importantes

1. **Primeira compilação:** Pode levar até 30 minutos (normal)
2. **Conta Expo gratuita:** Permite builds ilimitados
3. **Validade do APK:** O APK gerado não expira
4. **Atualizações:** Para gerar novo APK, execute `eas build` novamente
5. **Sem Expo Go:** O APK compilado **não precisa** do Expo Go instalado

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `eas build:view`
2. **Limpe o cache:** `eas build --clear-cache`
3. **Documentação oficial:** https://docs.expo.dev/build/setup/
4. **Fórum Expo:** https://forums.expo.dev/

---

## ✅ Checklist de Compilação

- [ ] Node.js instalado (v18+)
- [ ] Git instalado
- [ ] Conta Expo criada
- [ ] pnpm instalado globalmente
- [ ] Dependências instaladas (`pnpm install`)
- [ ] EAS CLI instalado (`npm install -g eas-cli`)
- [ ] Login no Expo (`eas login`)
- [ ] Projeto configurado (`eas build:configure`)
- [ ] Build executado (`eas build --platform android --profile preview`)
- [ ] APK baixado do link fornecido
- [ ] APK instalado no celular Android

---

## 🎉 Pronto!

Após seguir todos os passos, você terá o APK do **Canteiro Saudável** instalado no seu celular Android, pronto para testes e distribuição! 🚀

**Tempo total estimado:** 30-45 minutos (primeira vez)
