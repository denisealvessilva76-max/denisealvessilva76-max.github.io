/**
 * Painel Administrativo - Canteiro Saudável
 * Versão 3.0 - Sincronização PostgreSQL + Firebase fallback, credenciais personalizadas
 */

// ========== CONFIGURAÇÃO DA API POSTGRESQL ==========
// A URL base da API REST do servidor. Quando o painel é servido pelo próprio servidor
// (rota /painel), a API fica em /api/painel. Quando hospedado externamente (GitHub Pages),
// deve apontar para o servidor publicado.
const API_BASE = window.location.hostname.includes('github.io')
    ? 'https://3000-itldlyatedialpnf14oog-701edde6.us2.manus.computer/api/painel'
    : '/api/painel';

let apiToken = null; // Token JWT da API PostgreSQL
let useApiMode = false; // true = usando PostgreSQL, false = usando Firebase

/** Faz uma requisição autenticada à API PostgreSQL */
async function apiRequest(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
    const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}

/** Tenta login na API PostgreSQL. Retorna true se bem-sucedido. */
async function tryApiLogin(email, password) {
    try {
        const data = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        }).then(r => r.json());
        if (data.success && data.token) {
            apiToken = data.token;
            localStorage.setItem('api_token', data.token);
            localStorage.setItem('api_user', JSON.stringify({ email: data.email, name: data.name, role: data.role }));
            useApiMode = true;
            console.log('[API] Login PostgreSQL bem-sucedido');
            return true;
        }
    } catch (e) {
        console.warn('[API] Servidor PostgreSQL não disponível, usando Firebase:', e.message);
    }
    return false;
}

/** Carrega todos os dados do dashboard via API PostgreSQL */
async function loadFromApi() {
    showLoading(true);
    try {
        const { from, to } = getDateRange();
        const turno = filterState.shift === 'all' ? 'todos' : filterState.shift;

        const [empRes, ciRes, hydRes, compRes, bpRes, chalRes, rankRes] = await Promise.all([
            apiRequest(`/employees?turno=${turno}`),
            apiRequest(`/checkins?startDate=${from}&endDate=${to}&turno=${turno}`),
            apiRequest(`/hydration?startDate=${from}&endDate=${to}&turno=${turno}`),
            apiRequest(`/complaints?startDate=${from}&endDate=${to}&turno=${turno}`),
            apiRequest(`/blood-pressure?startDate=${from}&endDate=${to}&turno=${turno}`),
            apiRequest(`/challenges?turno=${turno}`),
            apiRequest(`/ranking?turno=${turno}`),
        ]);

        // Converter dados da API para o formato interno do painel
        employeesData = (empRes.data || []).map(emp => {
            // Agrupar check-ins deste funcionário
            const empCheckins = {};
            (ciRes.data || []).filter(c => c.userId === emp.userId).forEach(c => {
                empCheckins[c.id] = { date: c.date ? c.date.split('T')[0] : null, status: c.mood === 'bem' ? 'good' : 'pain', notes: c.notes };
            });

            // Agrupar hidratação
            const empHydration = {};
            (hydRes.data || []).filter(h => h.userId === emp.userId).forEach(h => {
                const d = h.date ? h.date.split('T')[0] : null;
                if (d) empHydration[d] = { waterIntake: h.totalMl || 0, goal: h.goalMl || 2000 };
            });

            // Agrupar sintomas/queixas
            const empSymptoms = {};
            (compRes.data || []).filter(c => c.userId === emp.userId).forEach(c => {
                empSymptoms[c.id] = {
                    date: c.date ? c.date.split('T')[0] : null,
                    symptoms: c.complaint ? [c.complaint] : [],
                    details: c.notes || '',
                    severity: c.severity,
                };
            });

            // Agrupar pressão
            const empPressure = {};
            (bpRes.data || []).filter(b => b.userId === emp.userId).forEach(b => {
                empPressure[b.id] = { date: b.date ? b.date.split('T')[0] : null, systolic: b.systolic, diastolic: b.diastolic };
            });

            // Agrupar desafios
            const empChallenges = {};
            (chalRes.data || []).filter(c => c.userId === emp.userId).forEach(c => {
                const pct = c.targetValue > 0 ? Math.round((c.currentValue / c.targetValue) * 100) : 0;
                empChallenges[c.id] = {
                    challengeId: c.challengeId,
                    title: c.challengeId,
                    status: c.completed ? 'completed' : 'active',
                    progress: pct,
                    completed: !!c.completed,
                    endDate: c.endDate ? c.endDate.split('T')[0] : null,
                };
            });

            return {
                matricula: emp.matricula || emp.id,
                name: emp.name || 'Sem nome',
                cargo: emp.position || emp.department || '-',
                turno: emp.turno || '-',
                email: '',
                hydration: empHydration,
                pressure: empPressure,
                symptoms: empSymptoms,
                checkins: empCheckins,
                challenges: empChallenges,
                points: emp.points || 0,
                _apiId: emp.id,
                _userId: emp.userId,
            };
        });

        console.log(`[API] Carregados ${employeesData.length} funcionários do PostgreSQL`);
        updateDashboard();
    } catch (e) {
        console.error('[API] Erro ao carregar dados:', e);
        // Fallback para Firebase
        useApiMode = false;
        loadEmployeesDataFirebase();
        return;
    } finally {
        showLoading(false);
    }
}

// ========== CONFIGURAÇÃO DO FIREBASE ==========
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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ========== ESTADO DA APLICAÇÃO ==========
let currentUser = null;
let employeesData = [];
let rewardsData = [];
let unsubscribe = null;
let chartsInstances = {};

// ========== ESTADO DOS FILTROS ==========
let filterState = {
    period: 'week',       // 'week' | 'month' | 'custom'
    shift: 'all',         // 'all' | 'diurno' | 'noturno'
    risk: 'all',          // 'all' | 'hipertensao' | 'sobrepeso' | 'queixas' | 'sem-checkin'
    dateFrom: null,       // string YYYY-MM-DD (para custom)
    dateTo: null,         // string YYYY-MM-DD (para custom)
};

/** Retorna { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } com base no filtro ativo */
function getDateRange() {
    const today = new Date().toISOString().split('T')[0];
    if (filterState.period === 'week') {
        const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { from, to: today };
    }
    if (filterState.period === 'month') {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        return { from, to: today };
    }
    if (filterState.period === 'custom' && filterState.dateFrom && filterState.dateTo) {
        return { from: filterState.dateFrom, to: filterState.dateTo };
    }
    // fallback: última semana
    const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { from, to: today };
}

/** Retorna os funcionários filtrados pelo turno selecionado */
function getFilteredEmployees() {
    let result = employeesData;

    // Filtro por turno
    if (filterState.shift !== 'all') {
        result = result.filter(emp => (emp.turno || '').toLowerCase() === filterState.shift);
    }

    // Filtro por grupo de risco
    if (filterState.risk !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        result = result.filter(emp => {
            if (filterState.risk === 'hipertensao') {
                // Tem registro de pressão com classificação hipertensão
                const pressures = Object.values(emp.bloodPressure || {});
                return pressures.some(p => p && p.systolic >= 140 || (p && p.diastolic >= 90));
            }
            if (filterState.risk === 'sobrepeso') {
                // IMC > 25 (precisa de peso e altura no perfil)
                const peso = parseFloat(emp.peso || emp.weight || 0);
                const altura = parseFloat(emp.altura || emp.height || 0) / 100;
                if (peso > 0 && altura > 0) {
                    const imc = peso / (altura * altura);
                    return imc >= 25;
                }
                return false;
            }
            if (filterState.risk === 'queixas') {
                // Tem queixas registradas
                const symptoms = Object.values(emp.symptoms || {});
                return symptoms.length > 0;
            }
            if (filterState.risk === 'sem-checkin') {
                // Não fez check-in hoje
                const todayCheckin = emp.checkins && emp.checkins[today];
                return !todayCheckin;
            }
            return true;
        });
    }

    return result;
}

/** Atualiza o texto de resumo do filtro */
function updateFilterSummary() {
    const { from, to } = getDateRange();
    const shiftLabel = filterState.shift === 'all' ? 'todos os turnos' : filterState.shift;
    const riskLabels = { all: '', hipertensao: ' · 🟥 Hipertensão', sobrepeso: ' · 🟡 Sobrepeso', queixas: ' · ⚠️ Queixas', 'sem-checkin': ' · 🔴 Sem Check-in' };
    const riskLabel = riskLabels[filterState.risk] || '';
    const filtered = getFilteredEmployees();
    document.getElementById('filter-summary').textContent =
        `Mostrando: ${filtered.length} funcionário(s) · ${shiftLabel}${riskLabel} · ${formatDate(from)} a ${formatDate(to)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// ========== AUTENTICAÇÃO ==========
// Renomear a função Firebase para não conflitar
function loadEmployeesDataFirebase() {
    showLoading(true);
    const employeesRef = database.ref('canteiro-saudavel/employees');
    unsubscribe = employeesRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            employeesData = Object.keys(data).map(matricula => {
                const emp = data[matricula];
                return {
                    matricula,
                    name: emp.profile?.name || emp.name || 'Sem nome',
                    cargo: emp.profile?.cargo || emp.cargo || '-',
                    turno: emp.profile?.turno || emp.turno || '-',
                    email: emp.profile?.email || emp.email || '',
                    hydration: emp.hydration || emp.water || {},
                    pressure: emp.pressure || emp.bloodPressure || {},
                    symptoms: emp.symptoms || {},
                    checkins: emp.checkins || {},
                    challenges: emp.challenges || {},
                    points: emp.points || 0,
                };
            });
            console.log(`[Firebase] Carregados ${employeesData.length} funcionários`);
            updateDashboard();
        } else {
            employeesData = [];
            updateDashboard();
        }
        showLoading(false);
    }, (error) => {
        console.error('[Firebase] Erro ao carregar dados:', error);
        showLoading(false);
    });
}

// Indicador de fonte de dados no cabeçalho
function updateDataSourceBadge() {
    const badge = document.getElementById('data-source-badge');
    if (!badge) return;
    if (useApiMode) {
        badge.textContent = '✅ PostgreSQL';
        badge.style.background = '#22C55E';
        badge.style.color = '#fff';
    } else {
        badge.textContent = '⚡ Firebase';
        badge.style.background = '#F59E0B';
        badge.style.color = '#fff';
    }
    badge.style.display = 'inline-block';
}

// ========== AUTENTICAÇÃO ORIGINAL ==========
function login(email, password) {
    const validCredentials = [
        { email: 'admin@canteiro.com', password: 'admin123', role: 'admin', name: 'Administrador' },
        { email: 'sesmt@empresa.com', password: 'sesmt2024', role: 'sesmt', name: 'SESMT' },
        { email: 'denise.silva@mip.com.br', password: 'Canteiro@2024', role: 'sesmt', name: 'Denise Silva' },
        { email: 'estefane.mendes@mip.com.br', password: 'Canteiro@2024', role: 'sesmt', name: 'Estefane Mendes' },
    ];
    const user = validCredentials.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { email: user.email, name: user.name, role: user.role, _rawPassword: password };
        localStorage.setItem('admin_user', JSON.stringify(currentUser));
        // Tentar login na API PostgreSQL em paralelo
        tryApiLogin(email, password).then(ok => {
            useApiMode = ok;
            updateDataSourceBadge();
        });
        showDashboard();
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('admin_user');
    if (unsubscribe) unsubscribe();
    showLogin();
}

function checkAuth() {
    const stored = localStorage.getItem('admin_user');
    const savedToken = localStorage.getItem('api_token');
    if (stored) {
        currentUser = JSON.parse(stored);
        if (savedToken) {
            apiToken = savedToken;
            useApiMode = true;
        }
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    document.getElementById('admin-email-display').textContent = currentUser.name || currentUser.email;
    loadEmployeesData();
    loadRewardsData();
}

// ========== CARREGAMENTO DE DADOS (API + Firebase fallback) ==========
function loadEmployeesData() {
    // Verificar se já temos token da API
    const savedToken = localStorage.getItem('api_token');
    if (savedToken) {
        apiToken = savedToken;
        useApiMode = true;
    }

    if (useApiMode && apiToken) {
        loadFromApi().then(() => updateDataSourceBadge());
    } else {
        // Tentar API primeiro, depois Firebase
        tryApiLogin(currentUser.email, currentUser._rawPassword || '')
            .then(ok => {
                if (ok) {
                    loadFromApi().then(() => updateDataSourceBadge());
                } else {
                    useApiMode = false;
                    updateDataSourceBadge();
                    loadEmployeesDataFirebase();
                }
            });
    }
}

function loadRewardsData() {
    const rewardsRef = database.ref('canteiro-saudavel/rewards');
    rewardsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            rewardsData = Object.keys(data).map(id => ({ id, ...data[id] }));
        } else {
            rewardsData = getDefaultRewards();
        }
        renderRewards();
        renderRanking();
    });
}

function getDefaultRewards() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return [
        { id: 'default-1', position: 1, prize: 'Vale-presente R$ 100', description: 'Para o funcionário mais engajado do mês', month, icon: '🥇' },
        { id: 'default-2', position: 2, prize: 'Vale-presente R$ 60', description: 'Para o segundo colocado no ranking', month, icon: '🥈' },
        { id: 'default-3', position: 3, prize: 'Vale-presente R$ 40', description: 'Para o terceiro colocado no ranking', month, icon: '🥉' },
    ];
}

// ========== DASHBOARD ==========
function updateDashboard() {
    updateFilterSummary();
    updateCollectiveAlerts();
    updateStats();
    updateEmployeesList();
    updateRecentActivity();
    updateCharts();
}

// ========== ALERTAS COLETIVOS DE QUEIXAS ==========
/**
 * Detecta quando 3+ funcionários reportaram o mesmo sintoma nos últimos 7 dias
 * e exibe banners de alerta vermelho no topo do painel.
 */
function updateCollectiveAlerts() {
    const container = document.getElementById('collective-alerts-container');
    if (!container) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Agrupa todos os sintomas dos últimos 7 dias por tipo
    const symptomMap = {}; // { 'dor nas costas': [{ name, matricula, date, details }] }
    employeesData.forEach(emp => {
        Object.values(emp.symptoms).forEach(s => {
            if (!s || !s.date || s.date < sevenDaysAgo || s.date > today) return;
            const list = Array.isArray(s.symptoms) ? s.symptoms : (s.symptoms ? [s.symptoms] : []);
            list.forEach(sym => {
                const key = sym.toLowerCase().trim();
                if (!symptomMap[key]) symptomMap[key] = [];
                symptomMap[key].push({ name: emp.name, matricula: emp.matricula, turno: emp.turno, date: s.date, details: s.details || '' });
            });
        });
    });

    // Filtra apenas os que têm 3 ou mais ocorrências
    const alerts = Object.entries(symptomMap)
        .filter(([, cases]) => cases.length >= 3)
        .sort((a, b) => b[1].length - a[1].length);

    if (alerts.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = alerts.map(([symptom, cases]) => {
        const names = cases.map(c => `${c.name} (${c.turno === 'diurno' ? '☀️' : c.turno === 'noturno' ? '🌙' : ''}${c.matricula})`).join(', ');
        const urgency = cases.length >= 5 ? 'alert-critical' : 'alert-warning';
        const icon = cases.length >= 5 ? '🚨' : '⚠️';
        return `
            <div class="collective-alert ${urgency}">
                <div class="alert-icon">${icon}</div>
                <div class="alert-body">
                    <div class="alert-title">${icon} Alerta Coletivo: <strong>${cases.length} funcionários</strong> reportaram <strong>“${symptom}”</strong> nos últimos 7 dias</div>
                    <div class="alert-names">${names}</div>
                </div>
                <button class="alert-dismiss" onclick="this.closest('.collective-alert').style.display='none'" title="Dispensar">×</button>
            </div>
        `;
    }).join('');
}

// ========== ESTATÍSTICAS ==========
function updateStats() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();

    // Funcionários ativos (check-in no período)
    const activeEmployees = filtered.filter(emp => {
        const lastCheckin = getLastCheckin(emp);
        return lastCheckin && lastCheckin >= from && lastCheckin <= to;
    }).length;

    // Hidratação média no período (média dos dias com dados)
    const hydrationValues = filtered.map(emp => {
        const daysWithData = Object.entries(emp.hydration)
            .filter(([date]) => date >= from && date <= to)
            .map(([, h]) => h ? ((h.waterIntake || 0) / (h.goal || 2000)) * 100 : null)
            .filter(v => v !== null);
        return daysWithData.length > 0
            ? daysWithData.reduce((a, b) => a + b, 0) / daysWithData.length
            : null;
    }).filter(v => v !== null);
    const avgHydration = hydrationValues.length > 0
        ? Math.round(hydrationValues.reduce((a, b) => a + b, 0) / hydrationValues.length)
        : 0;

    // Pressão monitorada no período
    const pressureMonitored = filtered.filter(emp => {
        const readings = Object.values(emp.pressure);
        return readings.some(r => r && r.date && r.date >= from && r.date <= to);
    }).length;

    // Queixas no período
    const complaintsCount = filtered.reduce((total, emp) => {
        const symptoms = Object.values(emp.symptoms);
        const recent = symptoms.filter(s => s && s.date && s.date >= from && s.date <= to);
        return total + recent.length;
    }, 0);

    // Check-ins hoje (independente do filtro de período)
    const today = new Date().toISOString().split('T')[0];
    const checkinsToday = filtered.filter(emp => getLastCheckin(emp) === today).length;

    // Desafios ativos
    const activeChallenges = filtered.reduce((total, emp) => {
        const challenges = Object.values(emp.challenges);
        return total + challenges.filter(c => c && c.status === 'active').length;
    }, 0);

    document.getElementById('stat-active').textContent = activeEmployees;
    document.getElementById('stat-hydration').textContent = `${avgHydration}%`;
    document.getElementById('stat-pressure').textContent = pressureMonitored;
    document.getElementById('stat-complaints').textContent = complaintsCount;
    document.getElementById('stat-checkins').textContent = checkinsToday;
    document.getElementById('stat-challenges').textContent = activeChallenges;
}

// ========== LISTA DE FUNCIONÁRIOS ==========
function updateEmployeesList() {
    const container = document.getElementById('employees-list');
    const filtered = getFilteredEmployees();

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👷</div><p class="empty-state-text">Nenhum funcionário encontrado com os filtros selecionados.</p></div>`;
        return;
    }

    const { from, to } = getDateRange();
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = filtered.map(emp => {
        const lastCheckin = getLastCheckin(emp);
        const isActive = lastCheckin && lastCheckin >= from && lastCheckin <= to;
        const todayH = emp.hydration[today];
        const hydrationText = todayH ? `${todayH.waterIntake || 0}ml / ${todayH.goal || 2000}ml` : 'Sem dados hoje';
        const lastPressure = getLastPressure(emp);
        const pressureText = lastPressure ? `${lastPressure.systolic}/${lastPressure.diastolic} mmHg` : 'Sem dados';
        const complaintsCount = Object.values(emp.symptoms).filter(s => s && s.date && s.date >= from && s.date <= to).length;
        const turnoLabel = emp.turno === 'diurno' ? '☀️ Diurno' : emp.turno === 'noturno' ? '🌙 Noturno' : emp.turno;

        return `
            <div class="employee-card clickable" onclick="openEmployeeModal('${emp.matricula}')">
                <div class="employee-header">
                    <div>
                        <div class="employee-name">${emp.name}</div>
                        <div class="employee-matricula">Mat: ${emp.matricula}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                        <span class="employee-status ${isActive ? 'status-active' : 'status-inactive'}">
                            ${isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span style="font-size:11px;color:var(--muted);">${turnoLabel}</span>
                    </div>
                </div>
                <div class="employee-info">
                    <div class="info-row">
                        <span class="info-label">Cargo</span>
                        <span class="info-value">${emp.cargo}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Hidratação Hoje</span>
                        <span class="info-value">${hydrationText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Última Pressão</span>
                        <span class="info-value">${pressureText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Queixas (período)</span>
                        <span class="info-value">${complaintsCount}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Último Check-in</span>
                        <span class="info-value">${lastCheckin || 'Nunca'}</span>
                    </div>
                </div>
                <button class="employee-detail-btn" onclick="event.stopPropagation(); openEmployeeModal('${emp.matricula}')">
                    Ver Detalhes Completos →
                </button>
            </div>
        `;
    }).join('');
}

// ========== ATIVIDADE RECENTE ==========
function updateRecentActivity() {
    const container = document.getElementById('recent-activity');
    const activities = [];
    const { from, to } = getDateRange();
    const today = new Date().toISOString().split('T')[0];
    const filtered = getFilteredEmployees();

    filtered.forEach(emp => {
        const lastCheckin = getLastCheckin(emp);
        if (lastCheckin && lastCheckin >= from && lastCheckin <= to) {
            activities.push({ time: new Date(lastCheckin), title: '✅ Check-in realizado', description: `${emp.name} (${emp.matricula}) fez check-in em ${formatDate(lastCheckin)}` });
        }
        Object.values(emp.symptoms).filter(s => s && s.date && s.date >= from && s.date <= to).forEach(symptom => {
            activities.push({
                time: new Date(symptom.timestamp || symptom.date),
                title: '⚠️ Sintoma reportado',
                description: `${emp.name} reportou: ${Array.isArray(symptom.symptoms) ? symptom.symptoms.join(', ') : (symptom.symptoms || 'sintomas')}`
            });
        });
        const todayH = emp.hydration[today];
        if (todayH && todayH.waterIntake > 0) {
            activities.push({ time: new Date(), title: '💧 Hidratação registrada', description: `${emp.name} bebeu ${todayH.waterIntake}ml hoje` });
        }
    });

    activities.sort((a, b) => b.time - a.time);

    if (activities.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><p class="empty-state-text">Nenhuma atividade no período selecionado.</p></div>`;
        return;
    }

    container.innerHTML = activities.slice(0, 15).map(a => `
        <div class="activity-item">
            <div class="activity-header">
                <span class="activity-title">${a.title}</span>
                <span class="activity-time">${formatTime(a.time)}</span>
            </div>
            <p class="activity-description">${a.description}</p>
        </div>
    `).join('');
}

// ========== GRÁFICOS ==========
function updateCharts() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();

    // Calcular número de dias no período
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.min(30, Math.round((toDate - fromDate) / (24 * 60 * 60 * 1000)) + 1);

    // Hidratação por dia no período (máx 30 dias)
    const hydrationLabels = [];
    const hydrationValues = [];
    for (let i = diffDays - 1; i >= 0; i--) {
        const d = new Date(toDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        hydrationLabels.push(dayLabel);
        const totalMl = filtered.reduce((sum, emp) => {
            const h = emp.hydration[dateStr];
            return sum + (h ? (h.waterIntake || 0) : 0);
        }, 0);
        const count = filtered.filter(emp => emp.hydration[dateStr]).length || 1;
        hydrationValues.push(Math.round(totalMl / count));
    }
    renderChart('hydration-chart', 'line', hydrationLabels, [{ label: 'Hidratação Média (ml)', data: hydrationValues, borderColor: '#0a7ea4', backgroundColor: 'rgba(10,126,164,0.1)', tension: 0.4, fill: true }]);

    // Pressão arterial no período
    const allPressures = [];
    filtered.forEach(emp => {
        Object.values(emp.pressure).forEach(r => {
            if (r && r.systolic && r.diastolic && r.date && r.date >= from && r.date <= to) {
                allPressures.push({ name: emp.name.split(' ')[0], systolic: r.systolic, diastolic: r.diastolic, date: r.date });
            }
        });
    });
    allPressures.sort((a, b) => a.date.localeCompare(b.date));
    const pressureSlice = allPressures.slice(-15);
    renderChart('pressure-chart', 'bar', pressureSlice.map(p => `${p.name} ${formatDate(p.date)}`), [
        { label: 'Sistólica', data: pressureSlice.map(p => p.systolic), backgroundColor: 'rgba(239,68,68,0.7)' },
        { label: 'Diastólica', data: pressureSlice.map(p => p.diastolic), backgroundColor: 'rgba(251,191,36,0.7)' }
    ]);

    // Queixas por tipo no período
    const symptomsCount = {};
    filtered.forEach(emp => {
        Object.values(emp.symptoms).forEach(s => {
            if (s && s.symptoms && s.date && s.date >= from && s.date <= to) {
                const list = Array.isArray(s.symptoms) ? s.symptoms : [s.symptoms];
                list.forEach(sym => { symptomsCount[sym] = (symptomsCount[sym] || 0) + 1; });
            }
        });
    });
    const sympLabels = Object.keys(symptomsCount).slice(0, 8);
    const sympValues = sympLabels.map(k => symptomsCount[k]);
    if (sympLabels.length > 0) {
        renderChart('complaints-chart', 'doughnut', sympLabels, [{ data: sympValues, backgroundColor: ['#0a7ea4','#F59E0B','#EF4444','#22C55E','#8B5CF6','#EC4899','#14B8A6','#F97316'] }]);
    } else {
        renderChart('complaints-chart', 'doughnut', ['Sem queixas'], [{ data: [1], backgroundColor: ['#E5E7EB'] }]);
    }

    // Check-ins por dia no período
    const checkinLabels = [];
    const checkinValues = [];
    for (let i = diffDays - 1; i >= 0; i--) {
        const d = new Date(toDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        checkinLabels.push(dayLabel);
        const count = filtered.filter(emp => {
            return Object.values(emp.checkins).some(c => c && c.date === dateStr);
        }).length;
        checkinValues.push(count);
    }
    renderChart('checkins-chart', 'bar', checkinLabels, [{ label: 'Check-ins', data: checkinValues, backgroundColor: 'rgba(34,197,94,0.7)', borderColor: '#22C55E', borderWidth: 1 }]);
}

function renderChart(canvasId, type, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    if (chartsInstances[canvasId]) {
        chartsInstances[canvasId].destroy();
    }
    chartsInstances[canvasId] = new Chart(ctx, {
        type,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ========== MODAIS DE DRILL-DOWN ==========

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

// --- Modal: Funcionários Ativos ---
function showActiveEmployees() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();
    const active = filtered.filter(emp => {
        const lc = getLastCheckin(emp);
        return lc && lc >= from && lc <= to;
    });
    const content = document.getElementById('modal-active-content');
    if (active.length === 0) {
        content.innerHTML = emptyState('👷', 'Nenhum funcionário ativo no período selecionado.');
    } else {
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Nome</th><th>Matrícula</th><th>Turno</th><th>Último Check-in</th></tr></thead>
                <tbody>
                    ${active.map(emp => `
                        <tr>
                            <td><strong>${emp.name}</strong></td>
                            <td>${emp.matricula}</td>
                            <td>${emp.turno === 'diurno' ? '☀️ Diurno' : emp.turno === 'noturno' ? '🌙 Noturno' : emp.turno}</td>
                            <td>${getLastCheckin(emp) || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    openModal('modal-active');
}

// --- Modal: Hidratação ---
function showHydrationDetails() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();
    const today = new Date().toISOString().split('T')[0];
    const content = document.getElementById('modal-hydration-content');

    // Mostrar dados do dia mais recente no período
    const withData = filtered.filter(emp => {
        return Object.keys(emp.hydration).some(d => d >= from && d <= to);
    });

    if (withData.length === 0) {
        content.innerHTML = emptyState('💧', 'Nenhum registro de hidratação no período selecionado.');
    } else {
        const rows = withData.map(emp => {
            // Pegar o dia mais recente com dados no período
            const daysInPeriod = Object.entries(emp.hydration)
                .filter(([d]) => d >= from && d <= to)
                .sort((a, b) => b[0].localeCompare(a[0]));
            const [latestDate, h] = daysInPeriod[0] || [null, null];
            if (!h) return '';
            const intake = h.waterIntake || 0;
            const goal = h.goal || 2000;
            const pct = Math.min(100, Math.round((intake / goal) * 100));
            const cls = pct < 40 ? 'low' : pct < 75 ? 'mid' : 'high';
            return `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${formatDate(latestDate)}</td>
                    <td>${intake}ml</td>
                    <td>${goal}ml</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="progress-bar-wrap" style="flex:1;">
                                <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
                            </div>
                            <span style="font-size:12px;color:var(--muted);min-width:36px;">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).filter(Boolean).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Data</th><th>Consumido</th><th>Meta</th><th>Progresso</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-hydration');
}

// --- Modal: Pressão ---
function showPressureDetails() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();
    const content = document.getElementById('modal-pressure-content');
    const allReadings = [];
    filtered.forEach(emp => {
        Object.values(emp.pressure).forEach(r => {
            if (r && r.systolic && r.date && r.date >= from && r.date <= to) {
                allReadings.push({ name: emp.name, matricula: emp.matricula, turno: emp.turno, ...r });
            }
        });
    });
    allReadings.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (allReadings.length === 0) {
        content.innerHTML = emptyState('🩺', 'Nenhuma leitura de pressão no período selecionado.');
    } else {
        const rows = allReadings.slice(0, 50).map(r => {
            const classification = classifyPressure(r.systolic, r.diastolic);
            const badgeClass = classification === 'Normal' ? 'badge-normal' : classification === 'Pré-hipertensão' ? 'badge-pre' : 'badge-hyper';
            return `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td>${r.turno === 'diurno' ? '☀️' : r.turno === 'noturno' ? '🌙' : ''} ${r.turno}</td>
                    <td>${r.systolic}/${r.diastolic} mmHg</td>
                    <td><span class="badge ${badgeClass}">${classification}</span></td>
                    <td>${formatDate(r.date)}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Turno</th><th>Pressão</th><th>Classificação</th><th>Data</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-pressure');
}

// --- Modal: Queixas ---
function showComplaintsDetails() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();
    const content = document.getElementById('modal-complaints-content');
    const allComplaints = [];
    filtered.forEach(emp => {
        Object.values(emp.symptoms).forEach(s => {
            if (s && s.date && s.date >= from && s.date <= to) {
                allComplaints.push({ name: emp.name, matricula: emp.matricula, turno: emp.turno, ...s });
            }
        });
    });
    allComplaints.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (allComplaints.length === 0) {
        content.innerHTML = emptyState('⚠️', 'Nenhuma queixa registrada no período selecionado.');
    } else {
        const rows = allComplaints.map(s => {
            const sympList = Array.isArray(s.symptoms) ? s.symptoms.join(', ') : (s.symptoms || '-');
            return `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.turno === 'diurno' ? '☀️' : s.turno === 'noturno' ? '🌙' : ''} ${s.turno}</td>
                    <td>${sympList}</td>
                    <td>${s.details || s.description || '-'}</td>
                    <td>${formatDate(s.date)}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Turno</th><th>Sintomas</th><th>Detalhes</th><th>Data</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-complaints');
}

// --- Modal: Check-ins ---
function showCheckinsDetails() {
    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();
    const content = document.getElementById('modal-checkins-content');
    const allCheckins = [];
    filtered.forEach(emp => {
        Object.values(emp.checkins).forEach(c => {
            if (c && c.date && c.date >= from && c.date <= to) {
                allCheckins.push({ name: emp.name, matricula: emp.matricula, turno: emp.turno, ...c });
            }
        });
    });
    allCheckins.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (allCheckins.length === 0) {
        content.innerHTML = emptyState('✅', 'Nenhum check-in no período selecionado.');
    } else {
        const rows = allCheckins.map(c => {
            const statusLabel = c.status === 'good' ? '😊 Bem' : c.status === 'pain' ? '😣 Com dor' : c.status || '-';
            const statusColor = c.status === 'good' ? '#22C55E' : '#EF4444';
            return `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.matricula}</td>
                    <td>${c.turno === 'diurno' ? '☀️' : c.turno === 'noturno' ? '🌙' : ''} ${c.turno}</td>
                    <td style="color:${statusColor};font-weight:600;">${statusLabel}</td>
                    <td>${formatDate(c.date)}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Matrícula</th><th>Turno</th><th>Status</th><th>Data</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-checkins');
}

// --- Modal: Desafios ---
function showChallengesDetails() {
    const filtered = getFilteredEmployees();
    const content = document.getElementById('modal-challenges-content');
    const allChallenges = [];
    filtered.forEach(emp => {
        Object.values(emp.challenges).forEach(c => {
            if (c && c.status === 'active') {
                allChallenges.push({ name: emp.name, matricula: emp.matricula, turno: emp.turno, ...c });
            }
        });
    });

    if (allChallenges.length === 0) {
        content.innerHTML = emptyState('🎯', 'Nenhum desafio ativo no momento.');
    } else {
        const rows = allChallenges.map(c => {
            const pct = Math.min(100, Math.round(c.progress || 0));
            const cls = pct < 40 ? 'low' : pct < 75 ? 'mid' : 'high';
            return `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.turno === 'diurno' ? '☀️' : c.turno === 'noturno' ? '🌙' : ''} ${c.turno}</td>
                    <td>${c.title || c.challengeId || '-'}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="progress-bar-wrap" style="flex:1;">
                                <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
                            </div>
                            <span style="font-size:12px;color:var(--muted);min-width:36px;">${pct}%</span>
                        </div>
                    </td>
                    <td>${c.endDate ? formatDate(c.endDate) : '-'}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Turno</th><th>Desafio</th><th>Progresso</th><th>Prazo</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-challenges');
}

// --- Modal: Funcionário Individual ---
function openEmployeeModal(matricula) {
    const emp = employeesData.find(e => e.matricula === matricula);
    if (!emp) return;

    document.getElementById('modal-employee-title').textContent = `👷 ${emp.name}`;

    const today = new Date().toISOString().split('T')[0];

    // Hidratação últimos 7 dias
    const hydrationRows = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const h = emp.hydration[ds];
        if (h) {
            const pct = Math.min(100, Math.round(((h.waterIntake || 0) / (h.goal || 2000)) * 100));
            hydrationRows.push(`<tr><td>${formatDate(ds)}</td><td>${h.waterIntake || 0}ml</td><td>${h.goal || 2000}ml</td><td>${pct}%</td></tr>`);
        }
    }

    // Pressão
    const pressureRows = Object.values(emp.pressure).filter(r => r && r.systolic).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(r => {
        const cl = classifyPressure(r.systolic, r.diastolic);
        const bc = cl === 'Normal' ? 'badge-normal' : cl === 'Pré-hipertensão' ? 'badge-pre' : 'badge-hyper';
        return `<tr><td>${formatDate(r.date)}</td><td>${r.systolic}/${r.diastolic} mmHg</td><td><span class="badge ${bc}">${cl}</span></td></tr>`;
    });

    // Sintomas
    const symptomRows = Object.values(emp.symptoms).filter(s => s && s.date).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(s => {
        const sympList = Array.isArray(s.symptoms) ? s.symptoms.join(', ') : (s.symptoms || '-');
        return `<tr><td>${formatDate(s.date)}</td><td>${sympList}</td><td>${s.details || '-'}</td></tr>`;
    });

    // Check-ins
    const checkinRows = Object.values(emp.checkins).filter(c => c && c.date).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(c => {
        const sl = c.status === 'good' ? '😊 Bem' : c.status === 'pain' ? '😣 Com dor' : c.status || '-';
        return `<tr><td>${formatDate(c.date)}</td><td>${sl}</td></tr>`;
    });

    // Desafios
    const challengeRows = Object.values(emp.challenges).filter(c => c).map(c => {
        const pct = Math.min(100, Math.round(c.progress || 0));
        return `<tr><td>${c.title || c.challengeId || '-'}</td><td>${c.status || '-'}</td><td>${pct}%</td></tr>`;
    });

    const todayH = emp.hydration[today];
    const lastP = getLastPressure(emp);
    const turnoLabel = emp.turno === 'diurno' ? '☀️ Diurno (7h30–17h30)' : emp.turno === 'noturno' ? '🌙 Noturno (17h30–3h30)' : emp.turno;

    document.getElementById('modal-employee-content').innerHTML = `
        <div class="employee-detail-section">
            <h3>📋 Informações Pessoais</h3>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-item-label">Nome</div><div class="detail-item-value">${emp.name}</div></div>
                <div class="detail-item"><div class="detail-item-label">Matrícula</div><div class="detail-item-value">${emp.matricula}</div></div>
                <div class="detail-item"><div class="detail-item-label">Cargo</div><div class="detail-item-value">${emp.cargo}</div></div>
                <div class="detail-item"><div class="detail-item-label">Turno</div><div class="detail-item-value">${turnoLabel}</div></div>
                <div class="detail-item"><div class="detail-item-label">Hidratação Hoje</div><div class="detail-item-value">${todayH ? `${todayH.waterIntake || 0}ml` : 'Sem dados'}</div></div>
                <div class="detail-item"><div class="detail-item-label">Última Pressão</div><div class="detail-item-value">${lastP ? `${lastP.systolic}/${lastP.diastolic}` : 'Sem dados'}</div></div>
            </div>
        </div>

        ${hydrationRows.length > 0 ? `
        <div class="employee-detail-section">
            <h3>💧 Hidratação (últimos 7 dias)</h3>
            <table class="modal-table">
                <thead><tr><th>Data</th><th>Consumido</th><th>Meta</th><th>%</th></tr></thead>
                <tbody>${hydrationRows.join('')}</tbody>
            </table>
        </div>` : ''}

        ${pressureRows.length > 0 ? `
        <div class="employee-detail-section">
            <h3>🩺 Histórico de Pressão Arterial</h3>
            <table class="modal-table">
                <thead><tr><th>Data</th><th>Pressão</th><th>Classificação</th></tr></thead>
                <tbody>${pressureRows.join('')}</tbody>
            </table>
        </div>` : ''}

        ${symptomRows.length > 0 ? `
        <div class="employee-detail-section">
            <h3>⚠️ Queixas e Sintomas</h3>
            <table class="modal-table">
                <thead><tr><th>Data</th><th>Sintomas</th><th>Detalhes</th></tr></thead>
                <tbody>${symptomRows.join('')}</tbody>
            </table>
        </div>` : ''}

        ${checkinRows.length > 0 ? `
        <div class="employee-detail-section">
            <h3>✅ Histórico de Check-ins</h3>
            <table class="modal-table">
                <thead><tr><th>Data</th><th>Status</th></tr></thead>
                <tbody>${checkinRows.join('')}</tbody>
            </table>
        </div>` : ''}

        ${challengeRows.length > 0 ? `
        <div class="employee-detail-section">
            <h3>🎯 Desafios</h3>
            <table class="modal-table">
                <thead><tr><th>Desafio</th><th>Status</th><th>Progresso</th></tr></thead>
                <tbody>${challengeRows.join('')}</tbody>
            </table>
        </div>` : ''}
    `;

    openModal('modal-employee');
}

// ========== RECOMPENSAS ==========
function renderRewards() {
    const container = document.getElementById('rewards-list');
    if (!container) return;

    if (rewardsData.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏆</div><p class="empty-state-text">Nenhuma recompensa configurada.<br>Clique em "Nova Recompensa" para adicionar.</p></div>`;
        return;
    }

    const sorted = [...rewardsData].sort((a, b) => (a.position || 99) - (b.position || 99));
    const colorClass = (pos) => pos == 1 ? 'gold' : pos == 2 ? 'silver' : pos == 3 ? 'bronze' : '';
    const posLabel = (pos) => pos == 1 ? '🥇 1º Lugar' : pos == 2 ? '🥈 2º Lugar' : pos == 3 ? '🥉 3º Lugar' : `${pos}º Lugar`;

    container.innerHTML = sorted.map(r => `
        <div class="reward-card ${colorClass(r.position)}">
            <div class="reward-position">${r.icon || '🎁'}</div>
            <div class="reward-prize">${r.prize}</div>
            <div class="reward-description">${r.description || ''}</div>
            <div class="reward-month">📅 ${r.month || '-'} · ${posLabel(r.position)}</div>
            <div class="reward-actions">
                <button class="btn-edit" onclick="editReward('${r.id}')">✏️ Editar</button>
                <button class="btn-delete" onclick="deleteReward('${r.id}')">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

function renderRanking() {
    const container = document.getElementById('ranking-list');
    if (!container) return;

    const { from, to } = getDateRange();
    const filtered = getFilteredEmployees();

    const ranked = filtered.map(emp => {
        let score = 0;
        const checkinCount = Object.values(emp.checkins).filter(c => c && c.date && c.date >= from && c.date <= to).length;
        score += checkinCount * 10;

        // Hidratação (atingiu meta no período)
        const fromDate = new Date(from);
        const toDate = new Date(to);
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const ds = d.toISOString().split('T')[0];
            const h = emp.hydration[ds];
            if (h && h.waterIntake >= (h.goal || 2000)) score += 5;
        }

        const completedChallenges = Object.values(emp.challenges).filter(c => c && c.completed).length;
        score += completedChallenges * 20;

        const hasComplaints = Object.values(emp.symptoms).some(s => s && s.date && s.date >= from && s.date <= to);
        if (!hasComplaints && checkinCount > 0) score += 5;

        return { ...emp, score, checkinCount };
    }).sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🥇</div><p class="empty-state-text">Nenhum dado disponível para o ranking.</p></div>`;
        return;
    }

    const posEmoji = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;

    container.innerHTML = ranked.slice(0, 10).map((emp, i) => `
        <div class="ranking-item">
            <div class="ranking-position">${posEmoji(i)}</div>
            <div class="ranking-info">
                <div class="ranking-name">${emp.name}</div>
                <div class="ranking-details">${emp.cargo} · ${emp.turno === 'diurno' ? '☀️' : emp.turno === 'noturno' ? '🌙' : ''} ${emp.turno} · ${emp.checkinCount} check-ins no período</div>
            </div>
            <div>
                <div class="ranking-score">${emp.score}</div>
                <div class="ranking-score-label">pontos</div>
            </div>
        </div>
    `).join('');
}

function openAddReward() {
    document.getElementById('modal-reward-title').textContent = '🏆 Nova Recompensa';
    document.getElementById('reward-id').value = '';
    document.getElementById('reward-position').value = '1';
    document.getElementById('reward-prize').value = '';
    document.getElementById('reward-description').value = '';
    document.getElementById('reward-icon').value = '🎁';
    const now = new Date();
    document.getElementById('reward-month').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    openModal('modal-reward');
}

function editReward(id) {
    const reward = rewardsData.find(r => r.id === id);
    if (!reward) return;
    document.getElementById('modal-reward-title').textContent = '✏️ Editar Recompensa';
    document.getElementById('reward-id').value = id;
    document.getElementById('reward-position').value = reward.position || '1';
    document.getElementById('reward-prize').value = reward.prize || '';
    document.getElementById('reward-description').value = reward.description || '';
    document.getElementById('reward-icon').value = reward.icon || '🎁';
    document.getElementById('reward-month').value = reward.month || '';
    openModal('modal-reward');
}

function deleteReward(id) {
    if (!confirm('Deseja excluir esta recompensa?')) return;
    database.ref(`canteiro-saudavel/rewards/${id}`).remove()
        .then(() => console.log('[Rewards] Recompensa excluída'))
        .catch(err => alert('Erro ao excluir: ' + err.message));
}

document.getElementById('reward-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('reward-id').value;
    const data = {
        position: parseInt(document.getElementById('reward-position').value),
        prize: document.getElementById('reward-prize').value,
        description: document.getElementById('reward-description').value,
        month: document.getElementById('reward-month').value,
        icon: document.getElementById('reward-icon').value || '🎁',
        updatedAt: Date.now(),
    };

    const ref = id
        ? database.ref(`canteiro-saudavel/rewards/${id}`)
        : database.ref('canteiro-saudavel/rewards').push();

    ref.set(data)
        .then(() => {
            closeModal('modal-reward');
            console.log('[Rewards] Recompensa salva');
        })
        .catch(err => alert('Erro ao salvar: ' + err.message));
});

document.getElementById('cancel-reward-btn').addEventListener('click', () => closeModal('modal-reward'));

// ========== HELPERS ==========
function getLastCheckin(employee) {
    const checkins = Object.values(employee.checkins).filter(c => c && c.date);
    if (checkins.length === 0) return null;
    return checkins.sort((a, b) => b.date.localeCompare(a.date))[0].date;
}

function getLastPressure(employee) {
    const readings = Object.values(employee.pressure).filter(r => r && r.systolic);
    if (readings.length === 0) return null;
    return readings.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
}

function classifyPressure(systolic, diastolic) {
    if (systolic <= 120 && diastolic <= 80) return 'Normal';
    if (systolic < 140 && diastolic < 90) return 'Pré-hipertensão';
    return 'Hipertensão';
}

function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function emptyState(icon, text) {
    return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><p class="empty-state-text">${text}</p></div>`;
}

// ========== EVENT LISTENERS ==========
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    if (login(email, password)) {
        errorEl.style.display = 'none';
    } else {
        errorEl.textContent = 'Email ou senha inválidos';
        errorEl.style.display = 'block';
    }
});

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('refresh-btn').addEventListener('click', () => {
    // Recarregar dados respeitando o modo atual
    if (useApiMode && apiToken) {
        loadFromApi().then(() => updateDataSourceBadge());
    } else {
        showLoading(true);
        loadEmployeesDataFirebase();
    }
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        if (tabName === 'rewards') {
            renderRewards();
            renderRanking();
        }
        if (tabName === 'reports') {
            loadMonthlyEvolution(6);
        }
        if (tabName === 'comunicados') {
            loadAnnouncements();
        }
    });
});

// Busca de funcionários
const searchInput = document.getElementById('search-employee');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.employee-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
        });
    });
}

// Cards clicáveis
document.getElementById('card-active').addEventListener('click', showActiveEmployees);
document.getElementById('card-hydration').addEventListener('click', showHydrationDetails);
document.getElementById('card-pressure').addEventListener('click', showPressureDetails);
document.getElementById('card-complaints').addEventListener('click', showComplaintsDetails);
document.getElementById('card-checkins').addEventListener('click', showCheckinsDetails);
document.getElementById('card-challenges').addEventListener('click', showChallengesDetails);

// Botão adicionar recompensa
document.getElementById('add-reward-btn').addEventListener('click', openAddReward);

// ========== FILTROS DE PERÍODO E TURNO ==========
document.querySelectorAll('#period-pills .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#period-pills .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.period = btn.dataset.period;

        const customRange = document.getElementById('custom-date-range');
        if (filterState.period === 'custom') {
            customRange.style.display = 'flex';
            // Pré-preencher com últimos 30 dias
            const today = new Date().toISOString().split('T')[0];
            const monthAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            document.getElementById('filter-date-from').value = monthAgo;
            document.getElementById('filter-date-to').value = today;
            filterState.dateFrom = monthAgo;
            filterState.dateTo = today;
        } else {
            customRange.style.display = 'none';
        }

        updateDashboard();
    });
});

document.querySelectorAll('#shift-pills .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#shift-pills .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.shift = btn.dataset.shift;
        updateDashboard();
    });
});

document.querySelectorAll('#risk-pills .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#risk-pills .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.risk = btn.dataset.risk;
        updateDashboard();
    });
});

document.getElementById('apply-date-filter').addEventListener('click', () => {
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    if (!from || !to) {
        alert('Selecione as datas de início e fim.');
        return;
    }
    if (from > to) {
        alert('A data de início deve ser anterior à data de fim.');
        return;
    }
    filterState.dateFrom = from;
    filterState.dateTo = to;
    updateDashboard();
});

// ========== EXPORTAÇÃO DE PDF ==========

/** Helper: calcula métrica por turno para o PDF comparativo */
function calcShiftMetrics(shift, from, to) {
    const emps = employeesData.filter(e => shift === 'all' || (e.turno || '').toLowerCase() === shift);
    const today = new Date().toISOString().split('T')[0];
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Check-ins no período
    const checkinCount = emps.reduce((sum, emp) => {
        return sum + Object.values(emp.checkins).filter(c => c && c.date && c.date >= from && c.date <= to).length;
    }, 0);

    // Hidratação média
    let hydTotal = 0, hydCount = 0;
    emps.forEach(emp => {
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const ds = d.toISOString().split('T')[0];
            const h = emp.hydration[ds];
            if (h && h.waterIntake) { hydTotal += (h.waterIntake / (h.goal || 2000)) * 100; hydCount++; }
        }
    });
    const hydAvg = hydCount > 0 ? Math.round(hydTotal / hydCount) : 0;

    // Queixas no período
    const complaintsCount = emps.reduce((sum, emp) => {
        return sum + Object.values(emp.symptoms).filter(s => s && s.date && s.date >= from && s.date <= to).length;
    }, 0);

    // Pressão: distribuição
    let normal = 0, pre = 0, hyper = 0;
    emps.forEach(emp => {
        Object.values(emp.pressure).forEach(r => {
            if (r && r.systolic && r.date && r.date >= from && r.date <= to) {
                const cl = classifyPressure(r.systolic, r.diastolic);
                if (cl === 'Normal') normal++;
                else if (cl === 'Pré-hipertensão') pre++;
                else hyper++;
            }
        });
    });

    return { total: emps.length, checkinCount, hydAvg, complaintsCount, normal, pre, hyper };
}

async function exportToPDF() {
    try {
        showLoading(true);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        const { from, to } = getDateRange();
        const filtered = getFilteredEmployees();
        const shiftLabel = filterState.shift === 'all' ? 'Todos os turnos' : filterState.shift;
        const now = new Date();
        const today = new Date().toISOString().split('T')[0];

        // ---- CABEÇALHO ----
        pdf.setFillColor(10, 126, 164);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Canteiro Saudavel', margin, 18);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Relatorio de Saude e Bem-Estar - SESMT', margin, 30);
        y = 50;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text(`Periodo: ${formatDate(from)} a ${formatDate(to)}`, margin, y); y += 6;
        pdf.text(`Filtro de turno: ${shiftLabel}`, margin, y); y += 6;
        pdf.text(`Funcionarios no filtro: ${filtered.length} de ${employeesData.length} total`, margin, y); y += 6;
        pdf.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, margin, y); y += 6;
        pdf.text(`Administrador: ${currentUser.email}`, margin, y); y += 15;

        // ---- ESTATÍSTICAS GERAIS ----
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Estatisticas Gerais', margin, y); y += 8;

        const stats = [
            { label: 'Funcionarios Ativos', value: document.getElementById('stat-active').textContent },
            { label: 'Hidratacao Media', value: document.getElementById('stat-hydration').textContent },
            { label: 'Pressao Monitorada', value: document.getElementById('stat-pressure').textContent },
            { label: 'Queixas no Periodo', value: document.getElementById('stat-complaints').textContent },
            { label: 'Check-ins Hoje', value: document.getElementById('stat-checkins').textContent },
            { label: 'Desafios Ativos', value: document.getElementById('stat-challenges').textContent },
        ];

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const statW = (pageWidth - 2 * margin - 10) / 2;
        stats.forEach((s, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = margin + col * (statW + 10);
            const sy = y + row * 22;
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(x, sy, statW, 18, 3, 3, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(104, 112, 118);
            pdf.text(s.label, x + 4, sy + 7);
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(s.value, x + 4, sy + 14);
            pdf.setFont('helvetica', 'normal');
        });
        y += Math.ceil(stats.length / 2) * 22 + 15;

        // ---- COMPARATIVO POR TURNO ----
        if (y > pageHeight - 80) { pdf.addPage(); y = margin; }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Comparativo por Turno', margin, y); y += 8;

        const diurno = calcShiftMetrics('diurno', from, to);
        const noturno = calcShiftMetrics('noturno', from, to);

        // Cabeçalho da tabela comparativa
        const colW = (pageWidth - 2 * margin) / 3;
        pdf.setFillColor(10, 126, 164);
        pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Indicador', margin + 4, y + 5.5);
        pdf.text('Diurno (7:30-17:30)', margin + colW + 4, y + 5.5);
        pdf.text('Noturno (17:30-3:30)', margin + colW * 2 + 4, y + 5.5);
        y += 8;

        const compareRows = [
            ['Funcionarios', String(diurno.total), String(noturno.total)],
            ['Check-ins no periodo', String(diurno.checkinCount), String(noturno.checkinCount)],
            ['Hidratacao media', `${diurno.hydAvg}%`, `${noturno.hydAvg}%`],
            ['Queixas no periodo', String(diurno.complaintsCount), String(noturno.complaintsCount)],
            ['Pressao Normal', String(diurno.normal), String(noturno.normal)],
            ['Pre-hipertensao', String(diurno.pre), String(noturno.pre)],
            ['Hipertensao', String(diurno.hyper), String(noturno.hyper)],
        ];

        compareRows.forEach((row, i) => {
            if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
            pdf.setFillColor(i % 2 === 0 ? 255 : 248);
            pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', i === 0 ? 'bold' : 'normal');
            pdf.text(row[0], margin + 4, y);
            // Destaque para valor maior
            const v1 = parseFloat(row[1]) || 0;
            const v2 = parseFloat(row[2]) || 0;
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(v1 >= v2 ? 10 : 0, v1 >= v2 ? 126 : 0, v1 >= v2 ? 164 : 0);
            pdf.text(row[1], margin + colW + 4, y);
            pdf.setTextColor(v2 > v1 ? 10 : 0, v2 > v1 ? 126 : 0, v2 > v1 ? 164 : 0);
            pdf.text(row[2], margin + colW * 2 + 4, y);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            y += 8;
        });
        y += 10;

        // ---- ALERTAS COLETIVOS ----
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const symptomMap = {};
        employeesData.forEach(emp => {
            Object.values(emp.symptoms).forEach(s => {
                if (!s || !s.date || s.date < sevenDaysAgo || s.date > today) return;
                const list = Array.isArray(s.symptoms) ? s.symptoms : (s.symptoms ? [s.symptoms] : []);
                list.forEach(sym => {
                    const key = sym.toLowerCase().trim();
                    if (!symptomMap[key]) symptomMap[key] = [];
                    symptomMap[key].push(emp.name);
                });
            });
        });
        const collectiveAlerts = Object.entries(symptomMap).filter(([, cases]) => cases.length >= 3);

        if (collectiveAlerts.length > 0) {
            if (y > pageHeight - 60) { pdf.addPage(); y = margin; }
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(239, 68, 68);
            pdf.text('Alertas Coletivos de Queixas (ultimos 7 dias)', margin, y); y += 8;

            collectiveAlerts.forEach(([symptom, cases]) => {
                if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                pdf.setFillColor(254, 226, 226);
                pdf.roundedRect(margin, y - 4, pageWidth - 2 * margin, 14, 3, 3, 'F');
                pdf.setTextColor(153, 27, 27);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`ALERTA: ${cases.length} funcionarios com "${symptom}"`, margin + 4, y + 2);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                const nameList = cases.slice(0, 8).join(', ') + (cases.length > 8 ? ` e mais ${cases.length - 8}...` : '');
                pdf.text(`Funcionarios: ${nameList}`, margin + 4, y + 8);
                pdf.setTextColor(0, 0, 0);
                y += 18;
            });
            y += 5;
        }

        // ---- LISTA DE FUNCIONÁRIOS ----
        if (y > pageHeight - 60) { pdf.addPage(); y = margin; }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Lista de Funcionarios', margin, y); y += 8;

        // Cabeçalho tabela
        pdf.setFillColor(10, 126, 164);
        pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nome', margin + 2, y + 5.5);
        pdf.text('Matricula', margin + 60, y + 5.5);
        pdf.text('Turno', margin + 90, y + 5.5);
        pdf.text('Hidrat. Hoje', margin + 115, y + 5.5);
        pdf.text('Pressao', margin + 148, y + 5.5);
        pdf.text('Queixas', margin + 170, y + 5.5);
        y += 8;

        filtered.slice(0, 30).forEach((emp, idx) => {
            if (y > pageHeight - 15) { pdf.addPage(); y = margin; }
            const h = emp.hydration[today];
            const hText = h ? `${h.waterIntake || 0}ml` : 'N/A';
            const lp = getLastPressure(emp);
            const pText = lp ? `${lp.systolic}/${lp.diastolic}` : 'N/A';
            const qCount = Object.values(emp.symptoms).filter(s => s && s.date && s.date >= from && s.date <= to).length;
            pdf.setFillColor(idx % 2 === 0 ? 255 : 248);
            pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            pdf.text(emp.name.substring(0, 22), margin + 2, y);
            pdf.text(emp.matricula, margin + 60, y);
            pdf.text(emp.turno || '-', margin + 90, y);
            pdf.text(hText, margin + 115, y);
            pdf.text(pText, margin + 148, y);
            pdf.text(String(qCount), margin + 170, y);
            y += 8;
        });

        // ---- RANKING ----
        if (y > pageHeight - 80) { pdf.addPage(); y = margin; }
        else y += 10;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Ranking de Engajamento (Top 10)', margin, y); y += 8;

        const ranked = employeesData.map(emp => {
            let score = 0;
            const cc = Object.values(emp.checkins).filter(c => c && c.date && c.date >= from && c.date <= to).length;
            score += cc * 10;
            const fromDate2 = new Date(from);
            const toDate2 = new Date(to);
            for (let d = new Date(fromDate2); d <= toDate2; d.setDate(d.getDate() + 1)) {
                const ds = d.toISOString().split('T')[0];
                const h = emp.hydration[ds];
                if (h && h.waterIntake >= (h.goal || 2000)) score += 5;
            }
            score += Object.values(emp.challenges).filter(c => c && c.completed).length * 20;
            const hasComplaints = Object.values(emp.symptoms).some(s => s && s.date && s.date >= from && s.date <= to);
            if (!hasComplaints && cc > 0) score += 5;
            return { ...emp, score, checkinCount: cc };
        }).sort((a, b) => b.score - a.score).slice(0, 10);

        const posLabel = (i) => i === 0 ? '1o' : i === 1 ? '2o' : i === 2 ? '3o' : `${i+1}o`;
        ranked.forEach((emp, i) => {
            if (y > pageHeight - 15) { pdf.addPage(); y = margin; }
            pdf.setFillColor(i === 0 ? 255 : i === 1 ? 240 : i === 2 ? 235 : 248, i === 0 ? 215 : i === 1 ? 240 : i === 2 ? 235 : 248, i === 0 ? 0 : i === 1 ? 240 : i === 2 ? 235 : 248);
            pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', i < 3 ? 'bold' : 'normal');
            pdf.text(`${posLabel(i)} ${emp.name}`, margin + 2, y);
            pdf.text(`${emp.turno || '-'}`, margin + 90, y);
            pdf.text(`${emp.checkinCount} check-ins`, margin + 120, y);
            pdf.text(`${emp.score} pts`, margin + 165, y);
            y += 8;
        });

        // ---- RODAPÉ ----
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Canteiro Saudavel - Relatorio Confidencial SESMT | Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        const fileName = `Canteiro_Saudavel_SESMT_${from}_a_${to}.pdf`;
        pdf.save(fileName);
        showLoading(false);
        alert(`✅ PDF gerado: ${fileName}`);
    } catch (error) {
        console.error('[PDF] Erro:', error);
        showLoading(false);
        alert('Erro ao gerar PDF. Verifique o console.');
    }
}

const exportPdfBtn = document.getElementById('export-pdf-btn');
if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);

// ========== GRÁFICO DE EVOLUÇÃO MENSAL ==========
let monthlyChartInstance = null;

async function loadMonthlyEvolution(months = 6) {
    const loadingEl = document.getElementById('monthly-evolution-loading');
    const tableEl = document.getElementById('monthly-evolution-table');
    if (loadingEl) loadingEl.style.display = 'block';

    // Atualizar visual dos botões
    const btn6 = document.getElementById('monthly-6m-btn');
    const btn12 = document.getElementById('monthly-12m-btn');
    if (btn6 && btn12) {
        btn6.style.background = months === 6 ? '#0a7ea4' : '#687076';
        btn12.style.background = months === 12 ? '#0a7ea4' : '#687076';
    }

    const turno = filterState.shift === 'all' ? 'todos' : filterState.shift;
    let monthsData = [];

    // Tentar API PostgreSQL primeiro
    if (useApiMode && apiToken) {
        try {
            const res = await apiRequest(`/monthly-evolution?months=${months}&turno=${turno}`);
            if (res.success && res.data) {
                monthsData = res.data;
            }
        } catch (e) {
            console.warn('[Monthly] API falhou, usando dados locais Firebase:', e.message);
        }
    }

    // Fallback: calcular a partir dos dados Firebase em memória
    if (monthsData.length === 0 && employeesData.length > 0) {
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = d.toISOString().split('T')[0];
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            const filtered = getFilteredEmployees();
            let ciCount = 0;
            let hydTotal = 0;
            let hydCount = 0;
            let compCount = 0;

            filtered.forEach(emp => {
                Object.values(emp.checkins).forEach(c => {
                    if (c && c.date && c.date >= monthStart && c.date <= monthEnd) ciCount++;
                });
                for (let dd = new Date(d); dd <= new Date(d.getFullYear(), d.getMonth() + 1, 0); dd.setDate(dd.getDate() + 1)) {
                    const ds = dd.toISOString().split('T')[0];
                    const h = emp.hydration[ds];
                    if (h && h.waterIntake) { hydTotal += h.waterIntake / (h.goal || 2000) * 100; hydCount++; }
                }
                Object.values(emp.symptoms).forEach(s => {
                    if (s && s.date && s.date >= monthStart && s.date <= monthEnd) compCount++;
                });
            });

            monthsData.push({
                month: monthLabel,
                checkIns: ciCount,
                hydrationAvg: hydCount > 0 ? Math.round(hydTotal / hydCount) : 0,
                complaints: compCount,
                employees: filtered.length,
            });
        }
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (monthsData.length === 0) {
        if (tableEl) tableEl.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Nenhum dado disponível para o período selecionado.</p>';
        return;
    }

    // Renderizar gráfico de linha
    const ctx = document.getElementById('monthly-evolution-chart');
    if (ctx && typeof Chart !== 'undefined') {
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthsData.map(m => m.month),
                datasets: [
                    {
                        label: 'Check-ins',
                        data: monthsData.map(m => m.checkIns),
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Hidratação Média (%)',
                        data: monthsData.map(m => m.hydrationAvg),
                        borderColor: '#0a7ea4',
                        backgroundColor: 'rgba(10,126,164,0.1)',
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'Queixas',
                        data: monthsData.map(m => m.complaints),
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const label = ctx.dataset.label;
                                const val = ctx.parsed.y;
                                return label.includes('%') ? `${label}: ${val}%` : `${label}: ${val}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Quantidade' },
                        beginAtZero: true,
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Hidratação (%)' },
                        beginAtZero: true,
                        max: 100,
                        grid: { drawOnChartArea: false },
                    },
                },
            },
        });
    }

    // Tabela resumo abaixo do gráfico
    if (tableEl) {
        const rows = monthsData.map((m, i) => {
            const prev = monthsData[i - 1];
            const ciTrend = prev ? (m.checkIns > prev.checkIns ? '↗️' : m.checkIns < prev.checkIns ? '↘️' : '➡️') : '';
            const hydTrend = prev ? (m.hydrationAvg > prev.hydrationAvg ? '↗️' : m.hydrationAvg < prev.hydrationAvg ? '↘️' : '➡️') : '';
            const compTrend = prev ? (m.complaints < prev.complaints ? '↗️' : m.complaints > prev.complaints ? '↘️' : '➡️') : '';
            return `<tr>
                <td style="padding:8px;font-weight:600;">${m.month}</td>
                <td style="padding:8px;text-align:center;">${m.employees || '-'}</td>
                <td style="padding:8px;text-align:center;color:#22C55E;">${m.checkIns} ${ciTrend}</td>
                <td style="padding:8px;text-align:center;color:#0a7ea4;">${m.hydrationAvg}% ${hydTrend}</td>
                <td style="padding:8px;text-align:center;color:#EF4444;">${m.complaints} ${compTrend}</td>
            </tr>`;
        }).join('');
        tableEl.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background:var(--surface);">
                        <th style="padding:8px;text-align:left;">Mês</th>
                        <th style="padding:8px;text-align:center;">Funcionários</th>
                        <th style="padding:8px;text-align:center;">Check-ins</th>
                        <th style="padding:8px;text-align:center;">Hidratação Média</th>
                        <th style="padding:8px;text-align:center;">Queixas</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
}

// ========== COMUNICADOS ==========

/** Carrega comunicados da API e renderiza na lista */
async function loadAnnouncements() {
    const container = document.getElementById('announcements-list');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Carregando comunicados...</p>';
    try {
        const data = await fetch(`${API_BASE}/announcements`).then(r => r.json());
        const list = data.announcements || [];
        if (list.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum comunicado publicado ainda.</p>';
            return;
        }
        const categoryColors = {
            urgente: '#EF4444', informativo: '#3B82F6', saude: '#22C55E',
            desafio: '#F59E0B', geral: '#6B7280'
        };
        const categoryLabels = {
            urgente: '🚨 Urgente', informativo: 'ℹ️ Informativo', saude: '💚 Saúde',
            desafio: '🏆 Desafio', geral: '📢 Geral'
        };
        container.innerHTML = list.map(ann => {
            const color = categoryColors[ann.category] || '#6B7280';
            const label = categoryLabels[ann.category] || ann.category;
            const date = new Date(ann.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
            const expires = ann.expiresAt ? `<span style="color:#F59E0B;font-size:11px;">Expira: ${new Date(ann.expiresAt).toLocaleDateString('pt-BR')}</span>` : '';
            const img = ann.imageUrl ? `<img src="${ann.imageUrl}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin:8px 0;">` : '';
            return `
                <div class="announcement-card" style="border-left:4px solid ${color};">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                <span style="background:${color}20;color:${color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">${label}</span>
                                ${expires}
                            </div>
                            <h3 style="margin:0 0 6px;font-size:15px;">${ann.title}</h3>
                            ${img}
                            <p style="margin:0 0 8px;font-size:13px;color:var(--muted);line-height:1.5;">${ann.body}</p>
                            <div style="font-size:11px;color:var(--muted);">
                                Publicado em ${date} por ${ann.createdBy || 'Admin'}
                            </div>
                        </div>
                        <button onclick="deleteAnnouncement('${ann.id}')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:18px;padding:4px;" title="Remover">🗑️</button>
                    </div>
                </div>`;
        }).join('');
    } catch (e) {
        container.innerHTML = `<p style="color:#EF4444;">Erro ao carregar comunicados: ${e.message}</p>`;
    }
}

/** Publica um novo comunicado */
async function saveAnnouncement() {
    const title = document.getElementById('ann-title').value.trim();
    const body = document.getElementById('ann-body').value.trim();
    const category = document.getElementById('ann-category').value;
    const imageUrl = document.getElementById('ann-image').value.trim();
    const expiresAt = document.getElementById('ann-expires').value;
    const feedback = document.getElementById('ann-feedback');

    if (!title || !body) {
        feedback.style.color = '#EF4444';
        feedback.textContent = 'Título e mensagem são obrigatórios.';
        return;
    }
    try {
        feedback.style.color = '#6B7280';
        feedback.textContent = 'Publicando...';
        await apiRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify({ title, body, category, imageUrl: imageUrl || undefined, expiresAt: expiresAt || undefined })
        });
        feedback.style.color = '#22C55E';
        feedback.textContent = '✅ Comunicado publicado com sucesso!';
        document.getElementById('ann-title').value = '';
        document.getElementById('ann-body').value = '';
        document.getElementById('ann-image').value = '';
        document.getElementById('ann-expires').value = '';
        setTimeout(() => {
            document.getElementById('announcement-form-container').style.display = 'none';
            feedback.textContent = '';
            loadAnnouncements();
        }, 1500);
    } catch (e) {
        feedback.style.color = '#EF4444';
        feedback.textContent = `Erro: ${e.message}`;
    }
}

/** Remove um comunicado */
async function deleteAnnouncement(id) {
    if (!confirm('Remover este comunicado?')) return;
    try {
        await apiRequest(`/announcements/${id}`, { method: 'DELETE' });
        loadAnnouncements();
    } catch (e) {
        alert('Erro ao remover: ' + e.message);
    }
}

// Botões da aba comunicados
document.getElementById('add-announcement-btn').addEventListener('click', () => {
    const form = document.getElementById('announcement-form-container');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('save-announcement-btn').addEventListener('click', saveAnnouncement);
document.getElementById('cancel-announcement-btn').addEventListener('click', () => {
    document.getElementById('announcement-form-container').style.display = 'none';
});

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
