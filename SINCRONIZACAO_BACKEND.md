# Sincronização com Backend - Status e Próximos Passos

## ✅ O que foi implementado

### 1. Schema do Banco de Dados (100%)
Todas as tabelas necessárias já existem no schema (`drizzle/schema.ts`):
- `employees` - Dados dos funcionários
- `checkIns` - Check-ins diários
- `userHydration` - Registros de hidratação
- `bloodPressureRecords` - Registros de pressão arterial
- `complaints` - Queixas de saúde

### 2. Migrations (100%)
- Executado `pnpm db:push` com sucesso
- Banco de dados PostgreSQL configurado e pronto

### 3. APIs tRPC (100%)
Criadas 3 rotas principais no backend:

#### `server/api/routers/employees.ts`
- `employees.create` - Criar funcionário
- `employees.getByCpf` - Buscar por CPF
- `employees.getById` - Buscar por ID
- `employees.update` - Atualizar dados
- `employees.list` - Listar todos
- `employees.updateLastLogin` - Atualizar último login

#### `server/api/routers/check-ins.ts`
- `checkIns.create` - Criar check-in
- `checkIns.getByEmployee` - Buscar por funcionário
- `checkIns.getToday` - Buscar check-in de hoje
- `checkIns.list` - Listar todos

#### `server/api/routers/health.ts`
- `health.hydration.upsert` - Criar/atualizar hidratação
- `health.hydration.getByEmployee` - Buscar por funcionário
- `health.hydration.getToday` - Buscar hidratação de hoje
- `health.hydration.list` - Listar todas
- `health.bloodPressure.create` - Criar registro de pressão
- `health.bloodPressure.getByEmployee` - Buscar por funcionário
- `health.bloodPressure.getLatest` - Buscar última pressão
- `health.bloodPressure.list` - Listar todas
- `health.complaints.create` - Criar queixa
- `health.complaints.getByEmployee` - Buscar por funcionário
- `health.complaints.resolve` - Marcar como resolvida
- `health.complaints.list` - Listar todas

### 4. Integração no AppRouter (100%)
As novas rotas foram registradas em `server/routers.ts`:
```typescript
export const appRouter = router({
  // ... outras rotas
  employees: employeesRouter,
  checkIns: checkInsRouter,
  health: healthRouter,
});
```

---

## ⏳ O que falta implementar

### 1. Migração do Frontend (0%)
As telas ainda usam AsyncStorage local. É necessário:

#### Tela de Cadastro (`app/cadastro.tsx`)
```typescript
// Antes (AsyncStorage):
await AsyncStorage.setItem("@employee", JSON.stringify(employeeData));

// Depois (Backend):
const result = await trpc.employees.create.mutate({
  cpf, matricula, name, weight, height, department, position, workType
});
```

#### Tela de Login (`app/login.tsx`)
```typescript
// Antes (AsyncStorage):
const employeeData = await AsyncStorage.getItem("@employee");

// Depois (Backend):
const employee = await trpc.employees.getByCpf.query({ cpf });
```

#### Tela de Check-in (`app/(tabs)/index.tsx`)
```typescript
// Antes (AsyncStorage):
await AsyncStorage.setItem(`@checkIn_${date}`, JSON.stringify(checkInData));

// Depois (Backend):
await trpc.checkIns.create.mutate({
  userId: employee.id,
  date: today,
  mood, symptoms, notes
});
```

#### Tela de Hidratação (`app/hydration.tsx`)
```typescript
// Antes (AsyncStorage):
await AsyncStorage.setItem("@hydration", JSON.stringify(hydrationData));

// Depois (Backend):
await trpc.health.hydration.upsert.mutate({
  userId: employee.id,
  date: today,
  cupsConsumed, totalMl, goalMl, weight, height, workType
});
```

#### Tela de Pressão Arterial (`app/blood-pressure.tsx`)
```typescript
// Antes (AsyncStorage):
await AsyncStorage.setItem("@bloodPressure", JSON.stringify(pressureData));

// Depois (Backend):
await trpc.health.bloodPressure.create.mutate({
  userId: employee.id,
  date: today,
  systolic, diastolic, notes
});
```

#### Tela de Queixas (`app/complaints.tsx`)
```typescript
// Antes (AsyncStorage):
await AsyncStorage.setItem("@complaints", JSON.stringify(complaintsData));

// Depois (Backend):
await trpc.health.complaints.create.mutate({
  userId: employee.id,
  date: today,
  complaint, severity, notes
});
```

#### Dashboard Admin (`app/admin-dashboard.tsx`)
```typescript
// Antes (AsyncStorage):
const employees = JSON.parse(await AsyncStorage.getItem("@employees") || "[]");

// Depois (Backend):
const employees = await trpc.employees.list.query();
const checkIns = await trpc.checkIns.list.query();
const hydration = await trpc.health.hydration.list.query();
const pressure = await trpc.health.bloodPressure.list.query();
const complaints = await trpc.health.complaints.list.query();
```

### 2. Cache Local com Fallback Offline (0%)
Implementar estratégia híbrida:
1. Tentar salvar no backend primeiro
2. Se falhar (sem internet), salvar no AsyncStorage
3. Quando voltar online, sincronizar dados pendentes

### 3. Sincronização em Tempo Real (0%)
- Implementar polling ou WebSockets para atualizar Dashboard em tempo real
- Quando um funcionário faz check-in, o Dashboard Admin deve atualizar automaticamente

---

## 🎯 Como Continuar

### Passo 1: Criar Hook de Sincronização
Criar `hooks/use-sync.ts` com funções auxiliares:
```typescript
export function useSyncEmployee() {
  const createEmployee = trpc.employees.create.useMutation();
  const getEmployee = trpc.employees.getByCpf.useQuery();
  
  return { createEmployee, getEmployee };
}
```

### Passo 2: Atualizar Telas Uma por Uma
1. Começar pela tela de cadastro (mais simples)
2. Depois login
3. Depois check-in, hidratação, pressão, queixas
4. Por último, Dashboard Admin (mais complexo)

### Passo 3: Testar Sincronização
1. Cadastrar funcionário → verificar no banco de dados
2. Fazer check-in → verificar no Dashboard Admin
3. Desligar internet → verificar fallback para AsyncStorage
4. Voltar online → verificar sincronização automática

### Passo 4: Implementar Sincronização Automática
Criar serviço de background que:
1. Verifica AsyncStorage em busca de dados não sincronizados
2. Envia para o backend quando houver conexão
3. Marca como sincronizado após sucesso

---

## 📊 Progresso Geral

- **Backend (Schema + APIs)**: ✅ 100%
- **Frontend (Integração)**: ⏳ 0%
- **Sincronização Offline**: ⏳ 0%
- **Testes**: ⏳ 0%

**Total**: 🔵 25% concluído

---

## 🚀 Benefícios Após Implementação Completa

1. **Dashboard Admin em Tempo Real**: Dados de TODOS os funcionários visíveis instantaneamente
2. **Backup Automático**: Dados salvos no banco de dados, não apenas no celular
3. **Relatórios Precisos**: Estatísticas baseadas em dados reais de múltiplos usuários
4. **Escalabilidade**: Suporta centenas de funcionários sem problemas de performance
5. **Sincronização Multi-Dispositivo**: Funcionário pode acessar de qualquer celular
6. **Auditoria**: Histórico completo de todas as ações no banco de dados
