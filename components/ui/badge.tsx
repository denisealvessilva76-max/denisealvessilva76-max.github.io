import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { PressureClassification } from "@/lib/types";

export interface BadgeProps extends ViewProps {
  variant?: "default" | "success" | "warning" | "error";
  label: string;
}

const variantStyles = {
  default: "bg-surface border border-border",
  success: "bg-success/10 border border-success",
  warning: "bg-warning/10 border border-warning",
  error: "bg-error/10 border border-error",
};

const textVariantStyles = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export function Badge({ variant = "default", label, className, ...props }: BadgeProps) {
  return (
    <View
      className={cn(
        "px-3 py-1 rounded-full inline-flex items-center justify-center",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Text className={cn("text-xs font-semibold", textVariantStyles[variant])}>
        {label}
      </Text>
    </View>
  );
}

export function getPressureBadgeVariant(classification: PressureClassification) {
  switch (classification) {
    case "normal":
      return "success";
    case "pre-hipertensao":
      return "warning";
    case "hipertensao":
      return "error";
    default:
      return "default";
  }
}

export function getPressureLabel(classification: PressureClassification) {
  switch (classification) {
    case "normal":
      return "Normal";
    case "pre-hipertensao":
      return "Pré-hipertensão";
    case "hipertensao":
      return "Hipertensão";
    default:
      return "Desconhecido";
  }
}
