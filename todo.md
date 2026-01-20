# Canteiro Saudável - TODO

## Funcionalidades Principais

### Tela Home (Check-in Diário)
- [x] Componente de saudação com hora do dia
- [x] Card de check-in rápido com 3 emojis (bem, dor leve, dor forte)
- [x] Salvar check-in em AsyncStorage
- [x] Exibir histórico de check-ins dos últimos 7 dias
- [x] Mini gráfico visual do histórico
- [x] Botão flutuante para registrar pressão

### Tela Ergonomia (Guia de Posturas)
- [x] Abas: Posturas | Alongamentos | Exercícios
- [x] Cards com imagens/ilustrações de posturas corretas
- [x] Descrições em linguagem simples
- [x] Botão "Fazer Agora" para iniciar rotina
- [ ] Tela de exercício com contagem regressiva
- [ ] Confirmação ao completar exercício

### Tela Saúde (Monitoramento)
- [x] Seção de Pressão Arterial
- [x] Formulário para registrar pressão (Sistólica/Diastólica)
- [x] Classificação automática (Normal/Pré-hipertensão/Hipertensão)
- [ ] Histórico de pressão em gráfico (últimos 30 dias)
- [x] Seção de Sintomas com checklist
- [x] Seção de Saúde Mental com dicas de respiração
- [x] Alertas para valores críticos

### Tela Perfil (Dados Pessoais)
- [x] Exibição de dados: Nome, CPF, Cargo, Turno
- [x] Edição de dados pessoais
- [ ] Histórico de atestados (anônimo)
- [ ] Preferências: notificações, lembretes
- [x] Botão de contato SESMT (link externo)
- [x] Versão do app

### Navegação
- [x] Tab bar com 4 abas: Home | Ergonomia | Saúde | Perfil
- [x] Ícones e rótulos em cada aba
- [x] Transições suaves entre telas
- [x] Persistência de estado ao navegar

### Armazenamento de Dados
- [x] Implementar AsyncStorage para dados locais
- [x] Schema: check-ins, pressão, sintomas, perfil
- [x] Sincronização automática (sem servidor, local)
- [ ] Backup de dados

### Design e UX
- [x] Implementar paleta de cores (azul primário, verde sucesso, amarelo aviso, vermelho erro)
- [x] Componentes reutilizáveis: Card, Button, Input, Badge
- [x] Acessibilidade: contraste, tamanho de toque, labels
- [ ] Suporte a modo escuro
- [x] Animações sutis (fade, scale, slide-up))

### Notificações e Lembretes
- [ ] Notificação de pausa ativa (opcional)
- [ ] Lembretes para check-in diário
- [ ] Alertas para pressão elevada
- [ ] Configuração de horários

### Branding
- [x] Criar logo/ícone do app
- [x] Atualizar app.config.ts com nome e logo
- [x] Splash screen customizado
- [x] Favicon

### Testes
- [x] Testes unitários para lógica de pressão
- [ ] Testes de navegação
- [ ] Testes de armazenamento local

### Documentação
- [ ] README com instruções de uso
- [ ] Guia de instalação
- [ ] Documentação de API (se houver backend)

---

## Bugs Conhecidos
(Nenhum no momento)

---

## Melhorias Futuras
- [ ] Integração com servidor para sincronização em nuvem
- [ ] Autenticação de usuários
- [ ] Dashboard gerencial (anônimo)
- [ ] Integração com wearables (smartwatch)
- [ ] Relatórios PDF para SESMT
- [ ] Gamificação (pontos, badges)
- [ ] Integração com WhatsApp para contato SESMT
