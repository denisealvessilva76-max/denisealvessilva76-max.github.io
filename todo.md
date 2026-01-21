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

---

## Sistema de Notificações Push (Implementado)
- [x] Criar hook para gerenciar notificações
- [x] Configurar permissões de notificação no iOS e Android
- [x] Implementar lembretes de check-in diário (8h, 12h, 16h)
- [x] Implementar lembretes de pausa ativa (10h, 14h, 17h)
- [x] Tela de configuração de horários de notificação
- [x] Persistir preferências de notificação
- [ ] Testar notificações em dispositivo real

---

## Sistema de Gamificação (Implementado)
- [x] Criar tipos para medalhas e conquistas
- [x] Implementar lógica de cálculo de pontos
- [x] Criar medalhas por check-ins semanais (3, 5, 7 dias)
- [x] Tela de Conquistas com exibição de medalhas
- [x] Animação ao desbloquear medalha
- [x] Histórico de conquistas
- [x] Integrar gamificação com Home screen

---

## Notificações de Medalhas (Implementado)
- [x] Detectar quando nova medalha é desbloqueada
- [x] Enviar notificação push ao desbloquear medalha
- [x] Personalizar mensagem com nome da medalha
- [x] Adicionar som especial para notificação de medalha
- [x] Armazenar histórico de notificações de medalhas
- [ ] Testar notificações em dispositivo real

---

## Sincronização com Servidor (Implementado)
- [x] Criar API para receber dados de saúde
- [x] Implementar sincronização automática no app
- [x] Criar tabelas de banco de dados para dados agregados
- [ ] Implementar dashboard SESMT (tela web)
- [ ] Adicionar gráficos de tendências
- [ ] Criar exportação de relatórios (PDF/Excel)
- [ ] Implementar autenticação SESMT
- [ ] Testar sincronização em produção

---

## Sistema de Encaminhamento de Dores (Implementado)
- [x] Criar tabela de encaminhamentos no banco de dados
- [x] Implementar formulário de descrição de dor no app
- [x] Encaminhar automaticamente ao setor de saúde
- [x] Notificar SESMT sobre novo encaminhamento
- [x] Armazenar histórico de encaminhamentos

---

## Dashboard Administrativo Protegido (Implementado)
- [x] Criar tela de login/senha para admin
- [x] Implementar autenticação no servidor
- [ ] Criar dashboard web para SESMT (interface visual)
- [x] Visualizar queixas e encaminhamentos
- [x] Listar empregados que precisam de atenção
- [ ] Filtrar por tipo de queixa e data (interface)
- [ ] Exportar relatórios (interface)

---

## Controle de Hidratação (Implementado)
- [x] Adicionar campo de hidratação no check-in
- [x] Criar lembretes de hidratação (a cada 2 horas)
- [x] Rastrear consumo de água
- [x] Exibir histórico de hidratação
- [x] Alertas para baixa hidratação

---

## Imagens e Vídeos Ilustrativos (Implementado)
- [x] Gerar imagens dos alongamentos
- [ ] Gerar vídeos demonstrativos dos movimentos (opcional)
- [x] Implementar exibição de imagens na tela de exercício
- [ ] Implementar player de vídeo (opcional)
- [x] Adicionar avisos de troca de lado
- [x] Sincronizar avisos com contagem regressiva
- [ ] Testar em dispositivo real

---

## Formulário Detalhado de Queixa (Planejado)
- [ ] Expandir formulário ao clicar em "Dor" ou "Sintomas"
- [ ] Campos: tipo de dor, localização, severidade, descrição
- [ ] Indicação visual para procurar SESMT
- [ ] Botão direto para contatar SESMT
- [ ] Salvamento automático da queixa

## Dashboard Administrativo (Implementado)
- [x] Tela de login com email/senha
- [x] Autenticação segura no servidor
- [x] Dashboard visual com gráficos
- [x] Visualizar dados agregados dos empregados
- [x] Listar queixas e empregados em risco
- [ ] Filtros por período e tipo de queixa (interface)
- [ ] Exportação de relatórios (interface)

---

## Exportação de Relatórios em PDF (Implementado)
- [x] Criar API para gerar PDF com dados de saúde
- [x] Implementar análises de tendências (pressão, bem-estar)
- [x] Calcular recomendações baseadas em dados
- [x] Adicionar gráficos ao PDF
- [x] Botão de exportação no dashboard
- [x] Filtrar por período (semana/mês)
- [x] Incluir resumo executivo
- [ ] Testar geração de PDF em produção

---

## Notificações em Tempo Real para Admin (Implementado)
- [x] Criar sistema de notificações push para admin
- [x] Enviar notificação ao registrar dor leve
- [x] Enviar notificação ao registrar dor moderada/forte
- [x] Incluir dados do empregado na notificação
- [x] API de notificações no servidor
- [x] Histórico de notificações
- [x] Marcar notificação como lida
- [ ] Tela de notificações no dashboard admin (interface visual)
- [ ] Testar notificações em tempo real
