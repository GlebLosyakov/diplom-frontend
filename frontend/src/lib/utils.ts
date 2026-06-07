import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtPct(v: number | null | undefined, digits = 2) {
  if (v === null || v === undefined || isNaN(v as number)) return "—";
  return `${Number(v).toFixed(digits)}%`;
}
