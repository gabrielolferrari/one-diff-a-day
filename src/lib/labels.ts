import type { Category, Level, Severity, Verdict } from '../types';

export const LEVELS: Record<Level, { label: string; minutes: string; effort: string; energy: number }> = {
  light: {
    label: 'Leve',
    minutes: '~5 min',
    effort: 'Um problema principal, num diff curto. Cabe num dia cansado.',
    energy: 1,
  },
  challenger: {
    label: 'Challenger',
    minutes: '30+ min',
    effort: 'Vários problemas de gravidades diferentes, alguns fora das linhas alteradas.',
    energy: 4,
  },
};

export const CATEGORIES: Record<Category, string> = {
  bug: 'Bug',
  security: 'Segurança',
  performance: 'Performance',
  design: 'Design',
  tests: 'Testes',
  readability: 'Legibilidade',
  nit: 'Nit',
};

export const SEVERITIES: Record<Severity, string> = {
  low: 'baixa',
  medium: 'média',
  high: 'alta',
};

export const VERDICTS: Record<Verdict, { label: string; hint: string }> = {
  comment: {
    label: 'Comentar',
    hint: 'Feedback geral, sem aprovar nem bloquear.',
  },
  approve: {
    label: 'Aprovar',
    hint: 'Pode ir para produção como está.',
  },
  request_changes: {
    label: 'Solicitar alterações',
    hint: 'Precisa de ajustes antes do merge.',
  },
};

export const LANGUAGES: Record<string, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  go: 'Go',
  java: 'Java',
  csharp: 'C#',
  kotlin: 'Kotlin',
  rust: 'Rust',
  sql: 'SQL',
};

export function languageLabel(id: string): string {
  return LANGUAGES[id] ?? id;
}
