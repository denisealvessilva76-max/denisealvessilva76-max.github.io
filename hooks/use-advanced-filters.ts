import { useState, useCallback, useMemo } from 'react';

export interface FilterOptions {
  searchTerm?: string;
  shift?: 'morning' | 'afternoon' | 'night' | null;
  role?: string | null;
  status?: 'active' | 'inactive' | null;
  dateRange?: {
    start: Date;
    end: Date;
  };
  pressureStatus?: 'normal' | 'elevated' | 'high' | null;
  alertType?: string | null;
  sortBy?: 'name' | 'date' | 'points' | 'pressure';
  sortOrder?: 'asc' | 'desc';
}

export interface Employee {
  id: string;
  name: string;
  matricula: string;
  shift: 'morning' | 'afternoon' | 'night';
  role: string;
  status: 'active' | 'inactive';
  pressure?: { systolic: number; diastolic: number };
  lastCheckIn?: Date;
  points?: number;
  createdAt: Date;
}

export function useAdvancedFilters(employees: Employee[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    shift: null,
    role: null,
    status: null,
    pressureStatus: null,
    alertType: null,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Aplicar filtros
  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Filtro de busca por nome ou matrícula
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) || emp.matricula.toLowerCase().includes(term)
      );
    }

    // Filtro de turno
    if (filters.shift) {
      result = result.filter((emp) => emp.shift === filters.shift);
    }

    // Filtro de função
    if (filters.role) {
      result = result.filter((emp) => emp.role === filters.role);
    }

    // Filtro de status
    if (filters.status) {
      result = result.filter((emp) => emp.status === filters.status);
    }

    // Filtro de período
    if (filters.dateRange) {
      result = result.filter((emp) => {
        const empDate = new Date(emp.createdAt);
        return empDate >= filters.dateRange!.start && empDate <= filters.dateRange!.end;
      });
    }

    // Filtro de pressão arterial
    if (filters.pressureStatus) {
      result = result.filter((emp) => {
        if (!emp.pressure) return false;

        const { systolic, diastolic } = emp.pressure;

        switch (filters.pressureStatus) {
          case 'normal':
            return systolic < 120 && diastolic < 80;
          case 'elevated':
            return (systolic >= 120 && systolic < 130) || (diastolic >= 80 && diastolic < 90);
          case 'high':
            return systolic >= 130 || diastolic >= 90;
          default:
            return true;
        }
      });
    }

    // Ordenação
    if (filters.sortBy) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'date':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'points':
            aValue = a.points || 0;
            bValue = b.points || 0;
            break;
          case 'pressure':
            aValue = a.pressure?.systolic || 0;
            bValue = b.pressure?.systolic || 0;
            break;
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return result;
  }, [employees, filters]);

  // Atualizar filtros
  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      shift: null,
      role: null,
      status: null,
      pressureStatus: null,
      alertType: null,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, []);

  // Obter opções únicas para filtros
  const getFilterOptions = useCallback(() => {
    const shifts = Array.from(new Set(employees.map((e) => e.shift)));
    const roles = Array.from(new Set(employees.map((e) => e.role)));
    const statuses = Array.from(new Set(employees.map((e) => e.status)));

    return {
      shifts,
      roles,
      statuses,
    };
  }, [employees]);

  // Contar resultados por filtro
  const getFilterCounts = useCallback(() => {
    return {
      total: employees.length,
      filtered: filteredEmployees.length,
      active: employees.filter((e) => e.status === 'active').length,
      inactive: employees.filter((e) => e.status === 'inactive').length,
      morning: employees.filter((e) => e.shift === 'morning').length,
      afternoon: employees.filter((e) => e.shift === 'afternoon').length,
      night: employees.filter((e) => e.shift === 'night').length,
    };
  }, [employees, filteredEmployees]);

  return {
    filters,
    filteredEmployees,
    updateFilter,
    clearFilters,
    getFilterOptions,
    getFilterCounts,
  };
}

// Hook para busca com debounce
export function useSearch(items: any[], searchKeys: string[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const results = useMemo(() => {
    if (!searchTerm) return items;

    setIsSearching(true);

    const term = searchTerm.toLowerCase();
    const filtered = items.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && value.toString().toLowerCase().includes(term);
      })
    );

    setIsSearching(false);
    return filtered;
  }, [searchTerm, items, searchKeys]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
  };
}

// Hook para filtros de período
export function useDateRangeFilter() {
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    end: new Date(),
  });

  const setPreset = useCallback((preset: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    setDateRange({ start, end: now });
  }, []);

  const setCustomRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  return {
    dateRange,
    setPreset,
    setCustomRange,
  };
}
