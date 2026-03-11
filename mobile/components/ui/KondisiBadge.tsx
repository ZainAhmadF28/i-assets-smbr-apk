import React from "react";
import { View, Text } from "react-native";
import type { Kondisi } from "@shared-types/index";
import { KONDISI_LABEL } from "@shared-types/index";

interface KondisiBadgeProps {
  kondisi: Kondisi;
}

const badgeStyles: Record<Kondisi, string> = {
  BAIK:        "bg-green-100 text-green-700",
  RUSAK:       "bg-amber-100 text-amber-700",
  RUSAK_BERAT: "bg-red-100 text-red-700",
};

export default function KondisiBadge({ kondisi }: KondisiBadgeProps) {
  return (
    <View className={`px-3 py-1 rounded-full self-start ${badgeStyles[kondisi]}`}>
      <Text className={`text-xs font-semibold ${badgeStyles[kondisi]}`}>
        {KONDISI_LABEL[kondisi]}
      </Text>
    </View>
  );
}
