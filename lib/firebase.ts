import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, get } from 'firebase/database';

/**
 * Configuração do Firebase Realtime Database
 * 
 * Para usar, configure as variáveis de ambiente:
 * - FIREBASE_API_KEY
 * - FIREBASE_AUTH_DOMAIN
 * - FIREBASE_DATABASE_URL
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_STORAGE_BUCKET
 * - FIREBASE_MESSAGING_SENDER_ID
 * - FIREBASE_APP_ID
 */

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://demo.firebaseio.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

// Inicializar Firebase (apenas uma vez)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Initialized');
} else {
  app = getApp();
  console.log('[Firebase] Already initialized');
}

// Obter referência do banco de dados
const database = getDatabase(app);

/**
 * Salvar dados de um funcionário no Firebase
 * Estrutura: canteiro-saudavel/employees/{matricula}/{chave}
 */
export async function saveToFirebase(
  matricula: string,
  chave: string,
  dados: any
): Promise<void> {
  try {
    const dbRef = ref(database, `canteiro-saudavel/employees/${matricula}/${chave}`);
    await set(dbRef, dados);
    console.log(`[Firebase] Saved ${chave} for ${matricula}`);
  } catch (error) {
    console.error(`[Firebase] Error saving ${chave}:`, error);
    throw error;
  }
}

/**
 * Adicionar item a um array no Firebase
 * Estrutura: canteiro-saudavel/employees/{matricula}/{chave}/{pushId}
 */
export async function pushToFirebase(
  matricula: string,
  chave: string,
  dado: any
): Promise<string> {
  try {
    const dbRef = ref(database, `canteiro-saudavel/employees/${matricula}/${chave}`);
    const newRef = push(dbRef);
    await set(newRef, {
      ...dado,
      timestamp: Date.now(),
    });
    console.log(`[Firebase] Pushed to ${chave} for ${matricula}`);
    return newRef.key!;
  } catch (error) {
    console.error(`[Firebase] Error pushing to ${chave}:`, error);
    throw error;
  }
}

/**
 * Obter dados de um funcionário do Firebase
 */
export async function getFromFirebase(
  matricula: string,
  chave: string
): Promise<any | null> {
  try {
    const dbRef = ref(database, `canteiro-saudavel/employees/${matricula}/${chave}`);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return null;
  } catch (error) {
    console.error(`[Firebase] Error getting ${chave}:`, error);
    return null;
  }
}

/**
 * Escutar mudanças em tempo real
 */
export function listenToFirebase(
  matricula: string,
  chave: string,
  callback: (data: any) => void
): () => void {
  const dbRef = ref(database, `canteiro-saudavel/employees/${matricula}/${chave}`);
  
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  
  // Retornar função para parar de escutar
  return () => off(dbRef);
}

/**
 * Obter todos os funcionários (para dashboard admin)
 */
export async function getAllEmployees(): Promise<any[]> {
  try {
    const dbRef = ref(database, 'canteiro-saudavel/employees');
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((matricula) => ({
        matricula,
        ...data[matricula].profile,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('[Firebase] Error getting all employees:', error);
    return [];
  }
}

/**
 * Escutar todos os funcionários em tempo real (para dashboard admin)
 */
export function listenToAllEmployees(
  callback: (employees: any[]) => void
): () => void {
  const dbRef = ref(database, 'canteiro-saudavel/employees');
  
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const employees = Object.keys(data).map((matricula) => ({
        matricula,
        ...data[matricula].profile,
      }));
      callback(employees);
    } else {
      callback([]);
    }
  });
  
  return () => off(dbRef);
}

export { database };
