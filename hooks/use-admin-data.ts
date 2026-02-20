import { trpc } from "@/lib/trpc";

/**
 * Hook para buscar dados do dashboard admin do backend PostgreSQL
 */
export function useAdminData() {
  // Buscar estatísticas gerais
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.dashboardStats.useQuery();

  // Buscar lista de funcionários
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = trpc.admin.listEmployees.useQuery();

  // Função para buscar detalhes de um funcionário específico
  const getEmployeeDetails = (employeeId: number) => {
    return trpc.admin.getEmployeeDetails.useQuery({ employeeId });
  };

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refetchStats(),
      refetchEmployees(),
    ]);
  };

  return {
    // Estatísticas gerais
    stats: stats || {
      checkIns: { today: 0, week: 0, month: 0 },
      hydration: { averageWeekly: 0 },
      pressureAlerts: { count: 0, recent: [] },
      complaints: { pending: 0 },
      challenges: { completionRate: 0, total: 0, completed: 0 },
      ranking: [],
    },
    statsLoading,

    // Lista de funcionários
    employees: employeesData?.employees || [],
    employeesLoading,

    // Funções
    getEmployeeDetails,
    refreshAll,
    
    // Loading geral
    isLoading: statsLoading || employeesLoading,
  };
}
