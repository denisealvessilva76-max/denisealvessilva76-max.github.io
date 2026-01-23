import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "onboarding_completed";

export function useOnboarding() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingCompleted(value === "true");
    } catch (error) {
      console.error("Erro ao verificar status do onboarding:", error);
      setIsOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error("Erro ao salvar status do onboarding:", error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error("Erro ao resetar onboarding:", error);
    }
  };

  return {
    isOnboardingCompleted,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
