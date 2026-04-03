// ============================================================
// MÓDULO FIREBASE COMPLETO - CANTEIRO SAUDÁVEL
// ============================================================
// Configuração do Firebase com Firestore + Storage
// Firestore: Dados (usuários, desafios, pontos, etc)
// Storage: Fotos (desafios, perfil, etc)
// ============================================================

// CONFIGURAÇÃO FIREBASE (SUBSTITUIR COM SEUS DADOS)
const firebaseConfig = {
  apiKey: "AIzaSyB32S5Eac0guxy1herefub70AIAGkgF1Rw",
  authDomain: "canteiro-saudavel.firebaseapp.com",
  databaseURL: "https://canteiro-saudavel-default-rtdb.firebaseio.com",
  projectId: "canteiro-saudavel",
  storageBucket: "canteiro-saudavel.firebasestorage.app",
  messagingSenderId: "37768857073",
  appId: "1:37768857073:web:3e62666713391869813050",
  measurementId: "G-1BZG7Q9NL4"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Firebase inicializado com Firestore + Storage');

// ============================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================

async function fazerLogin(matricula, senha) {
  try {
    console.log('🔐 Tentando login com matrícula:', matricula);
    
    // Buscar usuário no Firestore
    const doc = await db.collection('usuarios').doc(matricula).get();
    
    if (!doc.exists) {
      console.error('❌ Matrícula não encontrada');
      throw new Error('Matrícula não encontrada');
    }
    
    const usuario = doc.data();
    console.log('✅ Usuário encontrado:', usuario.nome);
    
    // Salvar no localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('matricula', matricula);
    
    // Registrar login no Firestore
    await db.collection('historico_logins').add({
      matricula: matricula,
      nome: usuario.nome,
      data: new Date().toISOString(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return usuario;
    
  } catch (erro) {
    console.error('❌ Erro no login:', erro);
    throw erro;
  }
}

function autoLogin() {
  const usuarioStr = localStorage.getItem('usuario');
  
  if (usuarioStr && usuarioStr !== 'null' && usuarioStr !== 'undefined') {
    try {
      const usuario = JSON.parse(usuarioStr);
      if (usuario.matricula && usuario.nome) {
        console.log('✅ Auto-login bem-sucedido:', usuario.nome);
        return usuario;
      }
    } catch (e) {
      console.error('❌ Erro ao parsear usuário:', e);
    }
  }
  
  return null;
}

function fazerLogout() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('matricula');
  console.log('✅ Logout realizado');
}

// ============================================================
// FUNÇÕES DE DADOS
// ============================================================

async function buscarUsuario(matricula) {
  try {
    const doc = await db.collection('usuarios').doc(matricula).get();
    return doc.exists ? doc.data() : null;
  } catch (erro) {
    console.error('❌ Erro ao buscar usuário:', erro);
    return null;
  }
}

async function buscarTodosUsuarios() {
  try {
    const snapshot = await db.collection('usuarios').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (erro) {
    console.error('❌ Erro ao buscar usuários:', erro);
    return [];
  }
}

async function salvarDados(colecao, id, dados) {
  try {
    await db.collection(colecao).doc(id).set(dados, { merge: true });
    console.log('✅ Dados salvos:', colecao, id);
    return true;
  } catch (erro) {
    console.error('❌ Erro ao salvar:', erro);
    return false;
  }
}

async function buscarDados(colecao, id) {
  try {
    const doc = await db.collection(colecao).doc(id).get();
    return doc.exists ? doc.data() : null;
  } catch (erro) {
    console.error('❌ Erro ao buscar:', erro);
    return null;
  }
}

async function buscarColecao(colecao) {
  try {
    const snapshot = await db.collection(colecao).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (erro) {
    console.error('❌ Erro ao buscar coleção:', erro);
    return [];
  }
}

// ============================================================
// FUNÇÕES DE UPLOAD DE FOTOS
// ============================================================

async function uploadFoto(arquivo, caminho) {
  try {
    console.log('📸 Fazendo upload de foto:', caminho);
    
    const ref = storage.ref(caminho);
    const snapshot = await ref.put(arquivo);
    const url = await snapshot.ref.getDownloadURL();
    
    console.log('✅ Foto enviada:', url);
    return url;
    
  } catch (erro) {
    console.error('❌ Erro ao fazer upload:', erro);
    throw erro;
  }
}

async function deletarFoto(caminho) {
  try {
    await storage.ref(caminho).delete();
    console.log('✅ Foto deletada:', caminho);
  } catch (erro) {
    console.error('❌ Erro ao deletar foto:', erro);
  }
}

// ============================================================
// FUNÇÕES DE PONTOS (ANTI-ABUSO)
// ============================================================

async function adicionarPontos(matricula, tipo, pontos, motivo) {
  try {
    const usuario = await buscarUsuario(matricula);
    if (!usuario) throw new Error('Usuário não encontrado');
    
    const novosSaldo = (usuario.pontos || 0) + pontos;
    
    // Verificar teto mensal (4.000 pontos)
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const pontosDoMes = await buscarPontosMes(matricula, mesAtual);
    
    if (pontosDoMes + pontos > 4000) {
      console.warn('⚠️ Teto mensal atingido');
      return false;
    }
    
    // Salvar pontos
    await salvarDados('usuarios', matricula, { pontos: novosSaldo });
    
    // Registrar transação
    await db.collection('transacoes_pontos').add({
      matricula,
      tipo,
      pontos,
      motivo,
      saldoAnterior: usuario.pontos || 0,
      saldoNovo: novosSaldo,
      data: new Date().toISOString(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Pontos adicionados:', pontos);
    return true;
    
  } catch (erro) {
    console.error('❌ Erro ao adicionar pontos:', erro);
    return false;
  }
}

async function buscarPontosMes(matricula, mes) {
  try {
    const snapshot = await db.collection('transacoes_pontos')
      .where('matricula', '==', matricula)
      .where('data', '>=', `${mes}-01`)
      .where('data', '<=', `${mes}-31`)
      .get();
    
    return snapshot.docs.reduce((total, doc) => total + doc.data().pontos, 0);
  } catch (erro) {
    console.error('❌ Erro ao buscar pontos do mês:', erro);
    return 0;
  }
}

// ============================================================
// FUNÇÕES DE SINCRONIZAÇÃO EM TEMPO REAL
// ============================================================

function escutarUsuario(matricula, callback) {
  return db.collection('usuarios').doc(matricula).onSnapshot(doc => {
    if (doc.exists) {
      callback(doc.data());
    }
  });
}

function escutarColecao(colecao, callback) {
  return db.collection(colecao).onSnapshot(snapshot => {
    const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(dados);
  });
}

// ============================================================
// FUNÇÕES DE RELATÓRIOS
// ============================================================

async function gerarRelatorioPressao(matricula) {
  try {
    const snapshot = await db.collection('saude_pressao')
      .where('matricula', '==', matricula)
      .orderBy('data', 'desc')
      .limit(30)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (erro) {
    console.error('❌ Erro ao gerar relatório:', erro);
    return [];
  }
}

async function gerarRelatorioSintomas(matricula) {
  try {
    const snapshot = await db.collection('saude_sintomas')
      .where('matricula', '==', matricula)
      .orderBy('data', 'desc')
      .limit(50)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (erro) {
    console.error('❌ Erro ao gerar relatório:', erro);
    return [];
  }
}

// ============================================================
// EXPORTAR FUNÇÕES
// ============================================================

window.FirebaseApp = {
  // Auth
  fazerLogin,
  autoLogin,
  fazerLogout,
  
  // Dados
  buscarUsuario,
  buscarTodosUsuarios,
  salvarDados,
  buscarDados,
  buscarColecao,
  
  // Fotos
  uploadFoto,
  deletarFoto,
  
  // Pontos
  adicionarPontos,
  buscarPontosMes,
  
  // Sincronização
  escutarUsuario,
  escutarColecao,
  
  // Relatórios
  gerarRelatorioPressao,
  gerarRelatorioSintomas,
  
  // Firebase direto
  db,
  storage,
  firebase
};

console.log('✅ Módulo Firebase carregado. Use window.FirebaseApp para acessar funções.');
