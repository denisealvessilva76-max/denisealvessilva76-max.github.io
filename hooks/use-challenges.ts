import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  Challenge,
  ChallengeProgress,
  ChallengeRanking,
  AVAILABLE_CHALLENGES,
  calculateChallengeProgress,
  isChallengeCompleted,
  generateRanking,
} from "@/lib/challenges-data";

const STORAGE_KEY = "challenges_progress";
const ACTIVE_CHALLENGES_KEY = "active_challenges";

export function useChallenges() {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [progressList, setProgressList] = useState<ChallengeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados ao iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar desafios ativos
      const activeChallengesData = await AsyncStorage.getItem(ACTIVE_CHALLENGES_KEY);
      if (activeChallengesData) {
        setActiveChallenges(JSON.parse(activeChallengesData));
      }

      // Carregar progresso
      const progressData = await AsyncStorage.getItem(STORAGE_KEY);
      if (progressData) {
        setProgressList(JSON.parse(progressData));
      }
    } catch (error) {
      console.error("Erro ao carregar desafios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obter Worker ID
  const getWorkerId = async (): Promise<string> => {
    let workerId = await SecureStore.getItemAsync("worker_id");
    if (!workerId) {
      workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await SecureStore.setItemAsync("worker_id", workerId);
    }
    return workerId;
  };

  // Obter nome do trabalhador
  const getWorkerName = async (): Promise<string> => {
    const profileData = await AsyncStorage.getItem("worker_profile");
    if (profileData) {
      const profile = JSON.parse(profileData);
      return profile.name || "Trabalhador";
    }
    return "Trabalhador";
  };

  // Iniciar desafio
  const startChallenge = useCallback(async (challengeId: string) => {
    try {
      const challenge = AVAILABLE_CHALLENGES.find((c) => c.id === challengeId);
      if (!challenge) return false;

      const workerId = await getWorkerId();
      const workerName = await getWorkerName();

      // Adicionar aos desafios ativos
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + challenge.duration * 24 * 60 * 60 * 1000).toISOString();

      const activeChallenge: Challenge = {
        ...challenge,
        startDate,
        endDate,
        status: "active",
      };

      const updatedActive = [...activeChallenges, activeChallenge];
      setActiveChallenges(updatedActive);
      await AsyncStorage.setItem(ACTIVE_CHALLENGES_KEY, JSON.stringify(updatedActive));

      // Criar progresso inicial
      const newProgress: ChallengeProgress = {
        challengeId,
        userId: workerId,
        userName: workerName,
        progress: 0,
        currentValue: 0,
        goalValue: challenge.goal,
        startDate,
        lastUpdate: startDate,
        completed: false,
      };

      const updatedProgress = [...progressList, newProgress];
      setProgressList(updatedProgress);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));

      return true;
    } catch (error) {
      console.error("Erro ao iniciar desafio:", error);
      return false;
    }
  }, [activeChallenges, progressList]);

  // Atualizar progresso do desafio
  const updateChallengeProgress = useCallback(async (
    challengeId: string,
    value: number,
    increment: boolean = true
  ) => {
    try {
      const workerId = await getWorkerId();
      const progressIndex = progressList.findIndex(
        (p) => p.challengeId === challengeId && p.userId === workerId
      );

      if (progressIndex === -1) return false;

      const challenge = AVAILABLE_CHALLENGES.find((c) => c.id === challengeId);
      if (!challenge) return false;

      const currentProgress = progressList[progressIndex];
      const newValue = increment
        ? currentProgress.currentValue + value
        : value;

      const completed = newValue >= challenge.goal;
      const progress = (newValue / challenge.goal) * 100;

      const updatedProgress: ChallengeProgress = {
        ...currentProgress,
        currentValue: newValue,
        progress: Math.min(100, progress),
        lastUpdate: new Date().toISOString(),
        completed,
        completedDate: completed ? new Date().toISOString() : undefined,
      };

      const updatedList = [...progressList];
      updatedList[progressIndex] = updatedProgress;
      setProgressList(updatedList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

      return true;
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      return false;
    }
  }, [progressList]);

  // Obter progresso de um desafio específico
  const getChallengeProgress = useCallback(async (challengeId: string): Promise<ChallengeProgress | null> => {
    const workerId = await getWorkerId();
    return progressList.find(
      (p) => p.challengeId === challengeId && p.userId === workerId
    ) || null;
  }, [progressList]);

  // Obter ranking de um desafio
  const getChallengeRanking = useCallback((challengeId: string): ChallengeRanking[] => {
    const challengeProgress = progressList.filter((p) => p.challengeId === challengeId);
    return generateRanking(challengeProgress);
  }, [progressList]);

  // Obter desafios disponíveis (não iniciados)
  const getAvailableChallenges = useCallback(() => {
    const activeIds = activeChallenges.map((c) => c.id);
    return AVAILABLE_CHALLENGES.filter((c) => !activeIds.includes(c.id));
  }, [activeChallenges]);

  // Obter desafios completados
  const getCompletedChallenges = useCallback(async () => {
    const workerId = await getWorkerId();
    const completed = progressList.filter(
      (p) => p.userId === workerId && p.completed
    );
    return completed.map((p) => {
      const challenge = AVAILABLE_CHALLENGES.find((c) => c.id === p.challengeId);
      return { ...challenge, ...p };
    });
  }, [progressList]);

  return {
    activeChallenges,
    progressList,
    isLoading,
    startChallenge,
    updateChallengeProgress,
    getChallengeProgress,
    getChallengeRanking,
    getAvailableChallenges,
    getCompletedChallenges,
    refreshData: loadData,
  };
}
