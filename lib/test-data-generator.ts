import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Gerador de Dados de Teste para Dashboard Admin
 * 
 * Este módulo gera dados falsos realistas para testar o Dashboard Admin:
 * - Funcionários com dados completos
 * - Check-ins dos últimos 7 dias
 * - Registros de hidratação variados
 * - Registros de pressão arterial (normais e elevados)
 * - Queixas de saúde aleatórias
 */

// Nomes brasileiros realistas
const FIRST_NAMES = [
  "João", "Maria", "José", "Ana", "Pedro", "Carla", "Lucas", "Juliana",
  "Carlos", "Fernanda", "Paulo", "Beatriz", "Rafael", "Amanda", "Felipe",
  "Camila", "Bruno", "Larissa", "Diego", "Patrícia", "Rodrigo", "Aline",
  "Marcelo", "Gabriela", "Thiago", "Renata", "André", "Vanessa", "Ricardo",
  "Tatiana", "Fernando", "Cristina", "Gustavo", "Mariana", "Leandro", "Priscila"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Rocha", "Almeida", "Nascimento", "Araújo", "Melo", "Barbosa", "Cardoso",
  "Correia", "Dias", "Fernandes", "Freitas", "Gonçalves", "Lopes", "Machado"
];

const DEPARTMENTS = [
  "Produção", "Manutenção", "Logística", "Qualidade", "Administrativo",
  "Segurança do Trabalho", "Recursos Humanos", "Almoxarifado"
];

const POSITIONS = [
  "Operador", "Técnico", "Supervisor", "Coordenador", "Auxiliar",
  "Assistente", "Analista", "Encarregado", "Gerente"
];

const WORK_TYPES = ["leve", "moderado", "pesado"];

const CHECK_IN_STATUSES = ["bem", "dor_leve", "dor_forte"];

const COMPLAINT_TYPES = [
  "Dor nas costas",
  "Dor no ombro",
  "Dor no joelho",
  "Dor de cabeça",
  "Fadiga",
  "Dor muscular",
  "Dor no pescoço",
  "Dor no punho",
  "Tontura",
  "Mal-estar geral"
];

const COMPLAINT_DESCRIPTIONS = [
  "Dor ao realizar movimentos repetitivos",
  "Desconforto após carregar peso",
  "Dor constante durante o turno",
  "Sensação de formigamento",
  "Dor que piora ao final do dia",
  "Dificuldade para realizar tarefas",
  "Dor aguda ao movimentar",
  "Inchaço na região afetada"
];

/**
 * Gera um CPF falso válido (apenas para testes)
 */
function generateFakeCPF(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cpf = Array.from({ length: 11 }, randomDigits).join("");
  return cpf;
}

/**
 * Gera uma matrícula única
 */
function generateMatricula(index: number): string {
  return `MAT${String(index + 1).padStart(5, "0")}`;
}

/**
 * Gera um nome completo aleatório
 */
function generateRandomName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Gera dados de um funcionário falso
 */
function generateFakeEmployee(index: number) {
  const name = generateRandomName();
  const cpf = generateFakeCPF();
  const matricula = generateMatricula(index);
  const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
  const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  const workType = WORK_TYPES[Math.floor(Math.random() * WORK_TYPES.length)];
  const weight = 55 + Math.floor(Math.random() * 45); // 55-100 kg
  const height = 150 + Math.floor(Math.random() * 40); // 150-190 cm

  return {
    id: `fake_${cpf}`,
    cpf,
    matricula,
    name,
    email: `${name.toLowerCase().replace(/ /g, ".")}@empresa.com.br`,
    department,
    position,
    weight,
    height,
    workType,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Gera check-ins dos últimos N dias para um funcionário
 */
function generateCheckIns(employeeId: string, days: number = 7) {
  const checkIns = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 80% de chance de ter feito check-in
    if (Math.random() < 0.8) {
      const status = CHECK_IN_STATUSES[Math.floor(Math.random() * CHECK_IN_STATUSES.length)];
      checkIns.push({
        employeeId,
        date: date.toISOString().split("T")[0],
        status,
        timestamp: date.toISOString(),
      });
    }
  }

  return checkIns;
}

/**
 * Gera registros de hidratação dos últimos N dias
 */
function generateHydrationRecords(employeeId: string, goalMl: number, days: number = 7) {
  const records = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 70% de chance de ter registrado hidratação
    if (Math.random() < 0.7) {
      // Varia entre 40% e 120% da meta
      const percentage = 0.4 + Math.random() * 0.8;
      const totalMl = Math.floor(goalMl * percentage);

      records.push({
        employeeId,
        date: date.toISOString().split("T")[0],
        totalMl,
        goalMl,
        timestamp: date.toISOString(),
      });
    }
  }

  return records;
}

/**
 * Gera registros de pressão arterial dos últimos N dias
 */
function generateBloodPressureRecords(employeeId: string, days: number = 7) {
  const records = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 50% de chance de ter medido pressão
    if (Math.random() < 0.5) {
      // 80% pressão normal, 20% elevada
      const isElevated = Math.random() < 0.2;

      let systolic, diastolic;
      if (isElevated) {
        systolic = 140 + Math.floor(Math.random() * 20); // 140-160
        diastolic = 90 + Math.floor(Math.random() * 15); // 90-105
      } else {
        systolic = 110 + Math.floor(Math.random() * 20); // 110-130
        diastolic = 70 + Math.floor(Math.random() * 15); // 70-85
      }

      records.push({
        employeeId,
        date: date.toISOString().split("T")[0],
        systolic,
        diastolic,
        timestamp: date.toISOString(),
      });
    }
  }

  return records;
}

/**
 * Gera queixas de saúde aleatórias
 */
function generateComplaints(employeeId: string, count: number = 0) {
  const complaints = [];
  const today = new Date();

  // Se count = 0, gera 0-3 queixas aleatoriamente
  const numComplaints = count > 0 ? count : Math.floor(Math.random() * 4);

  for (let i = 0; i < numComplaints; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const type = COMPLAINT_TYPES[Math.floor(Math.random() * COMPLAINT_TYPES.length)];
    const description =
      COMPLAINT_DESCRIPTIONS[Math.floor(Math.random() * COMPLAINT_DESCRIPTIONS.length)];

    complaints.push({
      employeeId,
      type,
      description,
      date: date.toISOString().split("T")[0],
      timestamp: date.toISOString(),
    });
  }

  return complaints;
}

/**
 * Gera todos os dados de teste e salva no AsyncStorage
 */
export async function generateTestData(numEmployees: number = 15) {
  try {
    console.log(`[TestDataGenerator] Gerando ${numEmployees} funcionários de teste...`);

    const employees = [];
    const allCheckIns = [];
    const allHydration = [];
    const allPressure = [];
    const allComplaints = [];

    for (let i = 0; i < numEmployees; i++) {
      const employee = generateFakeEmployee(i);
      employees.push(employee);

      // Calcular meta de hidratação baseada no peso e tipo de trabalho
      const baseGoal = employee.weight * 35; // 35ml por kg
      const workMultiplier = employee.workType === "pesado" ? 1.3 : employee.workType === "moderado" ? 1.15 : 1.0;
      const goalMl = Math.floor(baseGoal * workMultiplier);

      // Gerar dados para este funcionário
      const checkIns = generateCheckIns(employee.id, 7);
      const hydration = generateHydrationRecords(employee.id, goalMl, 7);
      const pressure = generateBloodPressureRecords(employee.id, 7);
      const complaints = generateComplaints(employee.id);

      allCheckIns.push(...checkIns);
      allHydration.push(...hydration);
      allPressure.push(...pressure);
      allComplaints.push(...complaints);

      console.log(
        `[TestDataGenerator] ${employee.name}: ${checkIns.length} check-ins, ${hydration.length} hidratações, ${pressure.length} pressões, ${complaints.length} queixas`
      );
    }

    // Salvar no AsyncStorage
    await AsyncStorage.setItem("test_employees", JSON.stringify(employees));
    await AsyncStorage.setItem("test_check_ins", JSON.stringify(allCheckIns));
    await AsyncStorage.setItem("test_hydration", JSON.stringify(allHydration));
    await AsyncStorage.setItem("test_pressure", JSON.stringify(allPressure));
    await AsyncStorage.setItem("test_complaints", JSON.stringify(allComplaints));
    await AsyncStorage.setItem("test_data_generated", "true");

    console.log(`[TestDataGenerator] ✅ Dados de teste gerados com sucesso!`);
    console.log(`[TestDataGenerator] Total: ${employees.length} funcionários`);
    console.log(`[TestDataGenerator] Total: ${allCheckIns.length} check-ins`);
    console.log(`[TestDataGenerator] Total: ${allHydration.length} registros de hidratação`);
    console.log(`[TestDataGenerator] Total: ${allPressure.length} registros de pressão`);
    console.log(`[TestDataGenerator] Total: ${allComplaints.length} queixas`);

    return {
      success: true,
      stats: {
        employees: employees.length,
        checkIns: allCheckIns.length,
        hydration: allHydration.length,
        pressure: allPressure.length,
        complaints: allComplaints.length,
      },
    };
  } catch (error) {
    console.error("[TestDataGenerator] Erro ao gerar dados de teste:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Limpa todos os dados de teste do AsyncStorage
 */
export async function clearTestData() {
  try {
    console.log("[TestDataGenerator] Limpando dados de teste...");

    await AsyncStorage.removeItem("test_employees");
    await AsyncStorage.removeItem("test_check_ins");
    await AsyncStorage.removeItem("test_hydration");
    await AsyncStorage.removeItem("test_pressure");
    await AsyncStorage.removeItem("test_complaints");
    await AsyncStorage.removeItem("test_data_generated");

    console.log("[TestDataGenerator] ✅ Dados de teste limpos com sucesso!");

    return { success: true };
  } catch (error) {
    console.error("[TestDataGenerator] Erro ao limpar dados de teste:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Verifica se existem dados de teste
 */
export async function hasTestData(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem("test_data_generated");
    return flag === "true";
  } catch (error) {
    return false;
  }
}

/**
 * Carrega dados de teste do AsyncStorage
 */
export async function loadTestData() {
  try {
    const employees = await AsyncStorage.getItem("test_employees");
    const checkIns = await AsyncStorage.getItem("test_check_ins");
    const hydration = await AsyncStorage.getItem("test_hydration");
    const pressure = await AsyncStorage.getItem("test_pressure");
    const complaints = await AsyncStorage.getItem("test_complaints");

    return {
      employees: employees ? JSON.parse(employees) : [],
      checkIns: checkIns ? JSON.parse(checkIns) : [],
      hydration: hydration ? JSON.parse(hydration) : [],
      pressure: pressure ? JSON.parse(pressure) : [],
      complaints: complaints ? JSON.parse(complaints) : [],
    };
  } catch (error) {
    console.error("[TestDataGenerator] Erro ao carregar dados de teste:", error);
    return {
      employees: [],
      checkIns: [],
      hydration: [],
      pressure: [],
      complaints: [],
    };
  }
}
