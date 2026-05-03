/**
 * quality-checker.mjs — Commit message quality scorer.
 * Scores messages 0-100 based on clarity, specificity, and best practices.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

const VAGUE_WORDS = Object.freeze([
  'fix', 'update', 'change', 'modify', 'wip', 'stuff', 'things',
  'misc', 'minor', 'various', 'some', 'tweaks', 'cleanup', 'temp',
]);

const EMOJI_ONLY_REGEX = /^[\p{Emoji}\s]+$/u;
const ISSUE_REF_REGEX = /#\d+|[A-Z]+-\d+/;

/**
 * Check if the subject is vague or too generic.
 * @param {string} subject - The commit subject line.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkVagueMessages(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];
  const lower = subject.toLowerCase().trim();

  // Strip conventional commit prefix for content analysis
  const colonIdx = lower.indexOf(': ');
  const content = colonIdx >= 0 ? lower.slice(colonIdx + 2).trim() : lower;
  const contentWords = content.split(/\s+/).filter(Boolean);

  // Check if the entire content is just a single vague word
  if (contentWords.length === 1 && VAGUE_WORDS.includes(contentWords[0])) {
    findings.push({
      level: 'error',
      rule: 'vague-message',
      message: `Subject is too vague: "${contentWords[0]}".`,
      suggestion: 'Be specific about what was changed and why. E.g., "fix null pointer in user auth flow".',
    });
  }

  // Check for two-word vague combos like "fix bug", "update code"
  const VAGUE_COMBOS = Object.freeze([
    'fix bug', 'fix bugs', 'fix issue', 'fix error',
    'update code', 'update stuff', 'change things',
    'modify code', 'small fix', 'quick fix',
  ]);
  const MAX_COMBOS = VAGUE_COMBOS.length;
  for (let i = 0; i < MAX_COMBOS; i++) {
    if (content === VAGUE_COMBOS[i]) {
      findings.push({
        level: 'warning',
        rule: 'vague-combo',
        message: `Subject "${content}" is too generic.`,
        suggestion: 'Specify what bug, what code, or what issue. E.g., "fix race condition in payment webhook".',
      });
      break;
    }
  }

  return findings;
}

/**
 * Check minimum word count and structural quality.
 * @param {string} subject - The commit subject line.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkWordCount(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];

  // Strip conventional commit prefix
  const colonIdx = subject.indexOf(': ');
  const content = colonIdx >= 0 ? subject.slice(colonIdx + 2).trim() : subject.trim();
  const words = content.split(/\s+/).filter(Boolean);

  if (words.length < 3 && content.length > 0) {
    findings.push({
      level: 'warning',
      rule: 'min-words',
      message: `Subject has only ${words.length} word(s) — aim for 3+.`,
      suggestion: 'Add context: what component, what behavior, or why the change was needed.',
    });
  }

  return findings;
}

/**
 * Check for ALL CAPS and emoji-only subjects.
 * @param {string} subject - The commit subject line.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkFormatAbuse(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];

  if (subject.length > 5 && subject === subject.toUpperCase() && /[A-Z]/.test(subject)) {
    findings.push({
      level: 'warning',
      rule: 'all-caps-subject',
      message: 'Subject is entirely in UPPERCASE.',
      suggestion: 'Use normal casing for readability. ALL CAPS reads as shouting.',
    });
  }

  if (EMOJI_ONLY_REGEX.test(subject.trim()) && subject.trim().length > 0) {
    findings.push({
      level: 'error',
      rule: 'emoji-only',
      message: 'Subject contains only emojis with no descriptive text.',
      suggestion: 'Add a text description alongside or instead of emojis.',
    });
  }

  return findings;
}

/**
 * Check for issue references and provide encouragement.
 * @param {string} message - The full commit message.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkIssueReference(message) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(message.length >= 0, 'message length must be non-negative');

  const findings = [];

  if (!ISSUE_REF_REGEX.test(message)) {
    findings.push({
      level: 'info',
      rule: 'issue-reference',
      message: 'No issue reference found (#123 or PROJ-456).',
      suggestion: 'Consider linking to an issue for traceability. E.g., "fix: resolve auth timeout (#42)".',
    });
  }

  return findings;
}

/**
 * Calculate a quality score from 0-100.
 * @param {string} message - The full commit message.
 * @returns {number}
 */
function calculateScore(message) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(message.length > 0, 'message must not be empty');

  let score = 100;
  const subject = message.split('\n')[0] || '';

  // Strip conventional commit prefix
  const colonIdx = subject.indexOf(': ');
  const content = colonIdx >= 0 ? subject.slice(colonIdx + 2).trim() : subject.trim();
  const words = content.split(/\s+/).filter(Boolean);

  // Deductions
  if (words.length < 3) { score -= 15; }
  if (words.length < 2) { score -= 15; }
  if (VAGUE_WORDS.includes(content.toLowerCase())) { score -= 30; }
  if (subject.length > 72) { score -= 10; }
  if (EMOJI_ONLY_REGEX.test(subject.trim())) { score -= 40; }
  if (subject === subject.toUpperCase() && /[A-Z]/.test(subject)) { score -= 10; }
  if (!ISSUE_REF_REGEX.test(message)) { score -= 5; }

  // Bonuses
  const hasBody = message.split('\n').length > 2;
  if (hasBody) { score += 5; }
  if (ISSUE_REF_REGEX.test(message)) { score += 5; }
  if (words.length >= 5) { score += 5; }

  return Math.max(0, Math.min(100, score));
}

/**
 * Run all quality checks on a commit message.
 * @param {string} message - The full commit message.
 * @returns {{ score: number, findings: Array<{level: string, rule: string, message: string, suggestion: string}> }}
 */
export function checkQuality(message) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(message.length > 0, 'message must not be empty');

  const subject = message.split('\n')[0] || '';
  const findings = [];

  findings.push(...checkVagueMessages(subject));
  findings.push(...checkWordCount(subject));
  findings.push(...checkFormatAbuse(subject));
  findings.push(...checkIssueReference(message));

  const score = calculateScore(message);

  return { score, findings };
}
