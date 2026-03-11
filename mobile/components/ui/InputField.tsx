import React from "react";
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function InputField({
  label,
  error,
  required = false,
  className,
  ...props
}: InputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`
          border rounded-xl px-4 py-3 text-base text-gray-900 bg-white
          ${error ? "border-red-400" : "border-gray-300"}
          ${props.editable === false ? "bg-gray-50 text-gray-500" : ""}
          ${className ?? ""}
        `}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
}
