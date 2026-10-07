import { create } from "zustand";
import { persist } from "zustand/middleware";

export const STAGES = ["New", "Called", "Quoted", "Won", "Parked"] as const;
export type Stage = (typeof STAGES)[number];

type Row = { stage: Stage; note: string; ours: boolean };

type Pipeline = {
  rows: Record<string, Row>;
  setStage: (id: string, stage: Stage) => void;
  setNote: (id: string, note: string) => void;
  setOurs: (id: string, ours: boolean) => void;
};

function rowOf(rows: Record<string, Row>, id: string): Row {
  return rows[id] ?? { stage: "New", note: "", ours: false };
}

export const usePipeline = create<Pipeline>()(
  persist(
    (set) => ({
      rows: {},
      setStage: (id, stage) =>
        set((state) => ({
          rows: {
            ...state.rows,
            [id]: { ...rowOf(state.rows, id), stage },
          },
        })),
      setNote: (id, note) =>
        set((state) => ({
          rows: {
            ...state.rows,
            [id]: { ...rowOf(state.rows, id), note },
          },
        })),
      setOurs: (id, ours) =>
        set((state) => ({
          rows: {
            ...state.rows,
            [id]: { ...rowOf(state.rows, id), ours },
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

export function oursOf(rows: Record<string, Row>, id: string): boolean {
  return rows[id]?.ours ?? false;
}
