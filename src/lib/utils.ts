import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
}

export const isNumericText = (value: string): boolean => {
  // Strictly match numeric strings (e.g., "0", "123", "0.0", "123.456")
  return /^\d+(\.\d+)?$/.test(value.trim());
};

export const parseTextValue = (value: string): number | string => {
  // Check if the value is a valid number
  if (isNumericText(value)) {
    return parseFloat(value);
  }
  // If not, return the original string
  return value;
}