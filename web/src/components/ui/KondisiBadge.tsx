import { KONDISI_COLOR, KONDISI_LABEL, type Kondisi } from "@/types";

export default function KondisiBadge({ kondisi }: { kondisi: Kondisi }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `${KONDISI_COLOR[kondisi]}22`,
        color: KONDISI_COLOR[kondisi],
      }}
    >
      {KONDISI_LABEL[kondisi]}
    </span>
  );
}
