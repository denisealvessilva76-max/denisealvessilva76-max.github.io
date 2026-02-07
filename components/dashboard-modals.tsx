import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

/**
 * Componentes de Modals para Dashboard Admin
 * 
 * Modals clicáveis que mostram detalhes de:
 * - Queixas de saúde
 * - Desafios ativos
 * - Alertas de pressão arterial
 * - Check-ins do dia
 */

// ==================== INTERFACES ====================

export interface Complaint {
  id: string;
  employeeName: string;
  employeeMatricula: string;
  complaint: string;
  description: string;
  severity: "leve" | "moderada" | "grave";
  date: string;
  resolved: boolean;
}

export interface Challenge {
  id: string;
  employeeName: string;
  employeeMatricula: string;
  challengeName: string;
  progress: number;
  startDate: string;
  photos: string[];
  checkIns: number;
}

export interface PressureAlert {
  id: string;
  employeeName: string;
  employeeMatricula: string;
  systolic: number;
  diastolic: number;
  classification: string;
  date: string;
  history: Array<{
    date: string;
    systolic: number;
    diastolic: number;
  }>;
}

export interface CheckInRecord {
  id: string;
  employeeName: string;
  employeeMatricula: string;
  status: "bem" | "dor_leve" | "dor_forte";
  time: string;
  notes?: string;
}

// ==================== MODAL DE QUEIXAS ====================

interface ComplaintsModalProps {
  visible: boolean;
  onClose: () => void;
  complaints: Complaint[];
  onResolve?: (complaintId: string) => void;
}

export function ComplaintsModal({ visible, onClose, complaints, onResolve }: ComplaintsModalProps) {
  const colors = useColors();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "grave":
        return "#EF4444";
      case "moderada":
        return "#F59E0B";
      case "leve":
        return "#10B981";
      default:
        return colors.muted;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "grave":
        return "Grave";
      case "moderada":
        return "Moderada";
      case "leve":
        return "Leve";
      default:
        return severity;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Header */}
          <View className="p-6 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground text-2xl font-bold">
                  Queixas de Saúde
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {complaints.length} queixa{complaints.length !== 1 ? "s" : ""} registrada{complaints.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                className="bg-surface p-3 rounded-full"
              >
                <Text className="text-foreground text-lg font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Queixas */}
          <ScrollView className="flex-1 p-6">
            {complaints.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-muted text-center">
                  Nenhuma queixa registrada
                </Text>
              </View>
            ) : (
              complaints.map((complaint) => (
                <View
                  key={complaint.id}
                  className="bg-surface p-4 rounded-lg mb-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: getSeverityColor(complaint.severity) }}
                >
                  {/* Cabeçalho */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-lg">
                        {complaint.employeeName}
                      </Text>
                      <Text className="text-muted text-sm">
                        Matrícula: {complaint.employeeMatricula}
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getSeverityColor(complaint.severity) + "20" }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getSeverityColor(complaint.severity) }}
                      >
                        {getSeverityLabel(complaint.severity)}
                      </Text>
                    </View>
                  </View>

                  {/* Queixa */}
                  <View className="mb-2">
                    <Text className="text-muted text-xs mb-1">Queixa:</Text>
                    <Text className="text-foreground font-semibold">
                      {complaint.complaint}
                    </Text>
                  </View>

                  {/* Descrição */}
                  {complaint.description && (
                    <View className="mb-2">
                      <Text className="text-muted text-xs mb-1">Detalhes:</Text>
                      <Text className="text-foreground text-sm">
                        {complaint.description}
                      </Text>
                    </View>
                  )}

                  {/* Data */}
                  <Text className="text-muted text-xs mt-2">
                    Registrado em: {complaint.date}
                  </Text>

                  {/* Botão Resolver */}
                  {!complaint.resolved && onResolve && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onResolve(complaint.id);
                      }}
                      className="bg-primary mt-3 py-2 px-4 rounded-lg"
                    >
                      <Text className="text-background text-center font-semibold">
                        Marcar como Resolvida
                      </Text>
                    </TouchableOpacity>
                  )}

                  {complaint.resolved && (
                    <View className="bg-success/20 mt-3 py-2 px-4 rounded-lg">
                      <Text className="text-success text-center font-semibold">
                        ✓ Resolvida
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ==================== MODAL DE DESAFIOS ====================

interface ChallengesModalProps {
  visible: boolean;
  onClose: () => void;
  challenges: Challenge[];
}

export function ChallengesModal({ visible, onClose, challenges }: ChallengesModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Header */}
          <View className="p-6 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground text-2xl font-bold">
                  Desafios Ativos
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {challenges.length} funcionário{challenges.length !== 1 ? "s" : ""} participando
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                className="bg-surface p-3 rounded-full"
              >
                <Text className="text-foreground text-lg font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Desafios */}
          <ScrollView className="flex-1 p-6">
            {challenges.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-muted text-center">
                  Nenhum desafio ativo no momento
                </Text>
              </View>
            ) : (
              challenges.map((challenge) => (
                <View key={challenge.id} className="bg-surface p-4 rounded-lg mb-3">
                  {/* Cabeçalho */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-lg">
                        {challenge.employeeName}
                      </Text>
                      <Text className="text-muted text-sm">
                        Matrícula: {challenge.employeeMatricula}
                      </Text>
                    </View>
                  </View>

                  {/* Desafio */}
                  <View className="mb-2">
                    <Text className="text-muted text-xs mb-1">Desafio:</Text>
                    <Text className="text-foreground font-semibold">
                      {challenge.challengeName}
                    </Text>
                  </View>

                  {/* Progresso */}
                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-muted text-xs">Progresso:</Text>
                      <Text className="text-primary font-bold">{challenge.progress}%</Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </View>
                  </View>

                  {/* Check-ins */}
                  <Text className="text-muted text-sm">
                    Check-ins realizados: {challenge.checkIns}
                  </Text>

                  {/* Data de início */}
                  <Text className="text-muted text-xs mt-2">
                    Iniciado em: {challenge.startDate}
                  </Text>

                  {/* Fotos */}
                  {challenge.photos.length > 0 && (
                    <View className="mt-3">
                      <Text className="text-muted text-xs mb-2">
                        Fotos enviadas: {challenge.photos.length}
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {challenge.photos.slice(0, 3).map((photo, index) => (
                          <View
                            key={index}
                            className="w-16 h-16 bg-border rounded-lg items-center justify-center"
                          >
                            <Text className="text-muted text-xs">📷</Text>
                          </View>
                        ))}
                        {challenge.photos.length > 3 && (
                          <View className="w-16 h-16 bg-border rounded-lg items-center justify-center">
                            <Text className="text-muted text-xs">
                              +{challenge.photos.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ==================== MODAL DE ALERTAS DE PRESSÃO ====================

interface PressureAlertsModalProps {
  visible: boolean;
  onClose: () => void;
  alerts: PressureAlert[];
}

export function PressureAlertsModal({ visible, onClose, alerts }: PressureAlertsModalProps) {
  const colors = useColors();

  const getClassificationColor = (classification: string) => {
    if (classification.includes("hipertensao") || classification.includes("crítica")) {
      return "#EF4444";
    } else if (classification.includes("pre-hipertensao") || classification.includes("elevada")) {
      return "#F59E0B";
    }
    return "#10B981";
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case "normal":
        return "Normal";
      case "pre-hipertensao":
        return "Pré-Hipertensão";
      case "hipertensao":
        return "Hipertensão";
      default:
        return classification;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Header */}
          <View className="p-6 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground text-2xl font-bold">
                  Alertas de Pressão Arterial
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {alerts.length} alerta{alerts.length !== 1 ? "s" : ""} registrado{alerts.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                className="bg-surface p-3 rounded-full"
              >
                <Text className="text-foreground text-lg font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Alertas */}
          <ScrollView className="flex-1 p-6">
            {alerts.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-muted text-center">
                  Nenhum alerta de pressão arterial
                </Text>
              </View>
            ) : (
              alerts.map((alert) => (
                <View
                  key={alert.id}
                  className="bg-surface p-4 rounded-lg mb-3"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: getClassificationColor(alert.classification),
                  }}
                >
                  {/* Cabeçalho */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-lg">
                        {alert.employeeName}
                      </Text>
                      <Text className="text-muted text-sm">
                        Matrícula: {alert.employeeMatricula}
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: getClassificationColor(alert.classification) + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getClassificationColor(alert.classification) }}
                      >
                        {getClassificationLabel(alert.classification)}
                      </Text>
                    </View>
                  </View>

                  {/* Pressão Atual */}
                  <View className="mb-2">
                    <Text className="text-muted text-xs mb-1">Última medição:</Text>
                    <Text className="text-foreground font-bold text-2xl">
                      {alert.systolic}/{alert.diastolic} <Text className="text-sm">mmHg</Text>
                    </Text>
                  </View>

                  {/* Data */}
                  <Text className="text-muted text-xs mb-3">
                    Medido em: {alert.date}
                  </Text>

                  {/* Histórico */}
                  {alert.history.length > 0 && (
                    <View className="mt-2 pt-2 border-t border-border">
                      <Text className="text-muted text-xs mb-2">
                        Histórico (últimos 7 dias):
                      </Text>
                      {alert.history.slice(0, 3).map((record, index) => (
                        <View key={index} className="flex-row justify-between py-1">
                          <Text className="text-muted text-xs">{record.date}</Text>
                          <Text className="text-foreground text-xs font-semibold">
                            {record.systolic}/{record.diastolic} mmHg
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ==================== MODAL DE CHECK-INS ====================

interface CheckInsModalProps {
  visible: boolean;
  onClose: () => void;
  checkIns: CheckInRecord[];
}

export function CheckInsModal({ visible, onClose, checkIns }: CheckInsModalProps) {
  const colors = useColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "bem":
        return "#10B981";
      case "dor_leve":
        return "#F59E0B";
      case "dor_forte":
        return "#EF4444";
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "bem":
        return "Bem";
      case "dor_leve":
        return "Dor Leve";
      case "dor_forte":
        return "Dor Forte";
      default:
        return status;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "bem":
        return "😊";
      case "dor_leve":
        return "😐";
      case "dor_forte":
        return "😣";
      default:
        return "❓";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Header */}
          <View className="p-6 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground text-2xl font-bold">
                  Check-ins de Hoje
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""} realizado{checkIns.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                className="bg-surface p-3 rounded-full"
              >
                <Text className="text-foreground text-lg font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Check-ins */}
          <ScrollView className="flex-1 p-6">
            {checkIns.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-muted text-center">
                  Nenhum check-in realizado hoje
                </Text>
              </View>
            ) : (
              checkIns.map((checkIn) => (
                <View
                  key={checkIn.id}
                  className="bg-surface p-4 rounded-lg mb-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: getStatusColor(checkIn.status) }}
                >
                  {/* Cabeçalho */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-lg">
                        {checkIn.employeeName}
                      </Text>
                      <Text className="text-muted text-sm">
                        Matrícula: {checkIn.employeeMatricula}
                      </Text>
                    </View>
                    <Text className="text-4xl">{getStatusEmoji(checkIn.status)}</Text>
                  </View>

                  {/* Status */}
                  <View className="flex-row items-center mb-2">
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getStatusColor(checkIn.status) + "20" }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getStatusColor(checkIn.status) }}
                      >
                        {getStatusLabel(checkIn.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Notas */}
                  {checkIn.notes && (
                    <View className="mb-2">
                      <Text className="text-muted text-xs mb-1">Observações:</Text>
                      <Text className="text-foreground text-sm">{checkIn.notes}</Text>
                    </View>
                  )}

                  {/* Horário */}
                  <Text className="text-muted text-xs mt-2">
                    Horário: {checkIn.time}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
