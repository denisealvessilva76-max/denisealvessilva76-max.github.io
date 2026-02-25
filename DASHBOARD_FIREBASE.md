# Dashboard Administrativo com Firebase - Documentação

## 🎯 Objetivo

Atualizar o dashboard administrativo para exibir dados em tempo real do Firebase Realtime Database, substituindo as consultas tRPC/MySQL que não funcionavam no navegador.

---

## ✅ Mudanças Implementadas

### 1. **Hook useFirebaseAdmin** (`hooks/use-firebase-admin.ts`)

Novo hook criado para buscar e agregar dados de todos os funcionários diretamente do Firebase.

**Funcionalidades:**
- ✅ Listener em tempo real (`onValue`) - atualiza automaticamente quando dados mudam
- ✅ Agrega dados de todos os funcionários
- ✅ Calcula estatísticas (total, ativos hoje, hidratação média, queixas, etc.)
- ✅ Processa check-ins, hidratação, pressão arterial e sintomas
- ✅ Função `refresh()` para atualização manual

**Estrutura de dados retornada:**

```typescript
{
  stats: {
    totalEmployees: number;
    activeToday: number;
    checkInsToday: number;
    hydrationAverage: number;  // em ml
    complaintsThisWeek: number;
    challengesActive: number;
  },
  employees: [
    {
      id: string;
      name: string;
      matricula: string;
      position?: string;
      turno?: string;
      lastCheckIn: string | null;
      hydrationToday: number;
      hydrationGoal: number;
      lastPressure: { systolic, diastolic, date } | null;
      complaintsCount: number;
      challengesActive: number;
    }
  ],
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

### 2. **Dashboard Atualizado** (`app/admin-dashboard.tsx`)

Dashboard administrativo agora usa exclusivamente dados do Firebase.

**Mudanças principais:**
- ❌ Removido: `useAdminData` (dependia de tRPC)
- ✅ Adicionado: `useFirebaseAdmin` (leitura direta do Firebase)
- ✅ Indicador visual "🔥 Tempo Real (Firebase)" no header
- ✅ Tratamento de erro robusto
- ✅ Pull-to-refresh funcional
- ✅ Hidratação exibida em ml (não %)
- ✅ Informações extras: cargo e turno dos funcionários

---

## 🔥 Como Funciona

### Estrutura de Dados no Firebase

```
canteiro-saudavel/
  employees/
    {matricula}/
      profile/
        name: "João Silva"
        matricula: "12345"
        position: "Pedreiro"
        turno: "diurno"
        ...
      checkins/
        {pushId}/
          date: "2026-02-25"
          timestamp: 1740484800000
      water/
        {pushId}/
          amount: 250
          date: "2026-02-25"
          timestamp: 1740484800000
      bloodPressure/
        {pushId}/
          systolic: 120
          diastolic: 80
          date: "2026-02-25"
          timestamp: 1740484800000
      symptoms/
        {pushId}/
          symptoms: ["dor_costas"]
          details: "Dor ao levantar peso"
          date: "2026-02-25"
          timestamp: 1740484800000
```

### Fluxo de Atualização

1. **Funcionário usa o app** → Dados salvos no localStorage
2. **Hook useFirebaseSync** → Sincroniza com Firebase em segundo plano
3. **Dashboard Admin** → Listener do Firebase detecta mudança
4. **useFirebaseAdmin** → Processa e agrega dados automaticamente
5. **UI atualiza** → Estatísticas aparecem em tempo real

---

## 🧪 Como Testar

### 1. **Testar com Dados de Teste**

Você pode adicionar dados de teste diretamente no Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: `canteiro-saudavel-dev`
3. Vá em **Realtime Database**
4. Adicione manualmente:

```json
{
  "canteiro-saudavel": {
    "employees": {
      "12345": {
        "profile": {
          "name": "João Teste",
          "matricula": "12345",
          "position": "Pedreiro",
          "turno": "diurno"
        },
        "checkins": {
          "test1": {
            "date": "2026-02-25",
            "timestamp": 1740484800000
          }
        },
        "water": {
          "test1": {
            "amount": 500,
            "date": "2026-02-25",
            "timestamp": 1740484800000
          }
        }
      }
    }
  }
}
```

### 2. **Testar com App Real**

1. Abra o app no celular via QR code
2. Faça cadastro de um novo funcionário
3. Faça check-in
4. Registre hidratação (ex: 250ml)
5. Registre pressão arterial
6. Abra o dashboard admin no navegador
7. Verifique se os dados aparecem em tempo real

### 3. **Testar Atualização em Tempo Real**

1. Abra o dashboard admin em um navegador
2. Abra o app no celular
3. Registre hidratação no app
4. **Observe o dashboard atualizar automaticamente** (sem precisar recarregar)

---

## 📊 Estatísticas Calculadas

### Total de Funcionários
Conta todos os funcionários cadastrados no Firebase.

### Ativos Hoje
Funcionários que fizeram check-in hoje (data = hoje).

### Check-ins Hoje
Mesmo valor que "Ativos Hoje".

### Hidratação Média
Média de água ingerida hoje por todos os funcionários que registraram hidratação (em ml).

**Cálculo:**
```
hidratação_média = soma(água_hoje_de_todos) / quantidade_de_funcionários_que_beberam_água
```

### Queixas (Semana)
Total de sintomas/queixas registrados nos últimos 7 dias.

### Desafios Ativos
TODO: Será implementado quando houver sistema de desafios.

---

## 🐛 Problemas Conhecidos

### 1. **tRPC não funciona no navegador**
- **Status:** ✅ Resolvido
- **Solução:** Dashboard agora usa Firebase diretamente, sem tRPC

### 2. **Dashboard mostrava 0 funcionários ativos**
- **Status:** ✅ Resolvido
- **Causa:** Dependia de tRPC que falhava
- **Solução:** Leitura direta do Firebase

### 3. **Dados não persistiam após reload**
- **Status:** ✅ Resolvido
- **Solução:** Sistema híbrido localStorage + Firebase

---

## 🔧 Manutenção

### Adicionar Nova Estatística

1. Edite `hooks/use-firebase-admin.ts`
2. Adicione campo em `AdminDashboardStats`
3. Calcule no listener `onValue`
4. Atualize `app/admin-dashboard.tsx` para exibir

**Exemplo: Adicionar "Pausas Ativas Hoje"**

```typescript
// 1. Adicionar em AdminDashboardStats
export interface AdminDashboardStats {
  // ... campos existentes
  activePausesToday: number;
}

// 2. Calcular no listener
let activePausesToday = 0;

Object.keys(data).forEach((matricula) => {
  const empData = data[matricula];
  const pauses = empData.activePauses || {};
  const todayPauses = Object.values(pauses).filter(
    (p: any) => p.date === today
  );
  activePausesToday += todayPauses.length;
});

// 3. Adicionar ao setStats
setStats({
  // ... outros campos
  activePausesToday,
});
```

### Adicionar Novo Campo de Funcionário

Siga o mesmo padrão de `lastPressure` ou `complaintsCount`.

---

## 📝 Próximos Passos

- [ ] Implementar sistema de desafios
- [ ] Adicionar filtros por período (semana/mês)
- [ ] Gráficos de tendências
- [ ] Exportação de relatórios com dados do Firebase
- [ ] Notificações push para admin quando houver queixas críticas

---

## 🎉 Resultado Final

✅ Dashboard administrativo 100% funcional
✅ Dados em tempo real do Firebase
✅ Atualização automática sem reload
✅ Estatísticas precisas e agregadas
✅ Lista completa de funcionários com detalhes
✅ Exportação de PDF funcionando

**O problema de "0 funcionários ativos" está resolvido!**
