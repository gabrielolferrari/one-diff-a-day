import type { Challenge, ReviewDraft } from '../types';
import { markerFor, parseDiff, rangeLabel } from './diff';
import { CATEGORIES, LEVELS, SEVERITIES, VERDICTS, languageLabel } from './labels';

export function buildPrompt(challenge: Challenge, draft: ReviewDraft): string {
  const parsed = challenge.files.map((file) => parseDiff(file.diff));
  const language = languageLabel(challenge.language);

  const diff = challenge.files
    .map((file) => `--- a/${file.path}\n+++ b/${file.path}\n${file.diff.trim()}`)
    .join('\n\n');

  const comments = [...draft.comments]
    .sort((a, b) => a.fileIndex - b.fileIndex || a.start - b.start)
    .map((comment, i) => {
      const lines = parsed[comment.fileIndex];
      const path = challenge.files[comment.fileIndex].path;
      const category = comment.category ? ` [${CATEGORIES[comment.category]}]` : '';
      const snippet = lines
        .slice(comment.start, comment.end + 1)
        .map((line) => markerFor(line.kind) + line.content)
        .join('\n');
      return [
        `### ${i + 1}. \`${path}\`, ${rangeLabel(lines, comment.start, comment.end)}${category}`,
        '',
        'Trecho:',
        '```diff',
        snippet,
        '```',
        '',
        'Meu comentário:',
        comment.body.trim(),
      ].join('\n');
    });

  const planted = challenge.plantedIssues
    .map(
      (issue, i) =>
        `${i + 1}. [${CATEGORIES[issue.category]}, gravidade ${SEVERITIES[issue.severity]}] ${issue.location}: ${issue.description}`,
    )
    .join('\n');

  const hintsUsed = draft.hintsUsed ?? 0;
  const hints =
    hintsUsed > 0
      ? `Usei ${hintsUsed} de ${challenge.hints.length} dicas:\n\n${challenge.hints
          .slice(0, hintsUsed)
          .map((hint, i) => `${i + 1}. ${hint}`)
          .join('\n')}`
      : 'Não usei nenhuma dica.';

  return `Você é um engenheiro sênior atuando como mentor de code review. Estou praticando revisão de código com um desafio diário. O objetivo não é acertar tudo, é aprender. Seja honesto e específico, sem ser condescendente.

# O PR

**Título:** ${challenge.title}
**Linguagem:** ${language}
**Nível do desafio:** ${LEVELS[challenge.level].label}

**Descrição do autor:**

${challenge.description.trim()}

# Diff

\`\`\`diff
${diff}
\`\`\`

# Minha revisão

**Veredito:** ${VERDICTS[draft.verdict].label}
**Resumo:** ${draft.summary.trim() || '(sem resumo)'}

## Comentários nas linhas

${comments.length > 0 ? comments.join('\n\n') : '(não deixei comentários nas linhas)'}

## Dicas

${hints}

# Problemas plantados no desafio

Este PR foi gerado com problemas intencionais. Use a lista como referência para avaliar minha revisão, mas não se limite a ela:

${planted}

# O que eu quero de você

1. Para cada comentário meu: o ponto está correto? A sugestão de código resolve? Como eu poderia escrever de forma mais clara e acionável para o autor?
2. Quais problemas plantados eu encontrei e quais deixei passar. Para os que deixei passar, explique o problema, por que ele importa e como você escreveria o comentário.
3. Outros problemas reais que você encontrar e que não estão na lista.
4. Se o meu veredito faz sentido para o que foi encontrado.
5. Se houver algo idiomático de ${language} que alguém de outra stack não perceberia, explique rapidamente.
6. Se usei dicas, diga o que eu poderia ter observado sozinho para chegar lá sem elas.
7. Termine com um ou dois hábitos concretos para eu praticar nas próximas revisões.

Responda em português do Brasil.
`;
}
