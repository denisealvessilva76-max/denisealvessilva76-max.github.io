import { View, Text, Dimensions } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { useColors } from "@/hooks/use-colors";

const screenWidth = Dimensions.get("window").width - 64; // padding

interface HydrationChartProps {
  data: { day: string; value: number }[];
}

export function HydrationChart({ data }: HydrationChartProps) {
  const colors = useColors();

  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.value),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
    labelColor: (opacity = 1) => colors.muted,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-2">
        📊 Hidratação Média (7 dias)
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix="%"
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars
      />
    </View>
  );
}

interface PressureChartProps {
  data: { day: string; systolic: number; diastolic: number }[];
}

export function PressureChart({ data }: PressureChartProps) {
  const colors = useColors();

  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.systolic),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // red
        strokeWidth: 2,
      },
      {
        data: data.map((d) => d.diastolic),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue
        strokeWidth: 2,
      },
    ],
    legend: ["Sistólica", "Diastólica"],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.muted,
    labelColor: (opacity = 1) => colors.muted,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-2">
        💓 Evolução de Pressão Arterial (7 dias)
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}

interface ComplaintsChartProps {
  data: { name: string; count: number; color: string }[];
}

export function ComplaintsChart({ data }: ComplaintsChartProps) {
  const colors = useColors();

  const chartData = data.map((item) => ({
    name: item.name,
    population: item.count,
    color: item.color,
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.foreground,
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-2">
        📋 Distribuição de Queixas por Tipo
      </Text>
      <PieChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute
      />
    </View>
  );
}

interface CheckInsChartProps {
  data: { status: string; count: number }[];
}

export function CheckInsChart({ data }: CheckInsChartProps) {
  const colors = useColors();

  const chartData = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        data: data.map((d) => d.count),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // Verde para "Tudo bem", Amarelo para "Dor leve", Vermelho para "Dor forte"
      return `rgba(34, 197, 94, ${opacity})`;
    },
    labelColor: (opacity = 1) => colors.muted,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-2">
        ✅ Check-ins por Status (Hoje)
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars
      />
    </View>
  );
}
