import { describe, it, expect } from 'vitest';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

describe('Firebase Connection', () => {
  it('should connect to Firebase Realtime Database', async () => {
    // Configuração do Firebase
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    // Verificar se todas as variáveis estão definidas
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.databaseURL).toBeDefined();
    expect(firebaseConfig.projectId).toBeDefined();

    // Inicializar Firebase
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    expect(app).toBeDefined();

    // Obter referência do banco de dados
    const database = getDatabase(app);
    expect(database).toBeDefined();

    // Testar escrita e leitura
    const testRef = ref(database, 'test/connection');
    const testData = {
      timestamp: Date.now(),
      message: 'Firebase connection test',
    };

    // Escrever dados
    await set(testRef, testData);

    // Ler dados
    const snapshot = await get(testRef);
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.val()).toEqual(testData);

    // Limpar dados de teste
    await remove(testRef);

    console.log('✅ Firebase connection test passed!');
  }, 10000); // Timeout de 10 segundos
});
