# 📡 Documentação dos Endpoints de API Prioritários

Este documento descreve os 3 endpoints de API mais cruciais implementados no **Canteiro Saudável**.

---

## 1. 📊 GET /api/admin/dashboard-stats

**Descrição**: Retorna estatísticas agregadas de todos os usuários para o dashboard administrativo.

**Autenticação**: Requerida (protectedProcedure)

**Método**: GET (tRPC Query)

**Parâmetros**: Nenhum

**Resposta**:

```typescript
{
  checkIns: {
    today: number;        // Total de check-ins hoje
    week: number;         // Total de check-ins na semana
    month: number;        // Total de check-ins no mês
  };
  hydration: {
    averageWeekly: number; // Média de hidratação da equipe (ml) nos últimos 7 dias
  };
  pressureAlerts: {
    count: number;        // Total de alertas de pressão elevada
    recent: Array<{       // 5 alertas mais recentes
      userId: number;
      systolic: number;
      diastolic: number;
      date: string;
    }>;
  };
  complaints: {
    pending: number;      // Total de queixas pendentes
  };
  challenges: {
    completionRate: number; // Taxa de conclusão de desafios (%)
    total: number;          // Total de desafios iniciados
    completed: number;      // Total de desafios completados
  };
  ranking: Array<{        // Top 10 usuários por pontuação
    position: number;
    userId: number;
    points: number;
    streak: number;
  }>;
}
```

**Exemplo de Uso (React Native)**:

```typescript
import { trpc } from "@/lib/trpc";

function AdminDashboard() {
  const { data, isLoading } = trpc.admin.dashboardStats.useQuery();

  if (isLoading) return <Text>Carregando...</Text>;

  return (
    <View>
      <Text>Check-ins hoje: {data?.checkIns.today}</Text>
      <Text>Queixas pendentes: {data?.complaints.pending}</Text>
      <Text>Alertas de pressão: {data?.pressureAlerts.count}</Text>
    </View>
  );
}
```

---

## 2. 🔔 POST /api/admin/send-notification

**Descrição**: Envia notificações push para usuários específicos ou grupos predefinidos.

**Autenticação**: Requerida (protectedProcedure)

**Método**: POST (tRPC Mutation)

**Parâmetros**:

```typescript
{
  targetUserId?: number;  // ID do usuário específico (opcional)
  targetGroup?: "all" | "high_pressure" | "pending_complaints" | "inactive"; // Grupo (opcional)
  title: string;          // Título da notificação (1-100 caracteres)
  body: string;           // Corpo da notificação (1-500 caracteres)
  data?: Record<string, any>; // Dados extras (opcional)
  template?: "exam_reminder" | "appointment" | "safety_alert" | "custom"; // Template (opcional)
}
```

**Grupos Disponíveis**:
- `all`: Todos os usuários
- `high_pressure`: Usuários com pressão arterial elevada (≥140/90) nos últimos 30 dias
- `pending_complaints`: Usuários com queixas pendentes
- `inactive`: Usuários sem check-in nos últimos 7 dias

**Templates Disponíveis**:
- `exam_reminder`: "👨‍⚕️ Lembrete de Exame"
- `appointment`: "📅 Consulta Agendada"
- `safety_alert`: "⚠️ Alerta de Segurança"
- `custom`: Usar título e corpo personalizados

**Resposta**:

```typescript
{
  success: boolean;
  sent: number;           // Número de notificações enviadas com sucesso
  failed: number;         // Número de notificações que falharam
  targetUserIds: number[]; // IDs dos usuários alvo
  message: string;        // Mensagem de status
}
```

**Exemplo de Uso (React Native)**:

```typescript
import { trpc } from "@/lib/trpc";

function SendNotificationScreen() {
  const sendNotification = trpc.admin.sendNotification.useMutation();

  const handleSendToHighPressure = async () => {
    try {
      const result = await sendNotification.mutateAsync({
        targetGroup: "high_pressure",
        title: "⚠️ Atenção: Pressão Elevada",
        body: "Sua pressão arterial está acima do normal. Agende uma consulta com o SESMT.",
        template: "custom",
      });

      alert(`Notificações enviadas para ${result.sent} usuário(s)`);
    } catch (error) {
      alert("Erro ao enviar notificações");
    }
  };

  const handleSendToSpecificUser = async (userId: number) => {
    try {
      const result = await sendNotification.mutateAsync({
        targetUserId: userId,
        template: "appointment",
        body: "Sua consulta está agendada para amanhã às 10h.",
      });

      alert("Notificação enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar notificação");
    }
  };

  return (
    <View>
      <Button title="Enviar para Pressão Alta" onPress={handleSendToHighPressure} />
      <Button title="Enviar para Usuário #123" onPress={() => handleSendToSpecificUser(123)} />
    </View>
  );
}
```

**Exemplo de Uso (cURL)**:

```bash
# Enviar para grupo de pressão alta
curl -X POST https://api.canteiro-saudavel.com/api/trpc/admin.sendNotification \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "targetGroup": "high_pressure",
    "title": "⚠️ Atenção: Pressão Elevada",
    "body": "Sua pressão arterial está acima do normal. Agende uma consulta.",
    "template": "custom"
  }'

# Enviar para usuário específico
curl -X POST https://api.canteiro-saudavel.com/api/trpc/admin.sendNotification \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "targetUserId": 123,
    "template": "exam_reminder",
    "body": "Seu exame está agendado para amanhã às 9h."
  }'
```

**Notas Importantes**:
- ⚠️ **Rate Limiting**: Máximo de 100 notificações por hora (a ser implementado)
- ⚠️ **Push Tokens**: Atualmente é um placeholder. Para enviar notificações reais, você precisa:
  1. Armazenar Expo Push Tokens dos usuários
  2. Integrar com Expo Push Notifications API
  3. Implementar fila de envio (ex: Bull, BeeQueue)

---

## 3. 📈 GET /api/user/health-report

**Descrição**: Retorna relatório completo de saúde do usuário autenticado com histórico de check-ins, pressão arterial, hidratação, desafios e queixas.

**Autenticação**: Requerida (protectedProcedure)

**Método**: GET (tRPC Query)

**Parâmetros**:

```typescript
{
  startDate?: string;     // Data de início (YYYY-MM-DD) - opcional
  endDate?: string;       // Data de fim (YYYY-MM-DD) - opcional
  period?: "7" | "30" | "90" | "custom"; // Período predefinido (padrão: "90")
}
```

**Resposta**:

```typescript
{
  period: {
    startDate: string;    // Data de início (YYYY-MM-DD)
    endDate: string;      // Data de fim (YYYY-MM-DD)
    days: number;         // Número de dias no período
  };
  checkIns: {
    total: number;
    data: Array<{
      date: string;
      mood: string;       // "bem", "dor-leve", "dor-forte"
      symptoms: string[];
      notes: string;
    }>;
  };
  bloodPressure: {
    total: number;
    averages: {
      systolic: number;   // Média sistólica
      diastolic: number;  // Média diastólica
    };
    data: Array<{
      date: string;
      systolic: number;
      diastolic: number;
      classification: string; // "normal", "pre-hipertensao", "hipertensao"
      notes: string;
    }>;
  };
  hydration: {
    total: number;
    averageDaily: number;       // Média diária (ml)
    daysMetGoal: number;        // Dias que atingiu a meta
    goalAchievementRate: number; // Taxa de alcance da meta (%)
    data: Array<{
      date: string;
      cupsConsumed: number;
      totalMl: number;
      goalMl: number;
    }>;
  };
  challenges: {
    total: number;
    completed: number;
    completionRate: number;     // Taxa de conclusão (%)
    data: Array<{
      challengeId: string;
      progress: number;
      target: number;
      completed: boolean;
      startDate: string;
      completedAt: string | null;
    }>;
  };
  complaints: {
    total: number;
    resolved: number;
    pending: number;
    data: Array<{
      date: string;
      complaint: string;
      severity: string;   // "leve", "moderada", "grave"
      resolved: boolean;
      notes: string;
    }>;
  };
  gamification: {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    achievements: any[];
    badges: any[];
    consistencyPoints: number;
  };
}
```

**Exemplo de Uso (React Native)**:

```typescript
import { trpc } from "@/lib/trpc";

function HealthReportScreen() {
  // Relatório dos últimos 30 dias
  const { data, isLoading } = trpc.user.healthReport.useQuery({
    period: "30",
  });

  // Relatório customizado
  const { data: customData } = trpc.user.healthReport.useQuery({
    period: "custom",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
  });

  if (isLoading) return <Text>Carregando relatório...</Text>;

  return (
    <ScrollView>
      <Text>Período: {data?.period.days} dias</Text>
      
      <Text>Check-ins: {data?.checkIns.total}</Text>
      
      <Text>Pressão Média: {data?.bloodPressure.averages.systolic}/{data?.bloodPressure.averages.diastolic}</Text>
      
      <Text>Hidratação Média: {data?.hydration.averageDaily}ml/dia</Text>
      <Text>Meta Alcançada: {data?.hydration.goalAchievementRate}%</Text>
      
      <Text>Desafios Completados: {data?.challenges.completed}/{data?.challenges.total}</Text>
      
      <Text>Queixas Pendentes: {data?.complaints.pending}</Text>
      
      <Text>Pontos: {data?.gamification.totalPoints}</Text>
      <Text>Sequência Atual: {data?.gamification.currentStreak} dias</Text>
    </ScrollView>
  );
}
```

**Exemplo de Uso (cURL)**:

```bash
# Relatório dos últimos 90 dias (padrão)
curl -X GET "https://api.canteiro-saudavel.com/api/trpc/user.healthReport" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Relatório dos últimos 30 dias
curl -X GET "https://api.canteiro-saudavel.com/api/trpc/user.healthReport?input=%7B%22period%22%3A%2230%22%7D" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Relatório customizado
curl -X GET "https://api.canteiro-saudavel.com/api/trpc/user.healthReport?input=%7B%22period%22%3A%22custom%22%2C%22startDate%22%3A%222024-01-01%22%2C%22endDate%22%3A%222024-01-31%22%7D" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

**Casos de Uso**:
- Exportar relatório pessoal para médicos
- Gerar PDF com histórico de saúde
- Compliance com LGPD (direito de acesso aos dados)
- Análise de evolução pessoal

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via cookie de sessão. O token é gerenciado automaticamente pelo tRPC client.

**Headers Necessários**:
```
Cookie: session=YOUR_SESSION_TOKEN
```

---

## 🚀 Próximos Passos

### Para Produção:
1. **Implementar Rate Limiting** - Limitar requisições por IP/usuário
2. **Adicionar Cache** - Redis para dashboard-stats (TTL: 5 minutos)
3. **Integrar Expo Push Notifications** - Armazenar push tokens e enviar notificações reais
4. **Criar Tabela notification_history** - Armazenar histórico de notificações enviadas
5. **Adicionar Endpoint de PDF** - Gerar PDF do health-report
6. **Implementar Permissões de Admin** - Verificar `ctx.user.role === 'admin'` nos endpoints admin

### Para Melhorias:
1. **Adicionar Filtros** - Permitir filtrar dashboard-stats por período
2. **Adicionar Paginação** - Limitar resultados de health-report
3. **Adicionar Webhooks** - Notificar sistemas externos sobre eventos críticos
4. **Adicionar Métricas** - Monitorar performance e uso dos endpoints

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
