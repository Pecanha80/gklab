import { en } from './i18n/en';
import { pt } from './i18n/pt';

export const translations = { en, pt };

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
