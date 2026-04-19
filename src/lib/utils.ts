import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns today's date as a YYYY-MM-DD string. */
export function getTodayDateString(): string {
  const now = new Date();
  return toDateString(now);
}

/** Returns a Date as a YYYY-MM-DD string. */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Video status badge CSS classes. */
export function videoStatusBadgeClass(status: string): string {
  return cn(
    'text-[9px] px-2 py-0.5 rounded uppercase font-bold',
    status === 'Analysis Ready' && 'bg-tertiary/10 text-tertiary',
    status === 'Uncut' && 'bg-surface-container-highest text-on-surface-variant',
    status === 'Edited' && 'bg-secondary/10 text-secondary',
  );
}

/** Complete goalkeeper category labels (translation keys). */
export const CATEGORY_LABEL_KEYS: Record<string, string> = {
  firstTeam: 'firstTeam',
  u23: 'u23',
  u21: 'u21',
  u18: 'u18',
  u16: 'u16',
  academy: 'academy',
};

/** Complete goalkeeper status labels (translation keys). */
export const STATUS_LABEL_KEYS: Record<string, string> = {
  Ready: 'ready',
  'Minor Strain': 'minorStrain',
  'In Training': 'inTraining',
  Injured: 'injured',
};
