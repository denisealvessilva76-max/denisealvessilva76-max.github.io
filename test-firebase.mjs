import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

console.log('Conectando ao Firebase:', firebaseConfig.databaseURL);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const matricula = '34501997';
const basePath = `canteiro-saudavel/employees/${matricula}`;

async function testar() {
  try {
    // 1. Salvar perfil
    console.log('\n1. Salvando perfil...');
    await set(ref(db, `${basePath}/profile`), {
      name: 'Denise Alves',
      matricula: '34501997',
      position: 'Técnica de Segurança',
      turno: 'diurno',
      lastUpdate: new Date().toISOString(),
    });
    console.log('✅ Perfil salvo!');

    // 2. Registrar check-in
    console.log('\n2. Registrando check-in...');
    const checkinRef = ref(db, `${basePath}/checkins`);
    await push(checkinRef, {
      mood: 'bem',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    });
    console.log('✅ Check-in registrado!');

    // 3. Registrar água
    console.log('\n3. Registrando hidratação...');
    const waterRef = ref(db, `${basePath}/water`);
    await push(waterRef, {
      amount: 250,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    });
    console.log('✅ Hidratação registrada!');

    // 4. Registrar pressão arterial
    console.log('\n4. Registrando pressão arterial...');
    const bpRef = ref(db, `${basePath}/bloodPressure`);
    await push(bpRef, {
      systolic: 120,
      diastolic: 80,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    });
    console.log('✅ Pressão arterial registrada!');

    // 5. Verificar se os dados foram salvos
    console.log('\n5. Verificando dados salvos...');
    const snapshot = await get(ref(db, basePath));
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('✅ DADOS ENCONTRADOS NO FIREBASE:');
      console.log('  - Perfil:', data.profile?.name);
      console.log('  - Check-ins:', Object.keys(data.checkins || {}).length, 'registros');
      console.log('  - Água:', Object.keys(data.water || {}).length, 'registros');
      console.log('  - Pressão:', Object.keys(data.bloodPressure || {}).length, 'registros');
    } else {
      console.log('❌ Nenhum dado encontrado no Firebase!');
    }

    console.log('\n🎉 TESTE CONCLUÍDO! Verifique o painel admin agora.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

testar();
