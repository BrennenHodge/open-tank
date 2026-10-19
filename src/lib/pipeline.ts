import { create } from "zustand";
import { persist } from "zustand/middleware";

type Row = { note: string; ours: boolean };

type Book = {
  rows: Record<string, Row>;
  setNote: (id: string, note: string) => void;
  setOurs: (id: string, ours: boolean) => void;
};

function rowOf(rows: Record<string, Row>, id: string): Row {
  return rows[id] ?? { note: "", ours: false };
}

export const usePipeline = create<Book>()(
  persist(
    (set) => ({
      rows: {},
      setNote: (id, note) =>
        set((state) => ({
          rows: { ...state.rows, [id]: { ...rowOf(state.rows, id), note } },
        })),
      setOurs: (id, ours) =>
        set((state) => ({
          rows: { ...state.rows, [id]: { ...rowOf(state.rows, id), ours } },
        })),
    }),
    { name: "open-tank-book" },
  ),
);

export function noteOf(rows: Record<string, Row>, id: string): string {
  return rows[id]?.note ?? "";
}

export function oursOf(rows: Record<string, Row>, id: string): boolean {
  return rows[id]?.ours ?? false;
}

export function quoteMail(place: { name: string; person?: string; email?: string }): string {
  const person = place.person?.trim() ?? "";
  const email = place.email?.trim() ?? "";
  const to = email.includes("@") ? email : "";
  const hello = person ? `Hello ${person},` : "Hello,";
  const subject = `A fuel quote for ${place.name}`;
  const body = [
    hello,
    "",
    "This is GPM Empire in Purvis. We sell wholesale fuel.",
    "",
    `If you would like a quote for fuel at ${place.name}, we can put one together.`,
    "",
    "GPM Empire",
    "Wholesale fuel",
    "Purvis, Mississippi",
  ].join("\n");
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
