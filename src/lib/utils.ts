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

export function chooseFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files ? input.files[0] : null;
      resolve(file);
    };
    input.click();
  });
}