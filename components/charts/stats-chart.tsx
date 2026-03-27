import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useColors } from '@/hooks/use-colors';

const screenWidth = Dimensions.get('window').width;

export interface StatsChartProps {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any;
  height?: number;
  showLegend?: boolean;
}

export function StatsChart({
  type,
  title,
  data,
  height = 220,
  showLegend = true,
}: StatsChartProps) {
  const colors = useColors();

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: () => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 12,
      fill: colors.foreground,
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: colors.border,
      strokeWidth: 0.5,
    },
  };

  return (
    <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-foreground mb-3">{title}</Text>

      {type === 'line' && (
        <LineChart
          data={{
            labels: data.labels,
            datasets: data.datasets,
          }}
          width={screenWidth - 40}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      )}

      {type === 'bar' && (
        <BarChart
          data={{
            labels: data.labels,
            datasets: data.datasets,
          }}
          width={screenWidth - 40}
          height={height}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      )}

      {type === 'pie' && data.datasets[0] && (
        <View>
          <Text className="text-sm text-muted text-center">Gráfico de pizza</Text>
        </View>
      )}
    </View>
  );
}

// Componentes específicos para cada tipo de gráfico

export interface PointsChartProps {
  data: Array<{ day: string; points: number }>;
}

export function PointsChart({ data }: PointsChartProps) {
  const chartData: any = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.points),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <StatsChart
      type="line"
      title="Evolução de Pontos (Últimos 30 dias)"
      data={chartData}
      height={250}
    />
  );
}

export interface HydrationChartProps {
  data: Array<{ day: string; cups: number; goal: number }>;
}

export function HydrationChart({ data }: HydrationChartProps) {
  const chartData: any = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.cups),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <StatsChart
      type="line"
      title="Hidratação Semanal (Copos)"
      data={chartData}
      height={220}
    />
  );
}

export interface PressureChartProps {
  data: Array<{ day: string; systolic: number; diastolic: number }>;
}

export function PressureChart({ data }: PressureChartProps) {
  const chartData: any = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.systolic),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.map((d) => d.diastolic),
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <StatsChart
      type="line"
      title="Pressão Arterial (Tendência)"
      data={chartData}
      height={250}
    />
  );
}

export interface ComparisonChartProps {
  userValue: number;
  averageValue: number;
  label: string;
  unit: string;
}

export function ComparisonChart({
  userValue,
  averageValue,
  label,
  unit,
}: ComparisonChartProps) {
  const chartData: any = {
    labels: ['Você', 'Média Geral'],
    datasets: [
      {
        data: [userValue, averageValue],
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
      },
    ],
  };

  return (
    <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-foreground mb-2">{label}</Text>
      <View className="flex-row justify-around mb-4">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">
            {userValue.toFixed(1)}
          </Text>
          <Text className="text-sm text-muted">Você</Text>
          <Text className="text-xs text-muted">{unit}</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-success">
            {averageValue.toFixed(1)}
          </Text>
          <Text className="text-sm text-muted">Média</Text>
          <Text className="text-xs text-muted">{unit}</Text>
        </View>
      </View>
      <StatsChart
        type="bar"
        title=""
        data={chartData}
        height={150}
        showLegend={false}
      />
    </View>
  );
}
