import { useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", visible, onHide, duration = 3000 }: ToastProps) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-green-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      default:
        return "✅";
    }
  };

  return (
    <Animated.View
      style={{
        opacity,
        position: "fixed",
        top: 80,
        left: 16,
        right: 16,
        zIndex: 99999,
        elevation: 999,
      }}
    >
      <View
        className={cn(
          "flex-row items-center gap-3 p-4 rounded-lg shadow-lg",
          getBackgroundColor()
        )}
      >
        <Text style={{ fontSize: 20 }}>{getIcon()}</Text>
        <Text className="flex-1 text-white font-semibold">{message}</Text>
      </View>
    </Animated.View>
  );
}
