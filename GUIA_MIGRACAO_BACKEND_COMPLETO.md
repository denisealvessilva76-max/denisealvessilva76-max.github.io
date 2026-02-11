# 🔄 Guia Completo de Migração para Backend PostgreSQL

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Fase 1: Migrar Hook useHealthData](#fase-1-migrar-hook-usehealthdata)
4. [Fase 2: Migrar Dashboard Admin](#fase-2-migrar-dashboard-admin)
5. [Fase 3: Conectar Gráficos](#fase-3-conectar-gráficos)
6. [Fase 4: Sincronização Offline](#fase-4-sincronização-offline)
7. [Testes](#testes)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Status Atual
- **Cadastro e Login**: ✅ Já usam tRPC (backend PostgreSQL)
- **Check-in, Hidratação, Pressão, Queixas**: ❌ Usam AsyncStorage (local)
- **Dashboard Admin**: ❌ Busca dados de AsyncStorage (local)
- **Gráficos**: ✅ Implementados, mas usam dados locais

### Objetivo
Migrar completamente para backend PostgreSQL para permitir:
- ✅ Sincronização instantânea no Dashboard Admin
- ✅ Acesso aos dados de TODOS os funcionários
- ✅ Comparativos entre equipes
- ✅ Relatórios consolidados

### Tempo Estimado
- **Fase 1** (Hook useHealthData): 4-6 horas
- **Fase 2** (Dashboard Admin): 2-3 horas
- **Fase 3** (Gráficos): 1-2 horas
- **Fase 4** (Sincronização Offline): 2-3 horas
- **Testes**: 2-3 horas
- **TOTAL**: 11-17 horas

---

## ✅ Pré-requisitos

### 1. Verificar APIs tRPC
As APIs já foram criadas em `server/api/routers/`:
- ✅ `employees.ts` - CRUD de funcionários
- ✅ `check-ins.ts` - Check-ins diários
- ✅ `health.ts` - Hidratação, pressão arterial e queixas

### 2. Verificar Schema do Banco
O schema já está completo em `drizzle/schema.ts`:
- ✅ `employees` - Funcionários
- ✅ `checkIns` - Check-ins
- ✅ `userHydration` - Hidratação
- ✅ `bloodPressureRecords` - Pressão arterial
- ✅ `complaints` - Queixas

### 3. Verificar Migrations
```bash
cd /home/ubuntu/canteiro-saudavel
pnpm db:push
```

---

## 🔧 Fase 1: Migrar Hook useHealthData

### Arquivo: `hooks/use-health-data.ts`

#### Passo 1.1: Adicionar Imports tRPC
```typescript
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
```

#### Passo 1.2: Substituir Estado Local por Queries tRPC

**ANTES:**
```typescript
const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
const [pressureReadings, setPressureReadings] = useState<PressureReading[]>([]);
```

**DEPOIS:**
```typescript
const { user } = useAuth();
const employeeId = user?.id || "";

// Buscar check-ins do backend
const { data: checkIns = [], refetch: refetchCheckIns } = trpc.checkIns.getByEmployee.useQuery(
  { employeeId },
  { enabled: !!employeeId }
);

// Buscar pressão arterial do backend
const { data: pressureReadings = [], refetch: refetchPressure } = trpc.health.getPressureByEmployee.useQuery(
  { employeeId },
  { enabled: !!employeeId }
);

// Buscar hidratação do backend
const { data: hydrationRecords = [], refetch: refetchHydration } = trpc.health.getHydrationByEmployee.useQuery(
  { employeeId },
  { enabled: !!employeeId }
);

// Buscar queixas do backend
const { data: complaints = [], refetch: refetchComplaints } = trpc.health.getComplaintsByEmployee.useQuery(
  { employeeId },
  { enabled: !!employeeId }
);
```

#### Passo 1.3: Substituir Mutations

**ANTES:**
```typescript
const addCheckIn = useCallback(async (status: CheckInStatus) => {
  const newCheckIn: CheckIn = {
    id: Date.now().toString(),
    date: new Date().toISOString().split("T")[0],
    status,
    timestamp: Date.now(),
  };

  const updated = [...checkIns, newCheckIn];
  await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updated));
  setCheckIns(updated);
  return newCheckIn;
}, [checkIns]);
```

**DEPOIS:**
```typescript
const createCheckInMutation = trpc.checkIns.create.useMutation({
  onSuccess: () => {
    refetchCheckIns();
  },
});

const addCheckIn = useCallback(async (status: CheckInStatus) => {
  if (!employeeId) return null;

  try {
    const result = await createCheckInMutation.mutateAsync({
      employeeId,
      status,
      date: new Date().toISOString().split("T")[0],
    });
    return result;
  } catch (error) {
    console.error("Erro ao adicionar check-in:", error);
    return null;
  }
}, [employeeId, createCheckInMutation]);
```

#### Passo 1.4: Repetir para Outras Mutations
- `addPressureReading` → `trpc.health.createPressure.useMutation()`
- `addHydrationRecord` → `trpc.health.createHydration.useMutation()`
- `addComplaint` → `trpc.health.createComplaint.useMutation()`

#### Passo 1.5: Manter AsyncStorage como Fallback (Offline)
```typescript
// Tentar salvar no backend primeiro
try {
  await createCheckInMutation.mutateAsync({ ... });
} catch (error) {
  // Se falhar (sem internet), salvar localmente
  await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updated));
  // Marcar para sincronizar depois
  await AsyncStorage.setItem("pending_sync:check-ins", JSON.stringify(updated));
}
```

---

## 📊 Fase 2: Migrar Dashboard Admin

### Arquivo: `app/admin-dashboard.tsx`

#### Passo 2.1: Substituir Carregamento de Dados

**ANTES:**
```typescript
const loadDashboardData = async () => {
  try {
    const testData = await AsyncStorage.getItem("test_employees");
    if (testData) {
      const employees = JSON.parse(testData);
      // ... processar dados locais
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
};
```

**DEPOIS:**
```typescript
// Buscar TODOS os funcionários do banco
const { data: allEmployees = [], isLoading: loadingEmployees } = trpc.employees.list.useQuery();

// Buscar TODOS os check-ins
const { data: allCheckIns = [], isLoading: loadingCheckIns } = trpc.checkIns.getAll.useQuery();

// Buscar TODAS as queixas
const { data: allComplaints = [], isLoading: loadingComplaints } = trpc.health.getAllComplaints.useQuery();

// Buscar TODAS as leituras de pressão
const { data: allPressure = [], isLoading: loadingPressure } = trpc.health.getAllPressure.useQuery();

// Buscar TODA a hidratação
const { data: allHydration = [], isLoading: loadingHydration } = trpc.health.getAllHydration.useQuery();
```

#### Passo 2.2: Adicionar APIs Faltantes no Backend

Se as APIs `getAll` não existirem, adicione em `server/api/routers/`:

**`check-ins.ts`:**
```typescript
getAll: publicProcedure.query(async ({ ctx }) => {
  return await ctx.db.select().from(checkIns);
}),
```

**`health.ts`:**
```typescript
getAllComplaints: publicProcedure.query(async ({ ctx }) => {
  return await ctx.db.select().from(complaints);
}),

getAllPressure: publicProcedure.query(async ({ ctx }) => {
  return await ctx.db.select().from(bloodPressureRecords);
}),

getAllHydration: publicProcedure.query(async ({ ctx }) => {
  return await ctx.db.select().from(userHydration);
}),
```

#### Passo 2.3: Atualizar Cálculo de Estatísticas
```typescript
const calculateStats = () => {
  const stats = {
    totalEmployees: allEmployees.length,
    checkInsToday: allCheckIns.filter(c => c.date === today).length,
    complaintsThisWeek: allComplaints.filter(c => isThisWeek(c.date)).length,
    highPressureAlerts: allPressure.filter(p => p.systolic >= 140 || p.diastolic >= 90).length,
  };
  return stats;
};
```

---

## 📈 Fase 3: Conectar Gráficos

### Arquivo: `components/admin-charts.tsx`

#### Passo 3.1: Receber Dados Reais como Props
```typescript
interface AdminChartsProps {
  employees: Employee[];
  checkIns: CheckIn[];
  hydration: HydrationRecord[];
  pressure: PressureReading[];
  complaints: Complaint[];
}

export function AdminCharts({ employees, checkIns, hydration, pressure, complaints }: AdminChartsProps) {
  // Processar dados reais para os gráficos
  const hydrationData = processHydrationData(hydration);
  const pressureData = processPressureData(pressure);
  const complaintsData = processComplaintsData(complaints);
  const checkInsData = processCheckInsData(checkIns);

  return (
    <ScrollView>
      <HydrationChart data={hydrationData} />
      <PressureChart data={pressureData} />
      <ComplaintsChart data={complaintsData} />
      <CheckInsChart data={checkInsData} />
    </ScrollView>
  );
}
```

#### Passo 3.2: Passar Dados do Dashboard Admin
```typescript
// Em admin-dashboard.tsx
<AdminCharts
  employees={allEmployees}
  checkIns={allCheckIns}
  hydration={allHydration}
  pressure={allPressure}
  complaints={allComplaints}
/>
```

---

## 🔄 Fase 4: Sincronização Offline

### Criar Serviço de Sincronização

#### Arquivo: `lib/sync-service.ts`
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

const PENDING_SYNC_KEYS = {
  CHECK_INS: "pending_sync:check-ins",
  PRESSURE: "pending_sync:pressure",
  HYDRATION: "pending_sync:hydration",
  COMPLAINTS: "pending_sync:complaints",
};

export async function syncPendingData() {
  try {
    // Sincronizar check-ins pendentes
    const pendingCheckIns = await AsyncStorage.getItem(PENDING_SYNC_KEYS.CHECK_INS);
    if (pendingCheckIns) {
      const checkIns = JSON.parse(pendingCheckIns);
      for (const checkIn of checkIns) {
        await trpc.checkIns.create.mutate(checkIn);
      }
      await AsyncStorage.removeItem(PENDING_SYNC_KEYS.CHECK_INS);
    }

    // Repetir para outros tipos de dados...

    console.log("Sincronização concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao sincronizar dados:", error);
  }
}

// Chamar ao abrir o app
export function setupAutoSync() {
  // Sincronizar a cada 5 minutos
  setInterval(syncPendingData, 5 * 60 * 1000);

  // Sincronizar ao abrir o app
  syncPendingData();
}
```

---

## 🧪 Testes

### Checklist de Validação

#### 1. Cadastro e Login
- [ ] Cadastrar novo funcionário
- [ ] Verificar se aparece no Dashboard Admin instantaneamente
- [ ] Fazer login com o funcionário cadastrado

#### 2. Check-in
- [ ] Fazer check-in como funcionário
- [ ] Verificar se aparece no Dashboard Admin em tempo real
- [ ] Verificar se o gráfico de check-ins atualiza

#### 3. Hidratação
- [ ] Registrar ingestão de água
- [ ] Verificar sincronização no Dashboard Admin
- [ ] Verificar se o gráfico de hidratação atualiza

#### 4. Pressão Arterial
- [ ] Registrar pressão arterial
- [ ] Verificar alerta no Dashboard Admin (se elevada)
- [ ] Verificar se o gráfico de pressão atualiza

#### 5. Queixas
- [ ] Criar queixa de saúde
- [ ] Verificar se aparece no modal de Queixas do Dashboard Admin
- [ ] Marcar queixa como resolvida

#### 6. Sincronização Offline
- [ ] Desativar internet
- [ ] Fazer check-in, registrar hidratação, etc.
- [ ] Reativar internet
- [ ] Verificar se dados sincronizam automaticamente

#### 7. Gráficos
- [ ] Verificar se todos os 4 gráficos carregam dados reais
- [ ] Verificar se gráficos atualizam após novos registros

---

## 🐛 Troubleshooting

### Problema: "Cannot read property 'id' of null"
**Solução**: Verificar se `useAuth()` está retornando o usuário corretamente. Adicionar verificação:
```typescript
if (!user) {
  return <Text>Faça login para continuar</Text>;
}
```

### Problema: "Network request failed"
**Solução**: Verificar se o servidor backend está rodando:
```bash
cd /home/ubuntu/canteiro-saudavel
pnpm dev
```

### Problema: "Query failed: relation does not exist"
**Solução**: Executar migrations:
```bash
pnpm db:push
```

### Problema: Dados não aparecem no Dashboard Admin
**Solução**: Verificar se as APIs `getAll` foram implementadas no backend.

### Problema: Sincronização offline não funciona
**Solução**: Verificar se `setupAutoSync()` está sendo chamado no `app/_layout.tsx`:
```typescript
useEffect(() => {
  setupAutoSync();
}, []);
```

---

## 📚 Recursos Adicionais

- **Documentação tRPC**: https://trpc.io/docs
- **Documentação Drizzle ORM**: https://orm.drizzle.team/docs
- **Documentação React Query**: https://tanstack.com/query/latest/docs

---

## ✅ Conclusão

Após completar todas as 4 fases e validar os testes, o app estará 100% sincronizado com o backend PostgreSQL, permitindo:
- ✅ Dashboard Admin com dados em tempo real
- ✅ Comparativos entre funcionários
- ✅ Relatórios consolidados
- ✅ Sincronização offline automática

**Estimativa Total**: 11-17 horas de desenvolvimento + 2-3 horas de testes = **13-20 horas**
