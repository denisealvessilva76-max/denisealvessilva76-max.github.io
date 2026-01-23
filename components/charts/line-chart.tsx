import { View, Text, Dimensions } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { useColors } from "@/hooks/use-colors";

interface LineChartProps {
  data: { x: number; y: number }[];
  title: string;
  yLabel?: string;
  color?: string;
}

export function LineChart({ data, title, yLabel, color }: LineChartProps) {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 48, 380);


  return (
    <View className="bg-surface rounded-xl p-4 border border-border">
      <Text className="text-lg font-semibold text-foreground mb-1">{title}</Text>
      {yLabel && <Text className="text-sm text-muted mb-3">{yLabel}</Text>}
      
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["y"]}
        axisOptions={{
          tickCount: 5,
          labelColor: colors.muted,
          lineColor: colors.border,
        }}
      >
        {({ points }) => (
          <Line
            points={points.y}
            color={color || colors.primary}
            strokeWidth={3}
            curveType="monotoneX"
          />
        )}
      </CartesianChart>
    </View>
  );
}
