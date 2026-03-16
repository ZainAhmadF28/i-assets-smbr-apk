import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:   { container: "bg-[#135d3a] active:bg-[#0f4a2e]", text: "text-white font-semibold" },
  secondary: { container: "bg-gray-100 active:bg-gray-200 border border-gray-300", text: "text-gray-700 font-semibold" },
  danger:    { container: "bg-red-600 active:bg-red-700", text: "text-white font-semibold" },
  ghost:     { container: "active:bg-gray-100", text: "text-[#135d3a] font-semibold" },
};

export default function Button({
  title,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center px-4 py-3 rounded-xl
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
        ${className ?? ""}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#fff" : "#135d3a"}
          className="mr-2"
        />
      )}
      <Text className={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
