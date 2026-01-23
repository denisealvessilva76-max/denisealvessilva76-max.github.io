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

---

## Bugs Corrigidos
- [x] Corrigir "Maximum update depth exceeded" - loop infinito de renderização

---

## Bugs Críticos Reportados (Prioridade Máxima)
- [x] Aba de acesso administrativo não aparece no Perfil
- [x] Ao relatar dor não aparece campo para escrever detalhes
- [x] Não tem campo para calcular água ingerida (copos/garrafas)
- [x] Lembretes de água não funcionam
- [x] Erro ao registrar notificação (corrigido com useCallback)
- [x] Link do WhatsApp não funciona corretamente (adicionado +55)
- [x] Ao selecionar "dor leve" não aparece aviso de procurar ajuda (formulário completo)
- [x] Não aparece campo para especificar de onde vem a dor (formulário completo)

---

## Funcionalidades Faltantes Críticas
- [ ] Botão "Área Administrativa" visível na tela Perfil
- [ ] Formulário detalhado ao clicar em "Dor leve" ou "Dor forte"
- [ ] Campo obrigatório para descrever a dor
- [ ] Aviso visual "Procure o SESMT" ao reportar dor
- [ ] Sistema de rastreamento de hidratação com copos/garrafas
- [ ] Contador visual de água ingerida no dia
- [ ] Lembretes de hidratação a cada 2 horas
- [ ] Correção do link do WhatsApp (21 99822-5493)
- [ ] Envio automático de relatórios para denise.silva@mip.com.br
- [ ] Dashboard com gráficos acessível pelo admin
- [ ] Exportação de relatórios semanais/mensais

---

## Ferramentas de Saúde Mental (Implementado)
- [x] Criar aba/seção de Saúde Mental
- [x] Guias de apoio emocional
- [x] Técnicas de respiração e relaxamento (4-7-8)
- [x] Auxílio para momentos difíceis (quando procurar ajuda)
- [x] Lista de recursos em Canaã dos Carajás (CAPS)
- [x] Contato da psicóloga da obra (Brenda Fernandes)
- [x] Contato da assistente social da obra (Luciana Nascimento)
- [x] Links para CVV (Centro de Valorização da Vida - 188)
- [x] Botões de contato direto e solicitação de atendimento
- [x] Aviso de sigilo profissional garantido por lei
- [x] Mapa da Saúde Mental (recursos nacionais)
- [x] Dicas para o dia a dia

---

## Bugs Críticos - Teste Real (23/01/2026)
- [x] Hidratação: salva mas não atualiza na tela (contador fica em 0ml)
- [x] Envio de queixa: erro "Worker ID não encontrado" 
- [x] Login admin: erro de autenticação
- [x] Adicionar avatares para o empregado escolher no perfil

---

## Bugs Críticos - Segundo Teste (23/01/2026)
- [x] Acesso ao admin continua dando erro - CORRIGIDO: Adicionados logs detalhados para diagnóstico
- [x] Gráfico de água não salva, continua zerado mesmo apertando - CORRIGIDO: Forçada atualização imediata do estado após salvar
- [x] Erro ao registrar notificação - CORRIGIDO: Worker ID gerado automaticamente se não existir
- [x] Notificações só aparecem quando app é aberto - CORRIGIDO: Usando triggers diários para funcionar em background
- [x] Ao selecionar sintomas não abre aba para especificar o que está sentindo - CORRIGIDO: Formulário detalhado com intensidade (leve/moderada/forte) e campo de descrição

---

## Seção de Dicas de Saúde (Nova Funcionalidade)
- [x] Criar tipos para artigos e vídeos
- [x] Buscar vídeos reais sobre ergonomia na construção civil (8 vídeos do YouTube)
- [x] Implementar tela de listagem de dicas com busca e filtros
- [x] Implementar tela de visualização de artigo com Markdown
- [x] Implementar player de vídeo (abre YouTube)
- [x] Adicionar categorias (Ergonomia, Prevenção, Segurança, Saúde Mental)
- [x] Integrar com navegação principal (botão na Home)
- [x] 5 artigos completos sobre ergonomia, prevenção, segurança e saúde mental
- [ ] Testar em dispositivo real

---

## 🎯 Desafios de Saúde (Nova Funcionalidade)
- [x] Criar tipos e estrutura de dados para desafios
- [x] Implementar desafio "Caminhar 6.000 passos por dia por 15 dias"
- [x] Implementar desafio "Beber água regularmente"
- [x] Sistema de progresso e acompanhamento
- [x] Ranking amigável da equipe
- [ ] Notificações de lembrete para desafios ativos
- [x] Tela de desafios disponíveis
- [x] Tela de progresso individual
- [x] Tela de ranking da equipe
- [x] Recompensas ao completar desafios (pontos e medalhas)
- [x] 7 desafios pré-definidos (passos, hidratação, check-in, DDS, combo)
- [x] Hook use-challenges para gerenciar estado
- [x] Botão de acesso na Home

---

## 🍎 Orientações Nutricionais (Nova Funcionalidade)
- [x] Criar banco de dicas nutricionais simples
- [x] Dicas específicas para construção civil/mineração/indústria
- [x] Alertas de hidratação em dias quentes
- [x] Alertas de hidratação com alto calor ocupacional
- [x] Integração com clima/temperatura (simulado)
- [ ] Notificações contextuais de nutrição
- [x] Tela de orientações nutricionais
- [x] Calculadora de necessidade hídrica
- [x] 6 categorias de dicas (café, almoço, lanches, hidratação, energia, evitar)
- [x] Sistema de alertas por nível de temperatura
- [x] Botão de acesso na Home

---

## 📅 Metas Mensais de Saúde (Nova Funcionalidade)
- [ ] Sistema de metas mensais personalizáveis
- [ ] Meta: "Fazer 2 check-ins emocionais por semana"
- [ ] Meta: "Beber 2L de água por dia"
- [ ] Meta: "Participar de um vídeo de DDS"
- [ ] Progresso visual de metas
- [ ] Notificações de lembrete de metas
- [ ] Histórico de metas cumpridas
- [ ] Recompensas ao atingir metas

---

## 🏅 Gamificação Expandida (Nova Funcionalidade)
- [ ] Novos selos e medalhas:
  - [ ] "Cuidador da Saúde"
  - [ ] "Hidratado"
  - [ ] "Zen da Semana"
  - [ ] "Campeão de Passos"
  - [ ] "Mestre do DDS"
  - [ ] "Nutrição Consciente"
- [ ] Sistema de pontos expandido
- [ ] Níveis de usuário (Iniciante, Intermediário, Avançado, Expert)
- [ ] Conquistas especiais
- [ ] Perfil gamificado

---

## 🎥 DDS Interativo (Nova Funcionalidade)
- [ ] Sistema de upload manual de vídeos DDS
- [ ] Vídeos curtos (5-10 min) com temas:
  - [ ] Outubro Rosa
  - [ ] Novembro Azul
  - [ ] Janeiro Branco (Saúde Mental)
  - [ ] Ergonomia
  - [ ] Fadiga Mental
  - [ ] Prevenção de Acidentes
- [ ] Quiz interativo ao final de cada vídeo
- [ ] Pontuação do quiz
- [ ] Certificado de participação
- [ ] Histórico de DDS assistidos
- [ ] Notificações de novos DDS
- [ ] Tela de DDS disponíveis
- [ ] Tela de quiz com feedback

---

## 📈 Painel Administrativo de Indicadores (Nova Funcionalidade)
- [ ] Dashboard visual com gráficos
- [ ] Indicador: Absenteísmo
- [ ] Indicador: Queixas mais comuns
- [ ] Indicador: Estados emocionais detectados
- [ ] Indicador: Riscos ergonômicos relatados
- [ ] Indicador: Taxa de participação em DDS
- [ ] Indicador: Média de hidratação da equipe
- [ ] Indicador: Progresso de desafios
- [ ] Filtros por período (semana/mês/ano)
- [ ] Filtros por setor/equipe
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Gráficos interativos
- [ ] Alertas automáticos para indicadores críticos

---

## 📴 Modo Offline (Nova Funcionalidade)
- [ ] Implementar armazenamento local robusto
- [ ] Sincronização automática ao reconectar
- [ ] Indicador visual de status de conexão
- [ ] Fila de sincronização
- [ ] Resolução de conflitos
- [ ] Cache de conteúdos essenciais
- [ ] Funcionalidades offline:
  - [ ] Check-in diário
  - [ ] Registro de pressão
  - [ ] Registro de sintomas
  - [ ] Registro de hidratação
  - [ ] Visualização de dicas (cache)
  - [ ] Progresso de desafios
- [ ] Notificação de dados pendentes de sincronização
- [ ] Teste em áreas remotas (minas, obras)

---

## 🔧 Melhorias Técnicas
- [ ] Otimização de performance
- [ ] Redução de consumo de bateria
- [ ] Compressão de dados para sincronização
- [ ] Logs de erro e monitoramento
- [ ] Testes de integração
- [ ] Documentação técnica

---

## Bugs Críticos - Teste em Dispositivo Real (23/01/2026 - 11:03)
- [x] Login admin com erro "Network request failed" - CORRIGIDO: Rotas admin adicionadas ao servidor + URL pública configurada
- [x] Erro de notificações: "No projectId found" - CORRIGIDO: projectId adicionado ao app.config.ts

---

## 📊 Painel Administrativo com Gráficos (Nova Funcionalidade)
- [x] Instalar victory-native para gráficos React Native
- [x] Criar componentes de gráficos reutilizáveis (LineChart, BarChart)
- [x] Implementar API de dados agregados no servidor (/api/admin/analytics)
- [x] Gráfico de check-ins emocionais ao longo do tempo (linha)
- [x] Gráfico de queixas mais comuns (top 10 barras)
- [x] Gráfico de estados emocionais (distribuição em barras)
- [x] Gráfico de riscos ergonômicos relatados (barras)
- [x] Indicador de absenteísmo (% calculado)
- [x] Filtros por período (última semana, último mês, últimos 3 meses)
- [x] Indicadores resumo (trabalhadores, resolvidos, pendentes)
- [x] Pull-to-refresh para atualizar dados
- [x] Botões de ação (exportar PDF, enviar email)
- [x] Dashboard responsivo para mobile
- [ ] Exportação de relatórios em PDF (funcionalidade preparada)
- [ ] Envio automático de relatório por email (funcionalidade preparada)
- [ ] Gráfico de hidratação média da equipe (dados não disponíveis no backend)
- [ ] Gráfico de pressão arterial (dados não disponíveis no backend)

---

## 📋 Créditos e Propriedade Intelectual (Nova Solicitação)
- [x] Criar tela "Sobre o App" com créditos da criadora (app/sobre.tsx)
- [x] Adicionar nome completo: Denise Alves da Silva
- [x] Adicionar título: Técnica de Enfermagem do Trabalho
- [x] Gerar selo de propriedade intelectual profissional (assets/images/selo-propriedade.png)
- [x] Adicionar selo na tela Sobre
- [x] Adicionar botão de acesso no Perfil
- [x] Adicionar aviso de direitos autorais (Lei nº 9.610/98)
- [x] Incluir informações de contato (denise.silva@mip.com.br)
- [x] Adicionar missão, funcionalidades e sobre o app

---

## 💬 Sistema de Feedback (Nova Funcionalidade)
- [x] Criar tipos para feedback (sugestão, problema, elogio, outro)
- [x] Implementar API de envio de feedback no servidor (server/routes/feedback.ts)
- [x] Criar tela de envio de feedback com formulário (app/enviar-feedback.tsx)
- [x] Adicionar categorias (App, Saúde, Segurança, Outro)
- [x] Campo de descrição detalhada (1000 caracteres)
- [x] Campo de título (100 caracteres)
- [x] Identificação automática do usuário (nome e CPF)
- [x] Visualização de feedbacks no painel admin (app/admin-feedbacks.tsx)
- [x] Filtros por tipo e status (pendente/em_analise/resolvido/arquivado)
- [x] Botão de acesso no Perfil
- [x] Botão de acesso no Dashboard Admin
- [x] Confirmação de envio com mensagem de agradecimento
- [x] Sistema de atualização de status pelo admin
- [x] Contadores e estatísticas de feedbacks
- [ ] Opção de anexar foto (preparado mas não implementado)
- [ ] Notificação push para admin quando novo feedback é enviado

---

## Bug Crítico - Login Admin (23/01/2026)
- [x] Erro "Network request failed" ao tentar fazer login admin - CORRIGIDO: URL da API atualizada de localhost para servidor público
- [x] Verificar URL da API no código - CORRIGIDO: admin-login.tsx e admin-dashboard.tsx atualizados
- [x] Testar conectividade com servidor - OK: Servidor respondendo corretamente
- [x] Garantir que variável de ambiente EXPO_PUBLIC_API_URL está correta - OK: Fallback atualizado
