import { create } from "zustand";
import { persist } from "zustand/middleware";

export const STAGES = ["New", "Called", "Quoted", "Won", "Parked"] as const;
export type Stage = (typeof STAGES)[number];

type Row = { stage: Stage; note: string };

type Pipeline = {
  rows: Record<string, Row>;
  setStage: (id: string, stage: Stage) => void;
  setNote: (id: string, note: string) => void;
};

export const usePipeline = create<Pipeline>()(
  persist(
    (set) => ({
      rows: {},
      setStage: (id, stage) =>
        set((state) => ({
          rows: {
            ...state.rows,
            [id]: { stage, note: state.rows[id]?.note ?? "" },
          },
        })),
      setNote: (id, note) =>
        set((state) => ({
          rows: {
            ...state.rows,
            [id]: { stage: state.rows[id]?.stage ?? "New", note },
          },
        })),
    }),
    { name: "open-tank-book" },
  ),
);

export function stageOf(rows: Record<string, Row>, id: string): Stage {
  return rows[id]?.stage ?? "New";
}

export function noteOf(rows: Record<string, Row>, id: string): string {
  return rows[id]?.note ?? "";
}
