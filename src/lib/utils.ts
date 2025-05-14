import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
}

export const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value));
};
