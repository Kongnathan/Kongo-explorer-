import { fr } from "./fr";
import { en } from "./en";
import { SupportedLanguage, Translations, SUPPORTED_LANGUAGES, LanguageInfo } from "./types";

export * from "./types";
export { fr, en };

export const DICTIONARIES: Record<"fr" | "en", Translations> = {
  fr,
  en,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "fr";

export function getTranslations(lang: SupportedLanguage): Translations {
  if (lang === "en") return en;
  return fr;
}

export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return found || SUPPORTED_LANGUAGES[0];
}
