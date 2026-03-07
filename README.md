# 🏗️ Canteiro Saudável - Painel Administrativo

Painel web standalone para administradores monitorarem a saúde e bem-estar dos funcionários em tempo real.

## 📋 Características

✅ **Independente** - Funciona separado do app mobile  
✅ **Tempo Real** - Dados sincronizados automaticamente via Firebase  
✅ **Responsivo** - Funciona em desktop, tablet e mobile  
✅ **Seguro** - Sistema de login para proteger dados sensíveis  
✅ **Completo** - Estatísticas, lista de funcionários, relatórios e gráficos  

---

## 🚀 Como Usar

### 1. Configurar Firebase

Abra o arquivo `app.js` e substitua as credenciais do Firebase pelas suas:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

**Onde encontrar essas credenciais:**
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Role até **Seus aplicativos** → **SDK setup and configuration**
5. Copie o objeto `firebaseConfig`

### 2. Testar Localmente

Você precisa de um servidor HTTP local (não funciona abrindo o arquivo HTML diretamente):

**Opção 1: Python**
```bash
cd canteiro-saudavel-admin
python3 -m http.server 8000
```

**Opção 2: Node.js**
```bash
cd canteiro-saudavel-admin
npx serve
```

**Opção 3: VS Code**
- Instale a extensão "Live Server"
- Clique com botão direito em `index.html` → "Open with Live Server"

Depois acesse: `http://localhost:8000`

### 3. Login

**Credenciais padrão:**
- Email: `admin@canteiro.com`
- Senha: `admin123`

**Ou:**
- Email: `sesmt@empresa.com`
- Senha: `sesmt2024`

---

## 🌐 Hospedar Online (Grátis)

### Opção 1: GitHub Pages (Recomendado)

1. **Criar repositório no GitHub:**
   ```bash
   cd canteiro-saudavel-admin
   git init
   git add .
   git commit -m "Painel admin inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/canteiro-admin.git
   git push -u origin main
   ```

2. **Ativar GitHub Pages:**
   - Vá em **Settings** → **Pages**
   - Em **Source**, selecione `main` branch
   - Clique em **Save**
   - Aguarde alguns minutos

3. **Acessar:**
   - URL: `https://SEU_USUARIO.github.io/canteiro-admin/`

### Opção 2: Vercel

1. Instale Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd canteiro-saudavel-admin
   vercel
   ```

3. Siga as instruções no terminal

### Opção 3: Netlify

1. Acesse [netlify.com](https://www.netlify.com/)
2. Arraste a pasta `canteiro-saudavel-admin` para o site
3. Pronto! URL gerada automaticamente

---

## 📊 Funcionalidades

### Visão Geral
- **Funcionários Ativos**: Quantos fizeram check-in nos últimos 7 dias
- **Hidratação Média**: Percentual médio de meta atingida
- **Pressão Monitorada**: Funcionários com registro recente
- **Queixas na Semana**: Total de sintomas reportados
- **Check-ins Hoje**: Funcionários que fizeram check-in hoje
- **Desafios Ativos**: Total de desafios em andamento

### Funcionários
- Lista completa com status (ativo/inativo)
- Cargo, turno, matrícula
- Hidratação do dia
- Última pressão arterial
- Queixas recentes
- Último check-in
- **Busca**: Filtre por nome ou matrícula

### Relatórios
- Gráficos de evolução semanal/mensal
- Hidratação, pressão, queixas, check-ins
- Exportação para PDF (em desenvolvimento)

---

## 🔐 Segurança

### Alterar Credenciais de Login

Edite o arquivo `app.js`, linha ~50:

```javascript
const validCredentials = [
    { email: 'admin@canteiro.com', password: 'admin123' },
    { email: 'sesmt@empresa.com', password: 'sesmt2024' },
    // Adicione mais usuários aqui
];
```

**⚠️ IMPORTANTE:** Em produção, use Firebase Authentication para segurança real.

### Regras do Firebase

Configure regras de segurança no Firebase Console:

```json
{
  "rules": {
    "canteiro-saudavel": {
      "employees": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## 🛠️ Personalização

### Cores

Edite `styles.css`, linhas 8-18:

```css
:root {
    --primary: #0a7ea4;      /* Cor principal */
    --background: #ffffff;    /* Fundo */
    --foreground: #11181C;    /* Texto */
    --muted: #687076;         /* Texto secundário */
    /* ... */
}
```

### Logo

Substitua o emoji 🏗️ por uma imagem:

```html
<!-- Em index.html, linha ~19 -->
<div class="logo">
    <img src="logo.png" alt="Logo" width="80">
    <h1>Canteiro Saudável</h1>
</div>
```

---

## 📱 Dados em Tempo Real

O painel se conecta ao Firebase Realtime Database e atualiza automaticamente quando:
- Funcionário faz check-in
- Registra hidratação
- Reporta sintomas
- Mede pressão arterial
- Completa desafios

**Não precisa recarregar a página!**

---

## 🐛 Solução de Problemas

### "Erro ao carregar dados do Firebase"
- Verifique se as credenciais em `app.js` estão corretas
- Confirme que o Firebase Realtime Database está ativado
- Verifique as regras de segurança do Firebase

### "Nenhum funcionário cadastrado"
- Certifique-se de que há dados no caminho: `canteiro-saudavel/employees/`
- Use o app mobile para cadastrar funcionários

### Página em branco
- Abra o Console do navegador (F12) para ver erros
- Verifique se está usando servidor HTTP (não `file://`)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o Console do navegador (F12)
2. Consulte a documentação do Firebase
3. Entre em contato com o desenvolvedor

---

## 📄 Licença

Este painel foi desenvolvido especificamente para o projeto Canteiro Saudável.

---

**Desenvolvido com ❤️ para a segurança e saúde dos trabalhadores**
