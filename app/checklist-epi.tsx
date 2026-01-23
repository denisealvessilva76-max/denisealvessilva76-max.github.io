import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type EPI = {
  id: string;
  name: string;
  emoji: string;
  mandatory: boolean;
  checked: boolean;
};

const EPIS_LIST: EPI[] = [
  { id: "capacete", name: "Capacete de Segurança", emoji: "🪖", mandatory: true, checked: false },
  { id: "oculos", name: "Óculos de Proteção", emoji: "🥽", mandatory: true, checked: false },
  { id: "luvas", name: "Luvas de Proteção", emoji: "🧤", mandatory: true, checked: false },
  { id: "botas", name: "Botas de Segurança", emoji: "👢", mandatory: true, checked: false },
  { id: "colete", name: "Colete Refletivo", emoji: "🦺", mandatory: true, checked: false },
  { id: "protetor_auricular", name: "Protetor Auricular", emoji: "🎧", mandatory: false, checked: false },
  { id: "mascara", name: "Máscara Respiratória", emoji: "😷", mandatory: false, checked: false },
  { id: "cinto", name: "Cinto de Segurança", emoji: "🔗", mandatory: false, checked: false },
];

const STORAGE_KEY = "epi_checklist";

export default function ChecklistEPIScreen() {
  const colors = useColors();
  const [epis, setEpis] = useState<EPI[]>(EPIS_LIST);
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toISOString().split("T")[0];

        // Se o último check foi hoje, carregar estado
        if (data.date === today) {
          setEpis(data.epis);
          setLastCheckDate(data.date);
        } else {
          // Novo dia, resetar checklist
          setEpis(EPIS_LIST);
          setLastCheckDate(null);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
    }
  };

  const saveChecklist = async (newEpis: EPI[]) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: today,
          epis: newEpis,
        })
      );
      setLastCheckDate(today);
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
    }
  };

  const toggleEPI = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEpis = epis.map((epi) => (epi.id === id ? { ...epi, checked: !epi.checked } : epi));
    setEpis(newEpis);
    saveChecklist(newEpis);
  };

  const allMandatoryChecked = epis.filter((e) => e.mandatory).every((e) => e.checked);
  const checkedCount = epis.filter((e) => e.checked).length;
  const totalCount = epis.length;

  const handleConfirm = () => {
    if (!allMandatoryChecked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Checklist de EPIs</Text>
            <Text className="text-sm text-muted mt-1">
              Marque os EPIs que você está usando hoje
            </Text>
          </View>
        </View>

        {/* Progresso */}
        <View className="bg-surface rounded-xl p-4 mb-6" style={{ borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">Progresso</Text>
            <Text className="text-sm text-muted">
              {checkedCount}/{totalCount}
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </View>
          {!allMandatoryChecked && (
            <Text className="text-xs text-error mt-2">⚠️ EPIs obrigatórios não marcados</Text>
          )}
        </View>

        {/* Lista de EPIs */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 100 }}>
          {/* EPIs Obrigatórios */}
          <Text className="text-sm font-semibold text-muted mb-2">OBRIGATÓRIOS</Text>
          {epis
            .filter((e) => e.mandatory)
            .map((epi) => (
              <TouchableOpacity
                key={epi.id}
                onPress={() => toggleEPI(epi.id)}
                className={`bg-surface rounded-xl p-4 flex-row items-center ${
                  epi.checked ? "border-2 border-primary" : ""
                }`}
                style={{
                  borderWidth: epi.checked ? 2 : 1,
                  borderColor: epi.checked ? colors.primary : colors.border,
                }}
              >
                <Text className="text-3xl mr-4">{epi.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{epi.name}</Text>
                  <Text className="text-xs text-error mt-1">Obrigatório</Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    epi.checked ? "bg-primary" : "bg-border"
                  }`}
                >
                  {epi.checked && <Text className="text-white text-sm">✓</Text>}
                </View>
              </TouchableOpacity>
            ))}

          {/* EPIs Opcionais */}
          <Text className="text-sm font-semibold text-muted mt-6 mb-2">OPCIONAIS (Conforme Atividade)</Text>
          {epis
            .filter((e) => !e.mandatory)
            .map((epi) => (
              <TouchableOpacity
                key={epi.id}
                onPress={() => toggleEPI(epi.id)}
                className={`bg-surface rounded-xl p-4 flex-row items-center ${
                  epi.checked ? "border-2 border-primary" : ""
                }`}
                style={{
                  borderWidth: epi.checked ? 2 : 1,
                  borderColor: epi.checked ? colors.primary : colors.border,
                }}
              >
                <Text className="text-3xl mr-4">{epi.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{epi.name}</Text>
                  <Text className="text-xs text-muted mt-1">Opcional</Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    epi.checked ? "bg-primary" : "bg-border"
                  }`}
                >
                  {epi.checked && <Text className="text-white text-sm">✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Botão Confirmar */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background">
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!allMandatoryChecked}
            className={`rounded-xl py-4 items-center ${
              allMandatoryChecked ? "bg-primary" : "bg-border"
            }`}
            style={{
              opacity: allMandatoryChecked ? 1 : 0.5,
            }}
          >
            <Text className={`font-semibold ${allMandatoryChecked ? "text-background" : "text-muted"}`}>
              {allMandatoryChecked ? "Confirmar EPIs ✓" : "Marque todos os EPIs obrigatórios"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
