# 🔄 Guia de Migração para Backend PostgreSQL

## 📋 Resumo Executivo

Este documento descreve o processo de migração completa do aplicativo **Canteiro Saudável** de armazenamento local (AsyncStorage) para banco de dados PostgreSQL com sincronização em tempo real.

**Status Atual:** 25% implementado  
**Tempo Estimado:** 8-12 horas de desenvolvimento  
**Complexidade:** Alta  

---

## ✅ O Que Já Está Implementado

### 1. Infraestrutura de Backend (100%)
- ✅ Banco de dados PostgreSQL configurado
- ✅ Schema completo com 5 tabelas:
  - `employees` (funcionários)
  - `checkIns` (check-ins diários)
  - `userHydration` (hidratação)
  - `bloodPressureRecords` (pressão arterial)
  - `complaints` (queixas de saúde)
- ✅ Migrations aplicadas (`pnpm db:push`)

### 2. APIs tRPC (100%)
- ✅ `server/api/routers/employees.ts` - CRUD completo de funcionários
- ✅ `server/api/routers/check-ins.ts` - CRUD de check-ins
- ✅ `server/api/routers/health.ts` - CRUD de hidratação, pressão e queixas
- ✅ Rotas registradas em `server/routers.ts`

### 3. Cadastro e Login (100%)
- ✅ `app/employee-register.tsx` usa `trpc.employeeAuth.register`
- ✅ `app/employee-login.tsx` usa `trpc.employeeAuth.login`
- ✅ Dados salvos no banco de dados PostgreSQL
- ✅ Persistência de sessão implementada

---

## ❌ O Que Falta Implementar

### 1. Hook `useHealthData` (0%)

**Arquivo:** `hooks/use-health-data.ts`

**Problema:** Atualmente salva tudo em AsyncStorage local.

**Solução:** Migrar para usar APIs tRPC.

#### Antes (AsyncStorage):
```typescript
const addCheckIn = async (status: CheckInStatus) => {
  const checkIn = { id: uuid(), date: today, status };
  await AsyncStorage.setItem(`check_ins_${userId}`, JSON.stringify([...checkIns, checkIn]));
  return checkIn;
};
```

#### Depois (tRPC):
```typescript
const addCheckInMutation = trpc.checkIns.create.useMutation();

const addCheckIn = async (status: CheckInStatus) => {
  const result = await addCheckInMutation.mutateAsync({
    employeeId: userId,
    status,
    date: new Date().toISOString(),
  });
  return result.checkIn;
};
```

**Funções a migrar:**
- `addCheckIn()` → `trpc.checkIns.create`
- `addHydration()` → `trpc.hydration.create`
- `addPressure()` → `trpc.bloodPressure.create`
- `addComplaint()` → `trpc.complaints.create`
- `getCheckIns()` → `trpc.checkIns.getByEmployee`
- `getHydration()` → `trpc.hydration.getByEmployee`
- `getPressure()` → `trpc.bloodPressure.getByEmployee`
- `getComplaints()` → `trpc.complaints.getByEmployee`

---

### 2. Dashboard Admin (0%)

**Arquivo:** `app/admin-dashboard.tsx`

**Problema:** Carrega dados de AsyncStorage ou dados de teste.

**Solução:** Buscar dados reais do banco via tRPC.

#### Antes (AsyncStorage):
```typescript
const loadDashboardData = async () => {
  const employeeIds = await AsyncStorage.getItem("employee_ids");
  // ... busca dados de cada funcionário em AsyncStorage
};
```

#### Depois (tRPC):
```typescript
const { data: employees, isLoading } = trpc.employees.list.useQuery();
const { data: checkIns } = trpc.checkIns.getAll.useQuery();
const { data: hydration } = trpc.hydration.getAll.useQuery();
const { data: pressure } = trpc.bloodPressure.getAll.useQuery();
const { data: complaints } = trpc.complaints.list.useQuery();
```

**Benefícios:**
- ✅ Sincronização instantânea
- ✅ Dados de TODOS os funcionários visíveis
- ✅ Atualizações em tempo real
- ✅ Sem necessidade de "dados de teste"

---

### 3. Gráficos Dinâmicos (0%)

**Arquivo:** `components/admin-charts.tsx`

**Problema:** Usa dados estáticos (hardcoded).

**Solução:** Conectar aos dados reais do banco.

#### Antes (Dados Estáticos):
```typescript
<HydrationChart
  data={[
    { day: "Seg", value: 75 },
    { day: "Ter", value: 82 },
    // ...
  ]}
/>
```

#### Depois (Dados Dinâmicos):
```typescript
const { data: hydrationData } = trpc.hydration.getAll.useQuery();

const chartData = useMemo(() => {
  // Processar dados reais do banco
  const last7Days = getLast7Days();
  return last7Days.map(day => ({
    day: formatDay(day),
    value: calculateAverageHydration(hydrationData, day),
  }));
}, [hydrationData]);

<HydrationChart data={chartData} />
```

---

## 🛠️ Plano de Implementação Detalhado

### Fase 1: Migrar Hook `useHealthData` (4 horas)

**Passo 1:** Adicionar mutations tRPC
```typescript
// hooks/use-health-data.ts
import { trpc } from "@/lib/trpc";

export function useHealthData() {
  const { user } = useAuth();
  
  // Mutations
  const addCheckInMutation = trpc.checkIns.create.useMutation();
  const addHydrationMutation = trpc.hydration.create.useMutation();
  const addPressureMutation = trpc.bloodPressure.create.useMutation();
  const addComplaintMutation = trpc.complaints.create.useMutation();
  
  // Queries
  const { data: checkIns } = trpc.checkIns.getByEmployee.useQuery(
    { employeeId: user?.id || "" },
    { enabled: !!user?.id }
  );
  
  // ... implementar funções
}
```

**Passo 2:** Manter AsyncStorage como fallback offline
```typescript
const addCheckIn = async (status: CheckInStatus) => {
  try {
    // Tentar salvar no banco primeiro
    const result = await addCheckInMutation.mutateAsync({
      employeeId: user.id,
      status,
      date: new Date().toISOString(),
    });
    return result.checkIn;
  } catch (error) {
    // Fallback para AsyncStorage se offline
    console.warn("Offline, salvando localmente:", error);
    const checkIn = { id: uuid(), date: today, status };
    await AsyncStorage.setItem(`check_ins_${user.id}`, JSON.stringify([...checkIns, checkIn]));
    return checkIn;
  }
};
```

**Passo 3:** Implementar sincronização ao reconectar
```typescript
useEffect(() => {
  // Quando voltar online, sincronizar dados locais
  syncLocalDataToBackend();
}, [isOnline]);
```

---

### Fase 2: Migrar Dashboard Admin (3 horas)

**Passo 1:** Substituir `loadDashboardData()`
```typescript
// app/admin-dashboard.tsx
export default function AdminDashboardScreen() {
  // Buscar dados do banco
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery();
  const { data: checkIns, isLoading: loadingCheckIns } = trpc.checkIns.getAll.useQuery();
  const { data: hydration, isLoading: loadingHydration } = trpc.hydration.getAll.useQuery();
  const { data: pressure, isLoading: loadingPressure } = trpc.bloodPressure.getAll.useQuery();
  const { data: complaints, isLoading: loadingComplaints } = trpc.complaints.list.useQuery();
  
  const isLoading = loadingEmployees || loadingCheckIns || loadingHydration || loadingPressure || loadingComplaints;
  
  // Calcular estatísticas
  const stats = useMemo(() => calculateStats(employees, checkIns, hydration, pressure, complaints), [employees, checkIns, hydration, pressure, complaints]);
  
  // ...
}
```

**Passo 2:** Remover lógica de "dados de teste"
```typescript
// Remover:
- generateTestData()
- clearTestData()
- hasTestData()
- loadTestData()
- Banner amarelo de "Modo de Teste"
- Botões "Gerar Dados de Teste" e "Limpar Dados de Teste"
```

**Passo 3:** Atualizar modals para usar dados reais
```typescript
const loadComplaintsData = () => {
  // Não precisa mais carregar de AsyncStorage
  // Os dados já estão em `complaints` do useQuery
  const complaintsForModal = complaints.map(c => ({
    id: c.id,
    employeeName: employees.find(e => e.id === c.employeeId)?.nome || "Desconhecido",
    employeeMatricula: employees.find(e => e.id === c.employeeId)?.matricula || "N/A",
    complaint: c.description,
    severity: c.severity,
    date: c.createdAt,
    resolved: c.resolved || false,
  }));
  setComplaintsData(complaintsForModal);
  setComplaintsModalVisible(true);
};
```

---

### Fase 3: Conectar Gráficos aos Dados Reais (2 horas)

**Passo 1:** Criar hook `useChartData`
```typescript
// hooks/use-chart-data.ts
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useChartData() {
  const { data: hydration } = trpc.hydration.getAll.useQuery();
  const { data: pressure } = trpc.bloodPressure.getAll.useQuery();
  const { data: complaints } = trpc.complaints.list.useQuery();
  const { data: checkIns } = trpc.checkIns.getAll.useQuery();
  
  const hydrationChartData = useMemo(() => {
    const last7Days = getLast7Days();
    return last7Days.map(day => {
      const dayData = hydration?.filter(h => isSameDay(h.date, day)) || [];
      const avgPercentage = dayData.length > 0
        ? dayData.reduce((sum, h) => sum + (h.totalMl / h.goalMl * 100), 0) / dayData.length
        : 0;
      return { day: formatDay(day), value: Math.round(avgPercentage) };
    });
  }, [hydration]);
  
  const pressureChartData = useMemo(() => {
    const last7Days = getLast7Days();
    return last7Days.map(day => {
      const dayData = pressure?.filter(p => isSameDay(p.date, day)) || [];
      const avgSystolic = dayData.length > 0
        ? dayData.reduce((sum, p) => sum + p.systolic, 0) / dayData.length
        : 0;
      const avgDiastolic = dayData.length > 0
        ? dayData.reduce((sum, p) => sum + p.diastolic, 0) / dayData.length
        : 0;
      return {
        day: formatDay(day),
        systolic: Math.round(avgSystolic),
        diastolic: Math.round(avgDiastolic),
      };
    });
  }, [pressure]);
  
  const complaintsChartData = useMemo(() => {
    const grouped = complaints?.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return Object.entries(grouped).map(([name, count], index) => ({
      name,
      count,
      color: COMPLAINT_COLORS[index % COMPLAINT_COLORS.length],
    }));
  }, [complaints]);
  
  const checkInsChartData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayCheckIns = checkIns?.filter(c => c.date === today) || [];
    
    const grouped = todayCheckIns.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { status: "Bem", count: grouped["bem"] || 0 },
      { status: "Dor leve", count: grouped["dor-leve"] || 0 },
      { status: "Dor forte", count: grouped["dor-forte"] || 0 },
    ];
  }, [checkIns]);
  
  return {
    hydrationChartData,
    pressureChartData,
    complaintsChartData,
    checkInsChartData,
  };
}
```

**Passo 2:** Usar no Dashboard Admin
```typescript
// app/admin-dashboard.tsx
import { useChartData } from "@/hooks/use-chart-data";

export default function AdminDashboardScreen() {
  const {
    hydrationChartData,
    pressureChartData,
    complaintsChartData,
    checkInsChartData,
  } = useChartData();
  
  // ...
  
  {activeTab === "charts" && (
    <ScrollView>
      <HydrationChart data={hydrationChartData} />
      <PressureChart data={pressureChartData} />
      <ComplaintsChart data={complaintsChartData} />
      <CheckInsChart data={checkInsChartData} />
    </ScrollView>
  )}
}
```

---

### Fase 4: Testes e Validação (2 horas)

**Checklist de Testes:**

1. **Cadastro e Login**
   - [ ] Cadastrar funcionário → verificar no banco PostgreSQL
   - [ ] Fazer login → verificar autenticação

2. **Check-in**
   - [ ] Fazer check-in → verificar salvamento no banco
   - [ ] Verificar aparição instantânea no Dashboard Admin

3. **Hidratação**
   - [ ] Registrar hidratação → verificar no banco
   - [ ] Verificar atualização do gráfico no Dashboard

4. **Pressão Arterial**
   - [ ] Registrar pressão → verificar no banco
   - [ ] Verificar alerta de pressão elevada no Dashboard

5. **Queixas**
   - [ ] Registrar queixa → verificar no banco
   - [ ] Verificar aparição no modal de Queixas do Dashboard

6. **Sincronização Offline**
   - [ ] Desligar internet → fazer check-in
   - [ ] Religar internet → verificar sincronização automática

7. **Dashboard Admin**
   - [ ] Verificar estatísticas gerais atualizadas
   - [ ] Verificar lista de funcionários completa
   - [ ] Verificar modals com dados reais
   - [ ] Verificar gráficos dinâmicos

---

## 🚨 Riscos e Mitigações

### Risco 1: Perda de Dados Locais
**Mitigação:** Implementar migração automática de AsyncStorage para backend na primeira vez que o app conectar após atualização.

### Risco 2: App Quebrar Offline
**Mitigação:** Manter AsyncStorage como fallback e implementar sincronização ao reconectar.

### Risco 3: Performance com Muitos Funcionários
**Mitigação:** Implementar paginação nas queries tRPC e cache no React Query.

### Risco 4: Conflitos de Sincronização
**Mitigação:** Usar timestamps para resolver conflitos (última atualização vence).

---

## 📊 Benefícios da Migração

### Para Administradores:
- ✅ Visibilidade instantânea de TODOS os funcionários
- ✅ Dados em tempo real (sem delay)
- ✅ Gráficos dinâmicos atualizados automaticamente
- ✅ Relatórios mais precisos
- ✅ Histórico completo de todos os registros

### Para Funcionários:
- ✅ Dados sincronizados entre dispositivos
- ✅ Backup automático na nuvem
- ✅ Funciona offline (fallback local)
- ✅ Mais rápido (cache do React Query)

### Para o Sistema:
- ✅ Escalabilidade (suporta milhares de funcionários)
- ✅ Integridade de dados (validações no backend)
- ✅ Auditoria completa (logs de todas as operações)
- ✅ Segurança (dados criptografados em trânsito)

---

## 🔐 Segurança

### Autenticação
- ✅ JWT tokens para sessões
- ✅ Refresh tokens para renovação automática
- ✅ Logout em todos os dispositivos

### Autorização
- ✅ Funcionários só veem seus próprios dados
- ✅ Admins veem dados de todos (anonimizados se necessário)
- ✅ Validação de permissões em cada rota tRPC

### Criptografia
- ✅ HTTPS em todas as comunicações
- ✅ Senhas hasheadas com bcrypt
- ✅ Dados sensíveis criptografados no banco

---

## 📞 Próximos Passos

1. **Implementar Fase 1** (Hook useHealthData) - 4 horas
2. **Implementar Fase 2** (Dashboard Admin) - 3 horas
3. **Implementar Fase 3** (Gráficos Dinâmicos) - 2 horas
4. **Testar e Validar** (Fase 4) - 2 horas
5. **Criar Checkpoint** - Salvar versão estável
6. **Gerar APK** - Testar em dispositivo real
7. **Publicar na Play Store** - Disponibilizar para usuários

---

**Desenvolvido por:** Denise Alves - Obra 345  
**Versão:** 1.0.0  
**Data:** Fevereiro 2026
