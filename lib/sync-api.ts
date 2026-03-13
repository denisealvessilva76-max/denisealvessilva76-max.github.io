/**
 * Utilitário de Sincronização com PostgreSQL via API REST
 *
 * Envia dados do app para o banco de dados do servidor em tempo real.
 * Todas as chamadas são "fire and forget" — não bloqueiam o fluxo do app.
 * Se o servidor não estiver disponível, o dado já foi salvo localmente e no Firebase.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// URL base da API — usa a URL do servidor publicado ou localhost em dev
const getApiBase = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem("server:api_url");
    if (stored) return stored;
  } catch {}
  // Fallback: tenta o servidor local (dev) e o domínio publicado
  return "http://127.0.0.1:3000";
};

async function postToApi(endpoint: string, data: object): Promise<boolean> {
  try {
    const base = await getApiBase();
    const response = await fetch(`${base}/api/painel/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success) {
      console.log(`[SyncAPI] ✅ ${endpoint}:`, result.message || result.action);
      return true;
    }
    console.warn(`[SyncAPI] ⚠️ ${endpoint}:`, result.error);
    return false;
  } catch (error) {
    // Servidor indisponível — silencioso, dado já está no Firebase/AsyncStorage
    console.log(`[SyncAPI] 📴 ${endpoint} offline (dado salvo localmente)`);
    return false;
  }
}

/**
 * Sincronizar check-in com PostgreSQL
 */
export async function syncCheckInToPostgres(params: {
  matricula: string;
  date: string;
  status: string;
  mood?: string;
  symptoms?: string[];
  notes?: string;
}): Promise<void> {
  await postToApi("sync-checkin", {
    matricula: params.matricula,
    date: params.date,
    status: params.status,
    mood: params.mood || params.status,
    symptoms: params.symptoms || [],
    notes: params.notes || null,
  });
}

/**
 * Sincronizar hidratação com PostgreSQL
 */
export async function syncHydrationToPostgres(params: {
  matricula: string;
  date: string;
  waterIntake: number;
  glassesConsumed: number;
  goal?: number;
}): Promise<void> {
  await postToApi("sync-hydration", {
    matricula: params.matricula,
    date: params.date,
    waterIntake: params.waterIntake,
    glassesConsumed: params.glassesConsumed,
    goal: params.goal || 2000,
  });
}

/**
 * Sincronizar queixa/sintoma com PostgreSQL
 */
export async function syncComplaintToPostgres(params: {
  matricula: string;
  date: string;
  symptoms: string[];
  details?: string;
  severity?: string;
}): Promise<void> {
  await postToApi("sync-complaint", {
    matricula: params.matricula,
    date: params.date,
    symptoms: params.symptoms,
    details: params.details || null,
    severity: params.severity || "leve",
  });
}

/**
 * Sincronizar pressão arterial com PostgreSQL
 */
export async function syncPressureToPostgres(params: {
  matricula: string;
  date: string;
  systolic: number;
  diastolic: number;
  classification?: string;
}): Promise<void> {
  await postToApi("sync-pressure", {
    matricula: params.matricula,
    date: params.date,
    systolic: params.systolic,
    diastolic: params.diastolic,
    classification: params.classification || "normal",
  });
}

/**
 * Sincronizar desafio com PostgreSQL
 */
export async function syncChallengeToPostgres(params: {
  matricula: string;
  challengeId: string;
  title: string;
  status: "active" | "completed" | "abandoned";
  progress: number;
  currentValue: number;
  goalValue: number;
  startDate: string;
  completedDate?: string | null;
}): Promise<void> {
  await postToApi("sync-challenge", params);
}

/**
 * Sincronizar comunicado lido com PostgreSQL
 */
export async function syncAnnouncementReadToPostgres(params: {
  matricula: string;
  announcementId: string;
  readAt: string;
}): Promise<void> {
  await postToApi("sync-announcement-read", params);
}

/**
 * Sincronizar triagem de comorbidades com PostgreSQL
 */
export async function syncComorbidityToPostgres(params: {
  matricula: string;
  date: string;
  weight?: number;
  height?: number;
  imc?: number;
  imcStatus?: string;
  glucoseLevel?: number;
  riskFlags?: string[];
}): Promise<void> {
  await postToApi("sync-comorbidity", params);
}

/**
 * Salvar URL do servidor para uso futuro (chamado ao publicar o app)
 */
export async function setServerApiUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem("server:api_url", url);
    console.log(`[SyncAPI] URL do servidor salva: ${url}`);
  } catch {}
}
