export type Level = 'light' | 'challenger';

export type Category =
  | 'bug'
  | 'security'
  | 'performance'
  | 'design'
  | 'tests'
  | 'readability'
  | 'nit';

export type Severity = 'low' | 'medium' | 'high';

export interface PlantedIssue {
  location: string;
  category: Category;
  severity: Severity;
  description: string;
}

export interface ChallengeFile {
  path: string;
  /** Unified diff hunks, starting at the first `@@` header. */
  diff: string;
}

export interface Challenge {
  id: string;
  level: Level;
  /** highlight.js language id. */
  language: string;
  title: string;
  author: string;
  branch: string;
  /** Lightweight markdown: `## ` headings, `- ` lists and inline code. */
  description: string;
  files: ChallengeFile[];
  plantedIssues: PlantedIssue[];
  /** Three progressive hints, vaguest first. */
  hints: string[];
}

export interface DiffLine {
  kind: 'hunk' | 'context' | 'add' | 'del';
  content: string;
  oldNo?: number;
  newNo?: number;
}

export interface ReviewComment {
  id: string;
  fileIndex: number;
  /** Inclusive indexes into the parsed diff lines of the file. */
  start: number;
  end: number;
  body: string;
  category?: Category;
}

export type Verdict = 'comment' | 'approve' | 'request_changes';

export interface ReviewDraft {
  comments: ReviewComment[];
  summary: string;
  verdict: Verdict;
  /** Optional because drafts saved before hints existed lack it. */
  hintsUsed?: number;
}