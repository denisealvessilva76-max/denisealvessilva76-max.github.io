import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook para gerenciar dados no localStorage/AsyncStorage
 * Inspirado no aplicativo Kauber que funciona perfeitamente
 * 
 * Uso:
 * const [value, setValue, isLoading] = useLocalStorage('chave', valorInicial);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar valor inicial do AsyncStorage
  useEffect(() => {
    loadValue();
  }, [key]);

  const loadValue = async () => {
    try {
      setIsLoading(true);
      const item = await AsyncStorage.getItem(key);
      
      if (item !== null) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        console.log(`[useLocalStorage] Loaded ${key}:`, parsed);
      } else {
        console.log(`[useLocalStorage] No data for ${key}, using initial value`);
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error loading ${key}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar valor no AsyncStorage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        // Permitir função de atualização como setState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Salvar no estado
        setStoredValue(valueToStore);
        
        // Salvar no AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        
        console.log(`[useLocalStorage] Saved ${key}:`, valueToStore);
      } catch (error) {
        console.error(`[useLocalStorage] Error saving ${key}:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isLoading];
}

/**
 * Hook para gerenciar dados de um usuário específico
 * Padrão: cs_{chave}_{matricula}
 * 
 * Uso:
 * const [agua, setAgua] = useUserData('agua', matricula, []);
 */
export function useUserData<T>(
  chave: string,
  matricula: string | null,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const key = matricula ? `cs_${chave}_${matricula}` : `cs_${chave}_temp`;
  return useLocalStorage<T>(key, initialValue);
}

/**
 * Adicionar item a um array de dados do usuário
 * Similar ao salvarDado() do Kauber
 */
export async function addUserData<T>(
  chave: string,
  matricula: string,
  dado: T
): Promise<void> {
  try {
    const key = `cs_${chave}_${matricula}`;
    const existing = await AsyncStorage.getItem(key);
    const dados: T[] = existing ? JSON.parse(existing) : [];
    
    dados.push(dado);
    
    await AsyncStorage.setItem(key, JSON.stringify(dados));
    console.log(`[addUserData] Added to ${key}:`, dado);
  } catch (error) {
    console.error(`[addUserData] Error adding to ${chave}:`, error);
    throw error;
  }
}

/**
 * Obter dados do usuário
 * Similar ao dadosUsuario() do Kauber
 */
export async function getUserData<T>(
  chave: string,
  matricula: string
): Promise<T[]> {
  try {
    const key = `cs_${chave}_${matricula}`;
    const item = await AsyncStorage.getItem(key);
    
    if (item) {
      return JSON.parse(item);
    }
    
    return [];
  } catch (error) {
    console.error(`[getUserData] Error getting ${chave}:`, error);
    return [];
  }
}

/**
 * Salvar perfil completo do usuário
 * Similar ao salvarUsuario() do Kauber
 */
export async function saveUserProfile(usuario: any): Promise<void> {
  try {
    // Salvar usuário atual
    await AsyncStorage.setItem('cs_usuario', JSON.stringify(usuario));
    
    // Atualizar na lista de usuários
    const usersStr = await AsyncStorage.getItem('cs_users');
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    const idx = users.findIndex((u: any) => u.matricula === usuario.matricula);
    if (idx !== -1) {
      users[idx] = usuario;
    } else {
      users.push(usuario);
    }
    
    await AsyncStorage.setItem('cs_users', JSON.stringify(users));
    
    console.log('[saveUserProfile] Saved user:', usuario.matricula);
  } catch (error) {
    console.error('[saveUserProfile] Error:', error);
    throw error;
  }
}

/**
 * Obter usuário logado
 */
export async function getCurrentUser(): Promise<any | null> {
  try {
    const item = await AsyncStorage.getItem('cs_usuario');
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

/**
 * Obter todos os usuários cadastrados
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    const item = await AsyncStorage.getItem('cs_users');
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('[getAllUsers] Error:', error);
    return [];
  }
}
