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

## Bugs Corrigidos
- [x] Botão de pressão arterial em Home não abre formulário
- [x] Botão "Fazer Pausa Ativa" em Home não funciona
- [x] Botão "Fazer Agora" em Ergonomia não abre exercício
- [x] Dados de pressão não salvam em Saúde
- [x] Botão "Iniciar Respiração Guiada" não funciona
- [x] Perfil não salva em Dados Pessoais
- [x] Botão "Ligar SESMT" não funciona
- [x] Botão "Enviar Mensagem" não funciona

---

## Melhorias Implementadas
- [x] Validar e exibir status da pressão (Boa/Pré-hipertensão/Crítica) com cores
- [x] Adicionar ilustrações e emojis para alongamentos
- [x] Implementar contagem regressiva visual para exercícios
- [x] Botão "Concluído" ao final de cada exercício
- [x] Respiração guiada com instruções visuais e contagem regressiva
- [x] Integrar WhatsApp SESMT (21 99822-5493) com link direto
- [x] Salvar perfil do trabalhador permanentemente
- [x] Sistema de extração de gráficos mensais de saúde
- [x] Créditos: "Desenvolvido por Denise Alves - Obra 345"

---

## Melhorias Futuras
- [ ] Integração com servidor para sincronização em nuvem
- [ ] Autenticação de usuários
- [ ] Dashboard gerencial (anônimo)
- [ ] Integração com wearables (smartwatch)
- [ ] Relatórios PDF para SESMT
- [ ] Gamificação (pontos, badges)
- [ ] Integração com WhatsApp para contato SESMT
