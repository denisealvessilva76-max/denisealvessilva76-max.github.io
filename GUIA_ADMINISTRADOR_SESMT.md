# 🏥 Guia do Administrador SESMT - Canteiro Saudável

**Manual Completo do Painel Administrativo**

Este guia foi desenvolvido para profissionais do Serviço Especializado em Engenharia de Segurança e em Medicina do Trabalho (SESMT) que utilizarão o painel administrativo do aplicativo Canteiro Saudável. O sistema oferece ferramentas completas para monitoramento de saúde ocupacional, análise de indicadores e gestão preventiva de riscos.

---

## 📋 Índice

1. [Acesso ao Painel Administrativo](#acesso-ao-painel-administrativo)
2. [Dashboard Principal](#dashboard-principal)
3. [Relatório de Hidratação Mensal](#relatório-de-hidratação-mensal)
4. [Visualização de Feedbacks](#visualização-de-feedbacks)
5. [Exportação de Relatórios em PDF](#exportação-de-relatórios-em-pdf)
6. [Envio Automático de Relatórios por Email](#envio-automático-de-relatórios-por-email)
7. [Notificações em Tempo Real](#notificações-em-tempo-real)
8. [Análise de Indicadores](#análise-de-indicadores)
9. [Gestão de Encaminhamentos](#gestão-de-encaminhamentos)
10. [Boas Práticas e Recomendações](#boas-práticas-e-recomendações)

---

## 🔐 Acesso ao Painel Administrativo

### Credenciais de Acesso

O painel administrativo é protegido por autenticação segura com email e senha. Apenas profissionais autorizados do SESMT têm acesso aos dados de saúde dos trabalhadores, conforme determina a Lei Geral de Proteção de Dados (LGPD) e as normas regulamentadoras do Ministério do Trabalho.

**Credenciais padrão:**
- **Email:** admin@obra.com
- **Senha:** admin123

**Importante:** Altere a senha padrão imediatamente após o primeiro acesso. Para redefinir a senha, entre em contato com o suporte técnico através do email denise.silva@mip.com.br.

### Como Fazer Login

Abra o aplicativo Canteiro Saudável no seu dispositivo móvel ou acesse via navegador web. Na tela inicial, toque em **"Perfil"** (ícone de pessoa no canto inferior direito) e depois em **"Área Administrativa"**. Você será redirecionado para a tela de login. Insira seu email e senha e toque em **"Entrar"**. Se as credenciais estiverem corretas, você será direcionado ao dashboard principal.

**Dica de segurança:** Nunca compartilhe suas credenciais com terceiros. Sempre faça logout ao terminar de usar o sistema, especialmente em dispositivos compartilhados.

---

## 📊 Dashboard Principal

O dashboard principal é a central de comando do sistema. Ele oferece uma visão consolidada de todos os indicadores de saúde ocupacional da obra, permitindo identificar rapidamente trabalhadores em risco e tendências preocupantes.

### Seleção de Período

No topo da tela, você encontra três botões para filtrar os dados por período: **Última Semana**, **Último Mês** e **Últimos 3 Meses**. Ao tocar em um dos botões, todos os gráficos e indicadores são atualizados automaticamente para refletir o período selecionado. Essa funcionalidade é essencial para análises de curto prazo (identificação de surtos de sintomas) e longo prazo (tendências sazonais e eficácia de intervenções).

### Indicadores Resumo

Logo abaixo dos filtros de período, você verá quatro cards com indicadores-chave:

**Encaminhamentos Totais:** Número total de trabalhadores que reportaram dor moderada ou forte e foram encaminhados para atendimento médico no período selecionado. Um aumento súbito nesse indicador pode sinalizar problemas ergonômicos ou acidentes não reportados formalmente.

**Trabalhadores Únicos:** Quantidade de trabalhadores diferentes que utilizaram o app no período. Esse indicador mede a adesão ao sistema. O ideal é que 100% dos trabalhadores façam pelo menos um check-in por semana.

**Resolvidos:** Encaminhamentos que foram atendidos e tiveram suas queixas resolvidas (trabalhador voltou a reportar "bem" nos check-ins subsequentes). Taxa de resolução acima de 70% indica eficácia das intervenções.

**Pendentes:** Encaminhamentos que ainda não foram atendidos ou cujos trabalhadores continuam reportando dor. Priorize esses casos para atendimento imediato.

**Taxa de Absenteísmo:** Percentual calculado com base em faltas e afastamentos relacionados a problemas de saúde reportados no app. Esse indicador é estimado e deve ser validado com dados de RH.

### Gráficos Analíticos

O dashboard apresenta quatro gráficos principais que fornecem insights detalhados sobre a saúde da equipe:

**Tendência de Check-ins (Gráfico de Linha):** Mostra a evolução diária do número de check-ins realizados. Quedas bruscas podem indicar desmotivação dos trabalhadores ou problemas técnicos com o app. Picos podem estar relacionados a campanhas de conscientização ou DDS sobre o tema.

**Queixas Mais Comuns (Gráfico de Barras):** Lista as 10 regiões do corpo mais reportadas em queixas de dor. Esse gráfico é fundamental para identificar padrões ergonômicos. Por exemplo, se "dor nas costas" lidera com grande margem, isso indica necessidade de revisão de processos de levantamento de peso ou fornecimento de equipamentos auxiliares (carrinhos, talhas).

**Estados Emocionais (Gráfico de Barras):** Distribui os check-ins em três categorias: Bem, Dor Leve e Dor Forte. O ideal é que mais de 80% dos check-ins sejam "Bem". Se a categoria "Dor Forte" ultrapassar 10%, isso indica situação crítica que requer intervenção imediata.

**Riscos Ergonômicos Relatados (Gráfico de Barras):** Mostra os tipos de atividades ou posturas que mais causam desconforto (trabalho em altura, levantamento de peso, movimentos repetitivos, etc.). Use esse gráfico para priorizar treinamentos de segurança e ajustes nos processos de trabalho.

### Atualização de Dados

Para atualizar os dados manualmente, puxe a tela para baixo (pull-to-refresh). O sistema sincroniza automaticamente com o servidor e exibe os dados mais recentes. Em caso de falha na conexão, o dashboard exibe dados mockados (simulados) para fins de demonstração, com um aviso visual no topo da tela.

---

## 💧 Relatório de Hidratação Mensal

O relatório de hidratação mensal é uma ferramenta exclusiva para monitorar o consumo de água de todos os trabalhadores e identificar aqueles em risco de desidratação. A desidratação crônica está associada a fadiga, redução de produtividade, cãibras musculares e problemas renais.

### Como Acessar

No dashboard principal, toque no botão **"💧 Relatório de Hidratação Mensal"** (cor ciano). Você será redirecionado para uma tela dedicada com estatísticas detalhadas.

### Seleção de Mês e Ano

No topo da tela, você encontra dois seletores: **Mês** (janeiro a dezembro) e **Ano** (2024, 2025, 2026). Selecione o período desejado e os dados serão carregados automaticamente. O sistema calcula o compliance (taxa de cumprimento da meta) de cada trabalhador no mês selecionado.

### Indicadores Resumo

Três cards principais fornecem uma visão geral do mês:

**Total de Trabalhadores:** Quantidade de trabalhadores que registraram pelo menos um consumo de água no mês. Se esse número for muito menor que o total de trabalhadores da obra, isso indica baixa adesão ao recurso de hidratação do app.

**Compliance Médio:** Percentual médio de cumprimento da meta de hidratação por todos os trabalhadores. Valores abaixo de 60% indicam necessidade de campanhas de conscientização sobre a importância da hidratação.

**Trabalhadores em Risco:** Quantidade de trabalhadores com compliance inferior a 50%. Esses trabalhadores devem ser contatados individualmente para orientação e acompanhamento.

### Gráfico de Distribuição de Compliance

Um gráfico de barras mostra a distribuição dos trabalhadores em faixas de compliance: 0-25% (crítico), 25-50% (baixo), 50-75% (moderado) e 75-100% (bom). Esse gráfico ajuda a visualizar rapidamente se a maioria da equipe está bem hidratada ou se há um problema generalizado.

### Lista Detalhada de Trabalhadores

Abaixo do gráfico, você encontra uma tabela com todos os trabalhadores ordenados por risco (menor compliance primeiro). Para cada trabalhador, são exibidos:

**Nome:** Nome completo do trabalhador.  
**CPF:** Últimos 4 dígitos do CPF para identificação.  
**Meta Diária:** Quantidade de água (em ml) que o trabalhador deveria beber por dia, calculada com base em peso, altura e tipo de trabalho.  
**Consumo Médio:** Quantidade média de água (em ml) que o trabalhador bebeu por dia no mês selecionado.  
**Compliance:** Percentual de cumprimento da meta (consumo médio ÷ meta diária × 100).  
**Status:** Indicador visual colorido - 🔴 Crítico (< 50%), 🟡 Atenção (50-75%) ou 🟢 Bom (> 75%).

### Ações Recomendadas

Com base no relatório, você pode tomar as seguintes ações:

**Trabalhadores com compliance < 50%:** Convoque para conversa individual. Investigue se há dificuldade de acesso à água potável, esquecimento frequente ou desconhecimento sobre a importância da hidratação. Considere fornecer garrafas térmicas personalizadas como incentivo.

**Compliance médio < 60%:** Realize DDS (Diálogo Diário de Segurança) sobre hidratação. Explique os riscos da desidratação e os benefícios de beber água regularmente. Instale bebedouros adicionais em locais estratégicos.

**Meses de verão ou trabalho em ambientes quentes:** Aumente a frequência de monitoramento. Considere pausas adicionais para hidratação e fornecimento de isotônicos para trabalhadores em atividades de alto esforço físico.

---

## 💬 Visualização de Feedbacks

O sistema de feedbacks permite que os trabalhadores enviem sugestões, reportem problemas ou façam elogios sobre o app e os serviços do SESMT. Essa funcionalidade é essencial para melhoria contínua e engajamento da equipe.

### Como Acessar

No dashboard principal, toque no botão **"Ver Feedbacks dos Trabalhadores"** (cor roxa). Você será redirecionado para a tela de gerenciamento de feedbacks.

### Filtros e Organização

No topo da tela, você encontra dois filtros:

**Por Tipo:** Todos, Sugestão, Problema, Elogio, Outro.  
**Por Status:** Todos, Pendente, Em Análise, Resolvido, Arquivado.

Ao selecionar um filtro, a lista de feedbacks é atualizada automaticamente. Isso facilita a priorização (exemplo: visualizar apenas "Problemas Pendentes" para resolver questões urgentes).

### Indicadores Resumo

Quatro cards mostram estatísticas gerais:

**Total de Feedbacks:** Quantidade total de feedbacks recebidos desde o lançamento do app.  
**Pendentes:** Feedbacks que ainda não foram lidos ou analisados.  
**Em Análise:** Feedbacks que estão sendo avaliados pela equipe.  
**Resolvidos:** Feedbacks que foram atendidos e tiveram suas questões solucionadas.

### Lista de Feedbacks

Cada feedback é exibido em um card com as seguintes informações:

**Título:** Resumo curto do feedback (máximo 100 caracteres).  
**Descrição:** Texto completo enviado pelo trabalhador (máximo 1000 caracteres).  
**Tipo:** Categoria do feedback (sugestão, problema, elogio, outro).  
**Status:** Estado atual (pendente, em análise, resolvido, arquivado).  
**Enviado por:** Nome e CPF do trabalhador que enviou o feedback.  
**Data:** Data e hora de envio.

### Atualização de Status

Para atualizar o status de um feedback, toque no card correspondente. Um menu suspenso aparecerá com as opções: Pendente, Em Análise, Resolvido e Arquivado. Selecione o novo status e ele será salvo automaticamente no servidor.

**Fluxo recomendado:**
1. Feedback recebido → Status: Pendente
2. SESMT lê e avalia → Status: Em Análise
3. Problema resolvido ou sugestão implementada → Status: Resolvido
4. Feedback irrelevante ou spam → Status: Arquivado

### Boas Práticas

**Responda rapidamente:** Trabalhadores que enviam feedbacks esperam retorno. Mesmo que a solução demore, envie uma mensagem (via WhatsApp ou pessoalmente) informando que o feedback foi recebido e está sendo analisado.

**Valorize os elogios:** Quando receber um elogio, compartilhe com a equipe do SESMT. Isso motiva o time e reforça a importância do trabalho.

**Implemente sugestões viáveis:** Se um trabalhador sugerir uma melhoria simples e útil, implemente rapidamente e comunique a todos. Isso aumenta o engajamento e mostra que a opinião deles é valorizada.

---

## 📄 Exportação de Relatórios em PDF

A funcionalidade de exportação de relatórios em PDF permite gerar documentos profissionais com todos os indicadores e gráficos do período selecionado. Esses relatórios podem ser anexados a documentos oficiais, apresentados em reuniões gerenciais ou arquivados para auditorias.

### Como Exportar

No dashboard principal, após selecionar o período desejado (última semana, último mês ou últimos 3 meses), toque no botão **"📄 Exportar Relatório PDF"** (cor azul). O sistema gerará automaticamente um arquivo PDF completo e abrirá a tela de compartilhamento do dispositivo.

### Conteúdo do Relatório

O PDF gerado contém as seguintes seções:

**Cabeçalho:** Logo do app, nome da obra (345 - Canaã dos Carajás/PA), período do relatório e data de geração.

**Indicadores Resumo:** Tabela com os quatro indicadores principais (encaminhamentos totais, trabalhadores únicos, resolvidos, pendentes e taxa de absenteísmo).

**Descrição dos Gráficos:** Texto explicativo sobre cada gráfico (queixas mais comuns, estados emocionais, riscos ergonômicos) com os dados mais relevantes destacados.

**Recomendações:** Seção com sugestões de ações baseadas nos dados (exemplo: "Dor nas costas representa 45% das queixas. Recomenda-se treinamento sobre levantamento correto de peso e revisão dos processos de trabalho").

**Assinatura Digital:** Nome e credenciais do profissional responsável (Denise Alves da Silva - Técnica de Enfermagem do Trabalho) e aviso de confidencialidade dos dados.

### Compartilhamento

Após a geração, você pode:

**Salvar no dispositivo:** Armazene o PDF na pasta de downloads para acesso posterior.  
**Enviar por email:** Anexe o relatório em um email para a gerência ou outros membros do SESMT.  
**Imprimir:** Envie para uma impressora conectada ao dispositivo.  
**Compartilhar via WhatsApp:** Envie para grupos de trabalho ou contatos específicos.

**Dica:** Gere relatórios mensais e arquive em uma pasta organizada por data. Isso facilita a comparação de indicadores ao longo do tempo e a identificação de melhorias ou pioras.

---

## 📧 Envio Automático de Relatórios por Email

Além da exportação manual, o sistema oferece a funcionalidade de envio automático de relatórios por email. Isso garante que os gestores recebam atualizações regulares sem precisar acessar o app.

### Como Configurar

No dashboard principal, toque no botão **"📧 Enviar Relatório por Email"** (cor azul). Uma caixa de diálogo aparecerá solicitando confirmação. O sistema enviará automaticamente um email para o endereço cadastrado (denise.silva@mip.com.br) com o relatório do período selecionado em anexo (formato PDF).

**Importante:** Para alterar o email de destino ou configurar múltiplos destinatários, entre em contato com o suporte técnico.

### Agendamento Automático

O sistema pode ser configurado para enviar relatórios automaticamente em intervalos regulares (semanal, quinzenal ou mensal). Essa funcionalidade está disponível através da API do servidor na rota `/api/reports/schedule-email`. Para ativar o agendamento, entre em contato com o suporte técnico e informe:

- **Frequência:** Semanal (toda segunda-feira), Quinzenal (1º e 15º de cada mês) ou Mensal (último dia útil do mês).
- **Emails destinatários:** Lista de emails que devem receber os relatórios.
- **Horário de envio:** Horário preferencial para recebimento (exemplo: 8h da manhã).

---

## 🔔 Notificações em Tempo Real

O sistema envia notificações automáticas para o SESMT sempre que um trabalhador reporta dor moderada ou forte no check-in diário. Isso permite intervenção rápida e reduz o risco de agravamento de lesões.

### Tipos de Notificações

**Dor Leve:** Notificação informativa. O trabalhador reportou desconforto leve que não atrapalha o trabalho. Monitore nos próximos dias para verificar se a situação se agrava.

**Dor Moderada:** Notificação de atenção. O trabalhador reportou dor que dificulta algumas atividades. Entre em contato no mesmo dia para avaliar a necessidade de afastamento ou ajuste de função.

**Dor Forte:** Notificação urgente. O trabalhador reportou dor intensa que impede o trabalho normal. Contate imediatamente para atendimento médico e avaliação de afastamento.

### Como Receber Notificações

As notificações são enviadas via push notification para o dispositivo móvel onde o painel administrativo está instalado. Certifique-se de que as notificações estão ativadas nas configurações do dispositivo.

**Importante:** As notificações contêm dados sensíveis de saúde. Nunca deixe o dispositivo desbloqueado em locais públicos e sempre faça logout após usar o sistema.

### Histórico de Notificações

Para visualizar todas as notificações recebidas, acesse **Dashboard Principal** > **Menu** > **Histórico de Notificações**. Você verá uma lista cronológica com todas as notificações enviadas, incluindo data, hora, nome do trabalhador e tipo de queixa.

---

## 📈 Análise de Indicadores

A análise de indicadores é fundamental para gestão proativa de saúde ocupacional. O sistema oferece métricas detalhadas que permitem identificar tendências, avaliar eficácia de intervenções e tomar decisões baseadas em dados.

### Indicadores-Chave de Desempenho (KPIs)

**Taxa de Adesão ao App:** Percentual de trabalhadores que fizeram pelo menos um check-in na última semana. Meta: > 80%.

**Taxa de Resolução de Encaminhamentos:** Percentual de encaminhamentos que foram resolvidos (trabalhador voltou a reportar "bem"). Meta: > 70%.

**Tempo Médio de Resolução:** Número médio de dias entre o encaminhamento e a resolução. Meta: < 7 dias.

**Taxa de Reincidência:** Percentual de trabalhadores que voltaram a reportar dor na mesma região do corpo após resolução. Meta: < 15%.

**Compliance de Hidratação:** Percentual médio de cumprimento da meta de hidratação. Meta: > 70%.

### Análise de Tendências

Compare os indicadores ao longo do tempo para identificar padrões:

**Sazonalidade:** Verifique se há aumento de queixas em determinados meses (exemplo: mais dores musculares no inverno devido ao frio).

**Eficácia de Intervenções:** Após realizar um treinamento de ergonomia, compare a taxa de queixas de dor nas costas antes e depois. Se houve redução significativa, a intervenção foi eficaz.

**Setores Críticos:** Identifique se determinados setores da obra (exemplo: carpintaria, alvenaria, montagem) têm taxas de queixas significativamente maiores que outros. Isso indica necessidade de intervenções específicas.

### Relatórios Comparativos

Gere relatórios comparando diferentes períodos:

**Mês atual vs. mês anterior:** Identifique se os indicadores melhoraram ou pioraram.  
**Trimestre atual vs. trimestre anterior:** Avalie tendências de médio prazo.  
**Ano atual vs. ano anterior:** Analise evolução anual e impacto de mudanças estruturais.

---

## 🏥 Gestão de Encaminhamentos

A gestão eficiente de encaminhamentos é essencial para garantir que todos os trabalhadores que reportam dor recebam atendimento adequado e em tempo hábil.

### Fluxo de Encaminhamento

**Trabalhador reporta dor moderada ou forte no check-in diário** → **Sistema envia notificação automática para o SESMT** → **SESMT entra em contato com o trabalhador no mesmo dia** → **Avaliação médica presencial** → **Decisão: retorno ao trabalho, ajuste de função ou afastamento** → **Acompanhamento nos check-ins subsequentes** → **Resolução: trabalhador volta a reportar "bem"**.

### Priorização de Casos

Use os seguintes critérios para priorizar atendimentos:

**Prioridade Alta:** Dor forte, dor que impede o trabalho, dor com mais de 7 dias de duração, reincidência de dor na mesma região.

**Prioridade Média:** Dor moderada, dor que dificulta algumas atividades, primeira ocorrência.

**Prioridade Baixa:** Dor leve, desconforto ocasional, sem impacto no trabalho.

### Registro de Atendimentos

Sempre registre os atendimentos realizados em um sistema de prontuário eletrônico ou planilha. Informações essenciais a registrar:

- Data e hora do atendimento
- Nome e CPF do trabalhador
- Queixa principal
- Exame físico realizado
- Diagnóstico ou hipótese diagnóstica
- Conduta (retorno ao trabalho, ajuste de função, afastamento, encaminhamento para especialista)
- Orientações fornecidas
- Data de retorno para reavaliação

### Acompanhamento Pós-Atendimento

Após o atendimento, monitore os check-ins diários do trabalhador. Se ele continuar reportando dor após 7 dias, reavalie o caso. Pode ser necessário ajustar a conduta, solicitar exames complementares ou encaminhar para especialista (ortopedista, fisioterapeuta, etc.).

---

## ✅ Boas Práticas e Recomendações

### Segurança e Privacidade

**Nunca compartilhe dados de saúde dos trabalhadores com terceiros não autorizados.** Isso inclui encarregados, gerentes e outros trabalhadores. A quebra de sigilo profissional é crime previsto no Código Penal (Art. 154) e pode resultar em processo ético no conselho profissional.

**Faça logout sempre que terminar de usar o sistema.** Especialmente em dispositivos compartilhados ou em locais públicos.

**Altere a senha padrão imediatamente.** Use senhas fortes com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.

**Mantenha o dispositivo atualizado.** Instale atualizações de segurança do sistema operacional e do app regularmente.

### Engajamento dos Trabalhadores

**Realize DDS sobre o app regularmente.** Explique os benefícios, tire dúvidas e incentive o uso diário.

**Mostre resultados concretos.** Quando uma intervenção baseada nos dados do app resultar em melhoria (exemplo: redução de queixas de dor nas costas após treinamento de ergonomia), compartilhe com a equipe. Isso reforça a importância do app.

**Reconheça os trabalhadores engajados.** Considere criar um sistema de reconhecimento para trabalhadores que fazem check-in diário por 30 dias consecutivos (exemplo: certificado de "Guardião da Saúde").

**Esteja disponível para suporte.** Se trabalhadores tiverem dificuldades técnicas com o app, ajude pessoalmente ou forneça um canal de suporte (WhatsApp, telefone).

### Análise e Melhoria Contínua

**Revise os indicadores semanalmente.** Dedique 30 minutos toda segunda-feira para analisar o dashboard e identificar casos que precisam de atenção.

**Gere relatórios mensais.** No último dia útil de cada mês, exporte o relatório em PDF e arquive. Compare com o mês anterior e identifique tendências.

**Realize reuniões trimestrais com a gerência.** Apresente os principais indicadores, conquistas (exemplo: redução de 30% nas queixas de dor nas costas) e desafios (exemplo: baixa adesão ao recurso de hidratação). Solicite apoio para implementar melhorias.

**Solicite feedback dos trabalhadores.** Pergunte o que eles acham do app, o que poderia ser melhorado e se há funcionalidades que gostariam de ver. Use a seção de feedbacks do app para isso.

### Intervenções Baseadas em Dados

**Use os dados para priorizar ações.** Se o gráfico de "Queixas Mais Comuns" mostra que dor nas costas representa 50% das queixas, priorize treinamentos de ergonomia e revisão de processos de levantamento de peso.

**Teste intervenções e meça resultados.** Antes de implementar uma mudança (exemplo: fornecimento de cintos lombares), registre a taxa de queixas atual. Após 30 dias, compare. Se houve redução significativa, a intervenção foi eficaz. Se não, reavalie.

**Compartilhe boas práticas com outras obras.** Se uma intervenção foi muito eficaz, documente e compartilhe com outros profissionais de SESMT da empresa.

---

## 📞 Suporte Técnico

Em caso de dúvidas, problemas técnicos ou sugestões de melhoria, entre em contato com o suporte:

**Email:** denise.silva@mip.com.br  
**Telefone/WhatsApp:** (21) 99822-5493  
**Horário de atendimento:** Segunda a sexta, 8h às 17h

---

## 📚 Referências e Legislação Aplicável

Este sistema foi desenvolvido em conformidade com as seguintes normas e legislações:

**NR-07 (Programa de Controle Médico de Saúde Ocupacional - PCMSO):** Estabelece a obrigatoriedade de monitoramento da saúde dos trabalhadores expostos a riscos ocupacionais.

**NR-17 (Ergonomia):** Define parâmetros para adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores.

**Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD):** Regula o tratamento de dados pessoais, incluindo dados sensíveis de saúde.

**Código de Ética Médica (Resolução CFM nº 2.217/2018):** Estabelece o dever de sigilo profissional e proteção de dados dos pacientes.

**Código de Ética dos Profissionais de Enfermagem (Resolução COFEN nº 564/2017):** Define responsabilidades éticas dos profissionais de enfermagem, incluindo sigilo e respeito à privacidade.

---

## 🎓 Glossário de Termos Técnicos

**Check-in:** Registro diário do estado de saúde do trabalhador (bem, dor leve ou dor forte).

**Compliance:** Taxa de cumprimento de uma meta ou recomendação (exemplo: compliance de hidratação = percentual da meta de água que foi cumprida).

**Dashboard:** Painel visual com indicadores e gráficos consolidados.

**Encaminhamento:** Registro de um trabalhador que reportou dor e precisa de atendimento médico.

**Gamificação:** Uso de elementos de jogos (pontos, medalhas, ranking) para motivar comportamentos saudáveis.

**KPI (Key Performance Indicator):** Indicador-chave de desempenho usado para medir o sucesso de uma ação ou processo.

**Pull-to-refresh:** Gesto de puxar a tela para baixo para atualizar os dados.

**SESMT:** Serviço Especializado em Engenharia de Segurança e em Medicina do Trabalho.

**Taxa de Adesão:** Percentual de trabalhadores que utilizam o app regularmente.

**Taxa de Reincidência:** Percentual de trabalhadores que voltam a ter o mesmo problema de saúde após tratamento.

---

**Desenvolvido por Denise Alves da Silva**  
Técnica de Enfermagem do Trabalho  
COREN-RJ 123.456  
Email: denise.silva@mip.com.br

**Versão do Guia:** 1.0 (Janeiro de 2026)  
**Obra:** 345 - Canaã dos Carajás/PA

---

## 📋 Checklist de Implementação

Use este checklist para garantir que o sistema está sendo utilizado corretamente:

- [ ] Credenciais de acesso alteradas (senha padrão substituída)
- [ ] Todos os profissionais do SESMT treinados no uso do painel
- [ ] Notificações push ativadas no dispositivo
- [ ] Rotina semanal de análise de indicadores estabelecida
- [ ] Rotina mensal de geração de relatórios estabelecida
- [ ] Fluxo de encaminhamento de casos documentado e comunicado à equipe
- [ ] DDS sobre o app realizado com todos os trabalhadores
- [ ] Sistema de suporte técnico divulgado (email e WhatsApp)
- [ ] Política de privacidade e sigilo comunicada aos trabalhadores
- [ ] Backup de relatórios mensais organizado em pasta segura

---

**Este guia é um documento vivo e será atualizado conforme novas funcionalidades forem implementadas. Sugestões de melhoria são bem-vindas!**
