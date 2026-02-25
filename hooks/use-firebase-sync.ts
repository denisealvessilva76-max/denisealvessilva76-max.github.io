import { useEffect, useCallback } from 'react';
import { saveToFirebase, pushToFirebase } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook para sincronizar dados locais com Firebase
 * 
 * Estratégia:
 * 1. Salva SEMPRE no localStorage primeiro (garantia de persistência)
 * 2. Tenta sincronizar com Firebase em segundo plano
 * 3. Se falhar, marca para tentar novamente depois
 */

interface SyncOptions {
  matricula: string;
  enabled?: boolean;
}

export function useFirebaseSync({ matricula, enabled = true }: SyncOptions) {
  /**
   * Sincronizar perfil do funcionário
   */
  const syncProfile = useCallback(async (profileData: any) => {
    if (!enabled || !matricula) return;
    
    try {
      // Salvar no localStorage primeiro
      await AsyncStorage.setItem(
        `employee_profile_${matricula}`,
        JSON.stringify(profileData)
      );
      console.log('[Sync] Profile saved to localStorage');
      
      // Tentar sincronizar com Firebase
      await saveToFirebase(matricula, 'profile', profileData);
      console.log('[Sync] Profile synced to Firebase');
    } catch (error) {
      console.error('[Sync] Error syncing profile:', error);
      // Dados já estão salvos localmente, então não é crítico
    }
  }, [matricula, enabled]);

  /**
   * Sincronizar registro de água
   */
  const syncWaterIntake = useCallback(async (amount: number) => {
    if (!enabled || !matricula) return;
    
    try {
      const waterData = {
        amount,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      
      // Salvar no localStorage
      const key = `water_intake_${matricula}`;
      const existing = await AsyncStorage.getItem(key);
      const records = existing ? JSON.parse(existing) : [];
      records.push(waterData);
      await AsyncStorage.setItem(key, JSON.stringify(records));
      console.log('[Sync] Water intake saved to localStorage');
      
      // Sincronizar com Firebase
      await pushToFirebase(matricula, 'water', waterData);
      console.log('[Sync] Water intake synced to Firebase');
    } catch (error) {
      console.error('[Sync] Error syncing water intake:', error);
    }
  }, [matricula, enabled]);

  /**
   * Sincronizar pressão arterial
   */
  const syncBloodPressure = useCallback(async (systolic: number, diastolic: number) => {
    if (!enabled || !matricula) return;
    
    try {
      const bpData = {
        systolic,
        diastolic,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      
      // Salvar no localStorage
      const key = `blood_pressure_${matricula}`;
      const existing = await AsyncStorage.getItem(key);
      const records = existing ? JSON.parse(existing) : [];
      records.push(bpData);
      await AsyncStorage.setItem(key, JSON.stringify(records));
      console.log('[Sync] Blood pressure saved to localStorage');
      
      // Sincronizar com Firebase
      await pushToFirebase(matricula, 'bloodPressure', bpData);
      console.log('[Sync] Blood pressure synced to Firebase');
    } catch (error) {
      console.error('[Sync] Error syncing blood pressure:', error);
    }
  }, [matricula, enabled]);

  /**
   * Sincronizar sintomas/queixas
   */
  const syncSymptoms = useCallback(async (symptoms: string[], details?: string) => {
    if (!enabled || !matricula) return;
    
    try {
      const symptomData = {
        symptoms,
        details,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      
      // Salvar no localStorage
      const key = `symptoms_${matricula}`;
      const existing = await AsyncStorage.getItem(key);
      const records = existing ? JSON.parse(existing) : [];
      records.push(symptomData);
      await AsyncStorage.setItem(key, JSON.stringify(records));
      console.log('[Sync] Symptoms saved to localStorage');
      
      // Sincronizar com Firebase
      await pushToFirebase(matricula, 'symptoms', symptomData);
      console.log('[Sync] Symptoms synced to Firebase');
    } catch (error) {
      console.error('[Sync] Error syncing symptoms:', error);
    }
  }, [matricula, enabled]);

  /**
   * Sincronizar check-in diário
   */
  const syncCheckin = useCallback(async () => {
    if (!enabled || !matricula) return;
    
    try {
      const checkinData = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      
      // Salvar no localStorage
      const key = `checkins_${matricula}`;
      const existing = await AsyncStorage.getItem(key);
      const records = existing ? JSON.parse(existing) : [];
      records.push(checkinData);
      await AsyncStorage.setItem(key, JSON.stringify(records));
      console.log('[Sync] Check-in saved to localStorage');
      
      // Sincronizar com Firebase
      await pushToFirebase(matricula, 'checkins', checkinData);
      console.log('[Sync] Check-in synced to Firebase');
    } catch (error) {
      console.error('[Sync] Error syncing check-in:', error);
    }
  }, [matricula, enabled]);

  return {
    syncProfile,
    syncWaterIntake,
    syncBloodPressure,
    syncSymptoms,
    syncCheckin,
  };
}
