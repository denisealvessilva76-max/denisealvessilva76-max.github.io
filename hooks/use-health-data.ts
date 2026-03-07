import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToFirebase, pushToFirebase } from "@/lib/firebase";
import {
  CheckIn,
  PressureReading,
  SymptomReport,
  UserProfile,
  CheckInStatus,
  PressureClassification,
} from "@/lib/types";

const STORAGE_KEYS = {
  PROFILE: "health:profile",
  CHECK_INS: "health:check-ins",
  PRESSURE_READINGS: "health:pressure-readings",
  SYMPTOM_REPORTS: "health:symptom-reports",
};

/**
 * Obter matrícula do usuário logado
 */
async function getMatricula(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("employee:matricula");
  } catch {
    return null;
  }
}

export function useHealthData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [pressureReadings, setPressureReadings] = useState<PressureReading[]>([]);
  const [symptomReports, setSymptomReports] = useState<SymptomReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados ao inicializar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [profileData, checkInsData, pressureData, symptomsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS),
        AsyncStorage.getItem(STORAGE_KEYS.PRESSURE_READINGS),
        AsyncStorage.getItem(STORAGE_KEYS.SYMPTOM_REPORTS),
      ]);

      if (profileData) setProfile(JSON.parse(profileData));
      if (checkInsData) setCheckIns(JSON.parse(checkInsData));
      if (pressureData) setPressureReadings(JSON.parse(pressureData));
      if (symptomsData) setSymptomReports(JSON.parse(symptomsData));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar perfil do usuário
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      console.log("[SAVE PROFILE] Salvando perfil:", newProfile);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      setProfile(newProfile);

      // Sincronizar com Firebase
      const matricula = await getMatricula();
      if (matricula) {
        await saveToFirebase(matricula, 'profile', {
          name: newProfile.name,
          matricula: newProfile.matricula,
          cargo: newProfile.cargo,
          turno: newProfile.turno,
          updatedAt: new Date().toISOString(),
        });
        console.log("[SAVE PROFILE] Perfil sincronizado com Firebase");
      }
    } catch (error) {
      console.error("[SAVE PROFILE] Erro ao salvar perfil:", error);
    }
  }, []);

  // Adicionar check-in — salva localmente E no Firebase
  const addCheckIn = useCallback(async (status: CheckInStatus) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const newCheckIn: CheckIn = {
        id: Date.now().toString(),
        date: today,
        status,
        timestamp: Date.now(),
      };

      const updated = [...checkIns, newCheckIn];
      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updated));
      setCheckIns(updated);

      // Sincronizar com Firebase (campo 'checkins' para bater com painel admin)
      const matricula = await getMatricula();
      if (matricula) {
        await pushToFirebase(matricula, 'checkins', {
          date: today,
          status,
          timestamp: Date.now(),
        });
        console.log("[CheckIn] Sincronizado com Firebase:", status);
      }

      return newCheckIn;
    } catch (error) {
      console.error("Erro ao adicionar check-in:", error);
    }
  }, [checkIns]);

  // Adicionar leitura de pressão — salva localmente E no Firebase
  const addPressureReading = useCallback(
    async (systolic: number, diastolic: number) => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const newReading: PressureReading = {
          id: Date.now().toString(),
          date: today,
          systolic,
          diastolic,
          timestamp: Date.now(),
        };

        const updated = [...pressureReadings, newReading];
        await AsyncStorage.setItem(STORAGE_KEYS.PRESSURE_READINGS, JSON.stringify(updated));
        setPressureReadings(updated);

        // Sincronizar com Firebase (campo 'pressure' para bater com painel admin)
        const matricula = await getMatricula();
        if (matricula) {
          await pushToFirebase(matricula, 'pressure', {
            date: today,
            systolic,
            diastolic,
            timestamp: Date.now(),
          });
          console.log("[Pressure] Sincronizado com Firebase:", systolic, "/", diastolic);
        }

        return newReading;
      } catch (error) {
        console.error("Erro ao adicionar leitura de pressão:", error);
      }
    },
    [pressureReadings]
  );

  // Adicionar relatório de sintomas — salva localmente E no Firebase
  const addSymptomReport = useCallback(
    async (symptoms: string[], details?: string) => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const newReport: SymptomReport = {
          id: Date.now().toString(),
          date: today,
          symptoms,
          timestamp: Date.now(),
        };

        const updated = [...symptomReports, newReport];
        await AsyncStorage.setItem(STORAGE_KEYS.SYMPTOM_REPORTS, JSON.stringify(updated));
        setSymptomReports(updated);

        // Sincronizar com Firebase (campo 'symptoms' para bater com painel admin)
        const matricula = await getMatricula();
        if (matricula) {
          await pushToFirebase(matricula, 'symptoms', {
            date: today,
            symptoms,
            details: details || '',
            timestamp: Date.now(),
          });
          console.log("[Symptoms] Sincronizado com Firebase:", symptoms);
        }

        return newReport;
      } catch (error) {
        console.error("Erro ao adicionar relatório de sintomas:", error);
      }
    },
    [symptomReports]
  );

  // Classificar pressão arterial
  const classifyPressure = (systolic: number, diastolic: number): PressureClassification => {
    if (systolic <= 120 && diastolic <= 80) return "normal";
    if (systolic <= 129 && diastolic < 80) return "normal";
    if (systolic < 140 && diastolic < 90) return "pre-hipertensao";
    return "hipertensao";
  };

  // Obter última leitura de pressão
  const getLatestPressure = () => {
    return pressureReadings.length > 0 ? pressureReadings[pressureReadings.length - 1] : null;
  };

  // Obter check-ins dos últimos 7 dias
  const getLastSevenDaysCheckIns = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return checkIns.filter((checkIn) => {
      const checkInDate = new Date(checkIn.date);
      return checkInDate >= sevenDaysAgo && checkInDate <= today;
    });
  };

  // Obter check-in de hoje
  const getTodayCheckIn = () => {
    const today = new Date().toISOString().split("T")[0];
    return checkIns.find((checkIn) => checkIn.date === today);
  };

  return {
    profile,
    checkIns,
    pressureReadings,
    symptomReports,
    isLoading,
    saveProfile,
    addCheckIn,
    addPressureReading,
    addSymptomReport,
    classifyPressure,
    getLatestPressure,
    getLastSevenDaysCheckIns,
    getTodayCheckIn,
  };
}
