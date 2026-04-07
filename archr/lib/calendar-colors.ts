// Deterministic pastel palette for events that have no user-assigned color
export const PASTEL_PALETTE = [
  { bg: "#EEF0FF", border: "#C4C9F5", text: "#3730A3" }, // periwinkle
  { bg: "#F0F9FF", border: "#BAE0FD", text: "#0369A1" }, // sky
  { bg: "#F5F3FF", border: "#D4CAFC", text: "#5B21B6" }, // violet
  { bg: "#FFF7ED", border: "#FED7AA", text: "#92400E" }, // amber
  { bg: "#FFF1F2", border: "#FFC9CE", text: "#9F1239" }, // rose
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#14532D" }, // green
] as const;

export function getPastelColor(seed: string): { bg: string; border: string; text: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return PASTEL_PALETTE[Math.abs(h) % PASTEL_PALETTE.length];
}

export const EVENT_COLOR_OPTIONS = [
  { id: "1", label: "Lavender", hex: "#7986cb" },
  { id: "2", label: "Sage", hex: "#33b679" },
  { id: "3", label: "Grape", hex: "#8e24aa" },
  { id: "4", label: "Flamingo", hex: "#e67c73" },
  { id: "5", label: "Banana", hex: "#f6c026" },
  { id: "6", label: "Tangerine", hex: "#f5511d" },
  { id: "7", label: "Peacock", hex: "#039be5" },
  { id: "8", label: "Graphite", hex: "#616161" },
  { id: "9", label: "Blueberry", hex: "#3f51b5" },
  { id: "10", label: "Basil", hex: "#0b8043" },
  { id: "11", label: "Tomato", hex: "#d60000" },
] as const;

export const EVENT_COLOR_BY_ID = Object.fromEntries(
  EVENT_COLOR_OPTIONS.map((item) => [item.id, item]),
);

export function withOpacity(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
