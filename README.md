# 🏗️ Canteiro Saudável

**Aplicativo de Saúde Ocupacional para Trabalhadores da Construção Civil**

Canteiro Saudável é um aplicativo mobile desenvolvido para promover a saúde e bem-estar de trabalhadores da construção civil, com foco em prevenção de doenças ocupacionais, monitoramento de saúde e gamificação para engajamento.

---

## 📱 Funcionalidades Principais

### 🏠 Tela Home (Check-in Diário)
- Check-in diário com 3 níveis de bem-estar (😊 Bem, 😐 Dor Leve, 😣 Dor Forte)
- Histórico visual dos últimos 7 dias
- Botão flutuante para registro rápido de pressão arterial
- Próximas ações sugeridas com base no perfil do usuário
- Indicador de conquistas e pontos

### 🩺 Monitoramento de Saúde
- **Pressão Arterial**: Registro com classificação automática (Normal, Pré-hipertensão, Hipertensão)
- **Histórico Gráfico**: Visualização dos últimos 7 dias com barras coloridas
- **Tendências**: Análise de melhora, estabilidade ou piora
- **Alertas**: Notificações para valores críticos

### 💧 Hidratação Inteligente
- Meta personalizada baseada em peso e atividade
- Registro de copos de 150ml
- Medidor de cor de urina (escala de 7 cores)
- Lembretes configuráveis
- Progresso em tempo real

### 🧘 Pausas Ativas e Ergonomia
- Horários personalizados (manhã, tarde, noite)
- Exercícios de alongamento com ilustrações
- Contagem regressiva visual
- Notificações de lembrete
- Pontos por conclusão

### 🎮 Gamificação
- Sistema de pontos por ações saudáveis
- Conquistas desbloqueáveis (Bronze, Prata, Ouro, Diamante)
- Desafios semanais com upload de fotos
- Bônus de consistência (sequências de dias)
- Ranking e títulos especiais

### 💙 Saúde Mental
- Contatos diretos via WhatsApp:
  - **Psicóloga/Analista Brenda**: (31) 99589-2351
  - **Assistente Social Luciana**: (31) 99589-2351
- Recursos de emergência (CVV 188, CAPS)
- Técnicas de respiração guiada
- Mapa de saúde mental do Brasil
- Aviso de sigilo profissional

### 🔐 Painel Administrativo
- Login protegido por senha
- Dashboard com métricas gerais
- Visualização de queixas de saúde
- Relatórios completos (8 tipos):
  - Check-ins diários
  - Pressão arterial
  - Hidratação
  - Queixas de saúde
  - Desafios
  - Gamificação
  - Pausas ativas
  - Visão geral
- Exportação para PDF e envio por email
- Filtros por período

### ⚙️ Preferências e Configurações
- Ativar/desativar notificações
- Configurar horários de lembretes
- Ajustar intervalos de hidratação
- Alertas de pressão elevada
- Restaurar configurações padrão

### 💾 Backup e Restauração
- Criação de backup completo (JSON)
- Compartilhamento de arquivos
- Restauração de dados
- Limpeza total (factory reset)
- Indicador de tamanho dos dados

### 🌐 Modo Offline
- Funcionamento completo sem internet
- Sincronização automática ao reconectar
- Fila de pendências
- Retry automático (até 3 tentativas)
- Indicador de status de conexão

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Mobile App)
- **React Native 0.81** com **Expo SDK 54**
- **TypeScript 5.9** para type safety
- **Expo Router 6** para navegação
- **NativeWind 4** (Tailwind CSS para React Native)
- **React Query** para cache e sincronização
- **AsyncStorage** para persistência local
- **Expo Audio** para sons de notificação
- **Expo Haptics** para feedback tátil
- **Expo Image Picker** para upload de fotos
- **Expo Notifications** para lembretes
- **Expo Sharing** para compartilhamento de backups
- **React Native Reanimated 4** para animações

### Backend
- **Node.js** com **Express**
- **tRPC** para API type-safe
- **PostgreSQL** como banco de dados
- **Drizzle ORM** para queries
- **JWT** para autenticação
- **Zod** para validação de dados

### Infraestrutura
- **Expo Go** para desenvolvimento
- **EAS Build** para builds de produção
- **S3** para armazenamento de imagens
- **SMTP** para envio de emails

---

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 22.x ou superior
- pnpm 9.x ou superior
- Expo Go instalado no celular (para desenvolvimento)
- PostgreSQL (para backend)

### 1. Clonar o Repositório
```bash
git clone <repository-url>
cd canteiro-saudavel
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/canteiro_saudavel

# JWT
JWT_SECRET=your-secret-key-here

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# S3 (opcional)
S3_BUCKET=canteiro-saudavel
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### 4. Configurar Banco de Dados
```bash
pnpm db:push
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
pnpm dev
```

Isso iniciará:
- **Metro Bundler** na porta 8081 (app mobile)
- **API Server** na porta 3000 (backend)

### 6. Abrir no Celular
1. Abra o **Expo Go** no seu celular
2. Escaneie o QR code exibido no terminal
3. O app será carregado automaticamente

---

## 🧪 Testes

### Rodar Todos os Testes
```bash
pnpm test
```

### Rodar Testes em Modo Watch
```bash
pnpm test --watch
```

### Cobertura de Testes
```bash
pnpm test --coverage
```

---

## 📱 Build de Produção

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

### Ambos
```bash
eas build --platform all
```

---

## 📂 Estrutura do Projeto

```
canteiro-saudavel/
├── app/                          # Telas do app (Expo Router)
│   ├── (tabs)/                   # Navegação por abas
│   │   ├── index.tsx             # Home (Check-in)
│   │   ├── perfil.tsx            # Perfil do usuário
│   │   └── _layout.tsx           # Layout das abas
│   ├── admin-dashboard.tsx       # Dashboard admin
│   ├── admin-relatorios.tsx      # Relatórios admin
│   ├── backup.tsx                # Backup e restauração
│   ├── blood-pressure-history.tsx # Histórico de pressão
│   ├── configurar-pausas.tsx     # Configurar pausas ativas
│   ├── desafio-detalhe.tsx       # Detalhes de desafios
│   ├── hydration-tracker.tsx     # Rastreador de hidratação
│   ├── preferencias.tsx          # Preferências do usuário
│   ├── saude-mental.tsx          # Recursos de saúde mental
│   └── _layout.tsx               # Layout raiz
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # Componentes de UI
│   │   ├── card.tsx              # Card component
│   │   ├── icon-symbol.tsx       # Ícones
│   │   └── ...
│   ├── screen-container.tsx      # Container com SafeArea
│   └── themed-view.tsx           # View com tema
├── hooks/                        # Custom hooks
│   ├── use-auth.ts               # Autenticação
│   ├── use-backup.ts             # Backup de dados
│   ├── use-blood-pressure.ts     # Pressão arterial
│   ├── use-gamification.ts       # Gamificação
│   ├── use-health-data.ts        # Dados de saúde
│   ├── use-hydration.ts          # Hidratação
│   ├── use-offline-sync.ts       # Sincronização offline
│   ├── use-personal-dashboard.ts # Dashboard pessoal
│   ├── use-smart-notifications.ts # Notificações inteligentes
│   └── use-sync-manager.ts       # Gerenciador de sincronização
├── server/                       # Backend (tRPC + Express)
│   ├── routers.ts                # Rotas da API
│   ├── db.ts                     # Configuração do banco
│   └── _core/                    # Core do servidor
├── drizzle/                      # Schemas do banco de dados
│   ├── schema.ts                 # Definições de tabelas
│   └── relations.ts              # Relações entre tabelas
├── lib/                          # Utilitários
│   ├── trpc.ts                   # Cliente tRPC
│   ├── utils.ts                  # Funções utilitárias
│   └── types.ts                  # Tipos TypeScript
├── assets/                       # Imagens e recursos
│   └── images/                   # Ícones e splash screen
├── tests/                        # Testes automatizados
│   └── sync.test.ts              # Testes de sincronização
├── app.config.ts                 # Configuração do Expo
├── tailwind.config.js            # Configuração do Tailwind
├── theme.config.js               # Configuração de cores
├── package.json                  # Dependências
├── tsconfig.json                 # Configuração TypeScript
└── README.md                     # Este arquivo
```

---

## 🎨 Personalização

### Cores do Tema
Edite `theme.config.js` para alterar as cores:

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  // ... outras cores
};
```

### Nome e Logo do App
Edite `app.config.ts`:

```typescript
const env = {
  appName: "Canteiro Saudável",
  appSlug: "canteiro-saudavel",
  logoUrl: "https://your-logo-url.com/logo.png",
};
```

---

## 🔒 Segurança

- **JWT** para autenticação de admin
- **Senhas** nunca armazenadas em plain text
- **HTTPS** obrigatório em produção
- **Validação** de entrada com Zod
- **Sanitização** de dados antes de salvar
- **Rate limiting** nos endpoints da API
- **Backup** criptografado (opcional)

---

## 📊 Métricas e Analytics

O app coleta as seguintes métricas (anônimas):
- Taxa de check-ins diários
- Frequência de uso de pausas ativas
- Média de hidratação
- Taxa de conclusão de desafios
- Engajamento com recursos de saúde mental

**Nenhum dado pessoal identificável é compartilhado com terceiros.**

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 📞 Suporte

Para suporte técnico ou dúvidas:
- **Email**: suporte@canteirosaudavel.com.br
- **WhatsApp**: (21) 99822-5493
- **Horário**: Segunda a Sexta, 8h às 18h

---

## 🙏 Agradecimentos

- **Equipe de SESMT** pela consultoria em saúde ocupacional
- **Psicóloga Brenda** e **Assistente Social Luciana** pelo suporte em saúde mental
- **Trabalhadores** que participaram dos testes e deram feedback valioso

---

## 📅 Roadmap

### Versão 2.0 (Planejado)
- [ ] Integração com wearables (smartwatches)
- [ ] Chat em tempo real com SESMT
- [ ] Vídeos educativos sobre segurança
- [ ] Reconhecimento de voz para check-ins
- [ ] Modo offline completo com sincronização inteligente
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard web para gestores

### Versão 1.1 (Em Desenvolvimento)
- [x] Gráfico de pressão arterial
- [x] Preferências de notificações
- [x] Sistema de backup
- [x] Contatos de saúde mental
- [x] Modo offline com sincronização

---

**Desenvolvido com ❤️ para a saúde dos trabalhadores da construção civil**
