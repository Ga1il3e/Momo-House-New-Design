import {
  reservationLabel,
  reservationTone,
  type ReservationStatus,
} from "@/lib/status";

const TONE: Record<string, string> = {
  amber: "bg-amber/20 text-amber-deep",
  green: "bg-open/20 text-open-text",
  ink: "bg-bistro/10 text-ink",
  muted: "bg-paper-muted text-ink-muted",
  "burgundy-outline": "border border-burgundy text-burgundy",
  red: "bg-burgundy/15 text-burgundy",
};

export function StatusPill({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-label text-[11px] font-bold uppercase tracking-wide ${TONE[reservationTone(status)]}`}
    >
      {reservationLabel(status)}
    </span>
  );
}
