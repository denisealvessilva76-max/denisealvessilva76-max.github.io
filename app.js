/**
 * Painel Administrativo - Canteiro Saudável
 * Versão 2.0 - Com drill-down interativo e gestão de recompensas
 */

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

// ========== AUTENTICAÇÃO ==========
function login(email, password) {
    const validCredentials = [
        { email: 'admin@canteiro.com', password: 'admin123' },
        { email: 'sesmt@empresa.com', password: 'sesmt2024' },
        { email: 'denise.silva@mip.com.br', password: 'mip2024' },
        { email: 'estefane.mendes@mip.com.br', password: 'mip2024' }
    ];
    const user = validCredentials.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { email: user.email };
        localStorage.setItem('admin_user', JSON.stringify(currentUser));
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
    if (stored) {
        currentUser = JSON.parse(stored);
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
    document.getElementById('admin-email-display').textContent = currentUser.email;
    loadEmployeesData();
    loadRewardsData();
}

// ========== FIREBASE DATA ==========
function loadEmployeesData() {
    showLoading(true);
    const employeesRef = database.ref('canteiro-saudavel/employees');
    unsubscribe = employeesRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            employeesData = Object.keys(data).map(matricula => {
                const emp = data[matricula];
                return {
                    matricula,
                    // Perfil
                    name: emp.profile?.name || emp.name || 'Sem nome',
                    cargo: emp.profile?.cargo || emp.cargo || '-',
                    turno: emp.profile?.turno || emp.turno || '-',
                    email: emp.profile?.email || emp.email || '',
                    // Dados de saúde — suporta tanto 'hydration' quanto 'water'
                    hydration: emp.hydration || emp.water || {},
                    // Pressão — suporta tanto 'pressure' quanto 'bloodPressure'
                    pressure: emp.pressure || emp.bloodPressure || {},
                    symptoms: emp.symptoms || {},
                    checkins: emp.checkins || {},
                    challenges: emp.challenges || {},
                    points: emp.points || 0,
                };
            });
            console.log(`[Admin] Carregados ${employeesData.length} funcionários`);
            updateDashboard();
        } else {
            employeesData = [];
            updateDashboard();
        }
        showLoading(false);
    }, (error) => {
        console.error('[Admin] Erro ao carregar dados:', error);
        showLoading(false);
    });
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
    updateStats();
    updateEmployeesList();
    updateRecentActivity();
    updateCharts();
}

// ========== ESTATÍSTICAS ==========
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Funcionários ativos (check-in ou qualquer dado nos últimos 7 dias)
    const activeEmployees = employeesData.filter(emp => {
        const lastCheckin = getLastCheckin(emp);
        return lastCheckin && lastCheckin >= weekAgo;
    }).length;

    // Hidratação média hoje
    const hydrationValues = employeesData.map(emp => {
        const todayH = emp.hydration[today];
        if (todayH) {
            const goal = todayH.goal || 2000;
            const intake = todayH.waterIntake || 0;
            return (intake / goal) * 100;
        }
        return null;
    }).filter(v => v !== null);
    const avgHydration = hydrationValues.length > 0
        ? Math.round(hydrationValues.reduce((a, b) => a + b, 0) / hydrationValues.length)
        : 0;

    // Pressão monitorada (registros nos últimos 7 dias)
    const pressureMonitored = employeesData.filter(emp => {
        const readings = Object.values(emp.pressure);
        return readings.some(r => r && r.date && r.date >= weekAgo);
    }).length;

    // Queixas na semana
    const complaintsCount = employeesData.reduce((total, emp) => {
        const symptoms = Object.values(emp.symptoms);
        const recent = symptoms.filter(s => s && s.date && s.date >= weekAgo);
        return total + recent.length;
    }, 0);

    // Check-ins hoje
    const checkinsToday = employeesData.filter(emp => getLastCheckin(emp) === today).length;

    // Desafios ativos
    const activeChallenges = employeesData.reduce((total, emp) => {
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
    if (employeesData.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👷</div><p class="empty-state-text">Nenhum funcionário cadastrado ainda.<br>Peça para os trabalhadores se cadastrarem no app.</p></div>`;
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    container.innerHTML = employeesData.map(emp => {
        const lastCheckin = getLastCheckin(emp);
        const isActive = lastCheckin && lastCheckin >= weekAgo;
        const todayH = emp.hydration[today];
        const hydrationText = todayH ? `${todayH.waterIntake || 0}ml / ${todayH.goal || 2000}ml` : 'Sem dados hoje';
        const lastPressure = getLastPressure(emp);
        const pressureText = lastPressure ? `${lastPressure.systolic}/${lastPressure.diastolic} mmHg` : 'Sem dados';
        const complaintsCount = Object.values(emp.symptoms).filter(s => s && s.date && s.date >= weekAgo).length;

        return `
            <div class="employee-card clickable" onclick="openEmployeeModal('${emp.matricula}')">
                <div class="employee-header">
                    <div>
                        <div class="employee-name">${emp.name}</div>
                        <div class="employee-matricula">Mat: ${emp.matricula}</div>
                    </div>
                    <span class="employee-status ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                <div class="employee-info">
                    <div class="info-row">
                        <span class="info-label">Cargo</span>
                        <span class="info-value">${emp.cargo}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Turno</span>
                        <span class="info-value">${emp.turno}</span>
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
                        <span class="info-label">Queixas (7 dias)</span>
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
    const today = new Date().toISOString().split('T')[0];

    employeesData.forEach(emp => {
        const lastCheckin = getLastCheckin(emp);
        if (lastCheckin === today) {
            activities.push({ time: new Date(), title: '✅ Check-in realizado', description: `${emp.name} (${emp.matricula}) fez check-in hoje` });
        }
        Object.values(emp.symptoms).filter(s => s && s.date === today).forEach(symptom => {
            activities.push({
                time: new Date(symptom.timestamp || Date.now()),
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
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><p class="empty-state-text">Nenhuma atividade registrada hoje.</p></div>`;
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
    const today = new Date();

    // Hidratação dos últimos 7 dias
    const hydrationLabels = [];
    const hydrationValues = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        hydrationLabels.push(dayLabel);
        const totalMl = employeesData.reduce((sum, emp) => {
            const h = emp.hydration[dateStr];
            return sum + (h ? (h.waterIntake || 0) : 0);
        }, 0);
        const count = employeesData.filter(emp => emp.hydration[dateStr]).length || 1;
        hydrationValues.push(Math.round(totalMl / count));
    }
    renderChart('hydration-chart', 'line', hydrationLabels, [{ label: 'Hidratação Média (ml)', data: hydrationValues, borderColor: '#0a7ea4', backgroundColor: 'rgba(10,126,164,0.1)', tension: 0.4, fill: true }]);

    // Pressão arterial (últimas 10 leituras de todos)
    const allPressures = [];
    employeesData.forEach(emp => {
        Object.values(emp.pressure).forEach(r => {
            if (r && r.systolic && r.diastolic) {
                allPressures.push({ name: emp.name.split(' ')[0], systolic: r.systolic, diastolic: r.diastolic, date: r.date || '' });
            }
        });
    });
    allPressures.sort((a, b) => a.date.localeCompare(b.date));
    const pressureSlice = allPressures.slice(-10);
    renderChart('pressure-chart', 'bar', pressureSlice.map(p => p.name), [
        { label: 'Sistólica', data: pressureSlice.map(p => p.systolic), backgroundColor: 'rgba(239,68,68,0.7)' },
        { label: 'Diastólica', data: pressureSlice.map(p => p.diastolic), backgroundColor: 'rgba(251,191,36,0.7)' }
    ]);

    // Queixas por tipo
    const symptomsCount = {};
    employeesData.forEach(emp => {
        Object.values(emp.symptoms).forEach(s => {
            if (s && s.symptoms) {
                const list = Array.isArray(s.symptoms) ? s.symptoms : [s.symptoms];
                list.forEach(sym => { symptomsCount[sym] = (symptomsCount[sym] || 0) + 1; });
            }
        });
    });
    const sympLabels = Object.keys(symptomsCount).slice(0, 8);
    const sympValues = sympLabels.map(k => symptomsCount[k]);
    renderChart('complaints-chart', 'doughnut', sympLabels, [{ data: sympValues, backgroundColor: ['#0a7ea4','#F59E0B','#EF4444','#22C55E','#8B5CF6','#EC4899','#14B8A6','#F97316'] }]);

    // Check-ins nos últimos 7 dias
    const checkinLabels = [];
    const checkinValues = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        checkinLabels.push(dayLabel);
        const count = employeesData.filter(emp => {
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

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Botões de fechar modal
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

// --- Modal: Funcionários Ativos ---
function showActiveEmployees() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const active = employeesData.filter(emp => {
        const lc = getLastCheckin(emp);
        return lc && lc >= weekAgo;
    });
    const content = document.getElementById('modal-active-content');
    if (active.length === 0) {
        content.innerHTML = emptyState('👷', 'Nenhum funcionário ativo nos últimos 7 dias.');
    } else {
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Último Check-in</th></tr></thead>
                <tbody>
                    ${active.map(emp => `
                        <tr>
                            <td><strong>${emp.name}</strong></td>
                            <td>${emp.matricula}</td>
                            <td>${emp.cargo}</td>
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
    const today = new Date().toISOString().split('T')[0];
    const content = document.getElementById('modal-hydration-content');
    const withData = employeesData.filter(emp => emp.hydration[today]);
    if (withData.length === 0) {
        content.innerHTML = emptyState('💧', 'Nenhum registro de hidratação hoje.');
    } else {
        const rows = withData.sort((a, b) => {
            const aH = a.hydration[today]?.waterIntake || 0;
            const bH = b.hydration[today]?.waterIntake || 0;
            return bH - aH;
        }).map(emp => {
            const h = emp.hydration[today];
            const intake = h.waterIntake || 0;
            const goal = h.goal || 2000;
            const pct = Math.min(100, Math.round((intake / goal) * 100));
            const cls = pct < 40 ? 'low' : pct < 75 ? 'mid' : 'high';
            return `
                <tr>
                    <td><strong>${emp.name}</strong></td>
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
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Consumido</th><th>Meta</th><th>Progresso</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-hydration');
}

// --- Modal: Pressão ---
function showPressureDetails() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const content = document.getElementById('modal-pressure-content');
    const allReadings = [];
    employeesData.forEach(emp => {
        Object.values(emp.pressure).forEach(r => {
            if (r && r.systolic) {
                allReadings.push({ name: emp.name, matricula: emp.matricula, ...r });
            }
        });
    });
    allReadings.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (allReadings.length === 0) {
        content.innerHTML = emptyState('🩺', 'Nenhuma leitura de pressão registrada.');
    } else {
        const rows = allReadings.slice(0, 50).map(r => {
            const classification = classifyPressure(r.systolic, r.diastolic);
            const badgeClass = classification === 'Normal' ? 'badge-normal' : classification === 'Pré-hipertensão' ? 'badge-pre' : 'badge-hyper';
            return `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td>${r.systolic}/${r.diastolic} mmHg</td>
                    <td><span class="badge ${badgeClass}">${classification}</span></td>
                    <td>${r.date || '-'}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Pressão</th><th>Classificação</th><th>Data</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-pressure');
}

// --- Modal: Queixas ---
function showComplaintsDetails() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const content = document.getElementById('modal-complaints-content');
    const allComplaints = [];
    employeesData.forEach(emp => {
        Object.values(emp.symptoms).forEach(s => {
            if (s && s.date && s.date >= weekAgo) {
                allComplaints.push({ name: emp.name, matricula: emp.matricula, ...s });
            }
        });
    });
    allComplaints.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (allComplaints.length === 0) {
        content.innerHTML = emptyState('⚠️', 'Nenhuma queixa registrada nos últimos 7 dias.');
    } else {
        const rows = allComplaints.map(s => {
            const sympList = Array.isArray(s.symptoms) ? s.symptoms.join(', ') : (s.symptoms || '-');
            return `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${sympList}</td>
                    <td>${s.details || s.description || '-'}</td>
                    <td>${s.date || '-'}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Sintomas</th><th>Detalhes</th><th>Data</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-complaints');
}

// --- Modal: Check-ins ---
function showCheckinsDetails() {
    const today = new Date().toISOString().split('T')[0];
    const content = document.getElementById('modal-checkins-content');
    const todayCheckins = [];
    employeesData.forEach(emp => {
        Object.values(emp.checkins).forEach(c => {
            if (c && c.date === today) {
                todayCheckins.push({ name: emp.name, matricula: emp.matricula, ...c });
            }
        });
    });

    if (todayCheckins.length === 0) {
        content.innerHTML = emptyState('✅', 'Nenhum check-in registrado hoje.');
    } else {
        const rows = todayCheckins.map(c => {
            const statusLabel = c.status === 'good' ? '😊 Bem' : c.status === 'pain' ? '😣 Com dor' : c.status || '-';
            const statusColor = c.status === 'good' ? '#22C55E' : '#EF4444';
            return `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.matricula}</td>
                    <td style="color:${statusColor};font-weight:600;">${statusLabel}</td>
                    <td>${c.timestamp ? new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Matrícula</th><th>Status</th><th>Horário</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    openModal('modal-checkins');
}

// --- Modal: Desafios ---
function showChallengesDetails() {
    const content = document.getElementById('modal-challenges-content');
    const allChallenges = [];
    employeesData.forEach(emp => {
        Object.values(emp.challenges).forEach(c => {
            if (c && c.status === 'active') {
                allChallenges.push({ name: emp.name, matricula: emp.matricula, ...c });
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
                    <td>${c.title || c.challengeId || '-'}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="progress-bar-wrap" style="flex:1;">
                                <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
                            </div>
                            <span style="font-size:12px;color:var(--muted);min-width:36px;">${pct}%</span>
                        </div>
                    </td>
                    <td>${c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
            `;
        }).join('');
        content.innerHTML = `
            <table class="modal-table">
                <thead><tr><th>Funcionário</th><th>Desafio</th><th>Progresso</th><th>Prazo</th></tr></thead>
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
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Hidratação últimos 7 dias
    const hydrationRows = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const h = emp.hydration[ds];
        if (h) {
            const pct = Math.min(100, Math.round(((h.waterIntake || 0) / (h.goal || 2000)) * 100));
            hydrationRows.push(`<tr><td>${ds}</td><td>${h.waterIntake || 0}ml</td><td>${h.goal || 2000}ml</td><td>${pct}%</td></tr>`);
        }
    }

    // Pressão
    const pressureRows = Object.values(emp.pressure).filter(r => r && r.systolic).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(r => {
        const cl = classifyPressure(r.systolic, r.diastolic);
        const bc = cl === 'Normal' ? 'badge-normal' : cl === 'Pré-hipertensão' ? 'badge-pre' : 'badge-hyper';
        return `<tr><td>${r.date || '-'}</td><td>${r.systolic}/${r.diastolic} mmHg</td><td><span class="badge ${bc}">${cl}</span></td></tr>`;
    });

    // Sintomas
    const symptomRows = Object.values(emp.symptoms).filter(s => s && s.date).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(s => {
        const sympList = Array.isArray(s.symptoms) ? s.symptoms.join(', ') : (s.symptoms || '-');
        return `<tr><td>${s.date}</td><td>${sympList}</td><td>${s.details || '-'}</td></tr>`;
    });

    // Check-ins
    const checkinRows = Object.values(emp.checkins).filter(c => c && c.date).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10).map(c => {
        const sl = c.status === 'good' ? '😊 Bem' : c.status === 'pain' ? '😣 Com dor' : c.status || '-';
        return `<tr><td>${c.date}</td><td>${sl}</td></tr>`;
    });

    // Desafios
    const challengeRows = Object.values(emp.challenges).filter(c => c).map(c => {
        const pct = Math.min(100, Math.round(c.progress || 0));
        return `<tr><td>${c.title || c.challengeId || '-'}</td><td>${c.status || '-'}</td><td>${pct}%</td></tr>`;
    });

    const todayH = emp.hydration[today];
    const lastP = getLastPressure(emp);

    document.getElementById('modal-employee-content').innerHTML = `
        <div class="employee-detail-section">
            <h3>📋 Informações Pessoais</h3>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-item-label">Nome</div><div class="detail-item-value">${emp.name}</div></div>
                <div class="detail-item"><div class="detail-item-label">Matrícula</div><div class="detail-item-value">${emp.matricula}</div></div>
                <div class="detail-item"><div class="detail-item-label">Cargo</div><div class="detail-item-value">${emp.cargo}</div></div>
                <div class="detail-item"><div class="detail-item-label">Turno</div><div class="detail-item-value">${emp.turno}</div></div>
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

    // Calcular pontuação: check-ins (10pts), hidratação meta (5pts), desafios (20pts), sem queixas (+5pts)
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const ranked = employeesData.map(emp => {
        let score = 0;
        // Check-ins
        const checkinCount = Object.values(emp.checkins).filter(c => c && c.date && c.date >= weekAgo).length;
        score += checkinCount * 10;
        // Hidratação (atingiu meta)
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const h = emp.hydration[ds];
            if (h && h.waterIntake >= (h.goal || 2000)) score += 5;
        }
        // Desafios completados
        const completedChallenges = Object.values(emp.challenges).filter(c => c && c.completed).length;
        score += completedChallenges * 20;
        // Sem queixas na semana
        const hasComplaints = Object.values(emp.symptoms).some(s => s && s.date && s.date >= weekAgo);
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
                <div class="ranking-details">${emp.cargo} · ${emp.checkinCount} check-ins esta semana</div>
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
    showLoading(true);
    loadEmployeesData();
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

// ========== EXPORTAÇÃO DE PDF ==========
async function exportToPDF() {
    try {
        showLoading(true);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Cabeçalho
        pdf.setFillColor(10, 126, 164);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Canteiro Saudavel', margin, 18);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Relatorio de Saude e Bem-Estar', margin, 30);
        y = 50;

        // Informações
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        const now = new Date();
        pdf.text(`Periodo: ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, margin, y); y += 6;
        pdf.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, margin, y); y += 6;
        pdf.text(`Administrador: ${currentUser.email}`, margin, y); y += 15;

        // Estatísticas
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Estatisticas Gerais', margin, y); y += 10;

        const stats = [
            { label: 'Funcionarios Ativos', value: document.getElementById('stat-active').textContent },
            { label: 'Hidratacao Media', value: document.getElementById('stat-hydration').textContent },
            { label: 'Pressao Monitorada', value: document.getElementById('stat-pressure').textContent },
            { label: 'Queixas na Semana', value: document.getElementById('stat-complaints').textContent },
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
            const sy = y + row * 25;
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(x, sy, statW, 20, 3, 3, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(104, 112, 118);
            pdf.text(s.label, x + 5, sy + 8);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(s.value, x + 5, sy + 16);
            pdf.setFont('helvetica', 'normal');
        });
        y += Math.ceil(stats.length / 2) * 25 + 15;

        // Lista de funcionários
        if (y > pageHeight - 60) { pdf.addPage(); y = margin; }
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(10, 126, 164);
        pdf.text('Lista de Funcionarios', margin, y); y += 10;

        const today = new Date().toISOString().split('T')[0];
        employeesData.slice(0, 25).forEach((emp, idx) => {
            if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
            const h = emp.hydration[today];
            const hText = h ? `${h.waterIntake || 0}ml` : 'N/A';
            const lp = getLastPressure(emp);
            const pText = lp ? `${lp.systolic}/${lp.diastolic}` : 'N/A';
            pdf.setFillColor(idx % 2 === 0 ? 255 : 248);
            pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${idx + 1}. ${emp.name}`, margin + 2, y);
            pdf.text(`Mat: ${emp.matricula}`, margin + 70, y);
            pdf.text(`Hidrat: ${hText}`, margin + 110, y);
            pdf.text(`PA: ${pText}`, margin + 150, y);
            y += 8;
        });

        // Rodapé
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Canteiro Saudavel - Relatorio Confidencial | Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        const fileName = `Canteiro_Saudavel_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
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

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
