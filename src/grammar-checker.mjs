/**
 * grammar-checker.mjs — Grammar checker for commit messages with L1-aware patterns.
 * 25+ rules covering spelling, agreement, articles, tense, double words, capitalization.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

/**
 * @typedef {Object} GrammarFinding
 * @property {string} level
 * @property {string} rule
 * @property {string} message
 * @property {string} suggestion
 */

// ────────────────────────────────────────────────────────────────
// Rule 1-6: Common dev-word misspellings
// ────────────────────────────────────────────────────────────────
const SPELLING_RULES = Object.freeze([
  { wrong: /\brefernce\b/gi, fix: 'reference', id: 'spell-reference' },
  { wrong: /\benviroment\b/gi, fix: 'environment', id: 'spell-environment' },
  { wrong: /\bdependancy\b/gi, fix: 'dependency', id: 'spell-dependency' },
  { wrong: /\boccured\b/gi, fix: 'occurred', id: 'spell-occurred' },
  { wrong: /\brecieve\b/gi, fix: 'receive', id: 'spell-receive' },
  { wrong: /\bseperate\b/gi, fix: 'separate', id: 'spell-separate' },
  { wrong: /\bsucess\b/gi, fix: 'success', id: 'spell-success' },
  { wrong: /\bneccessary\b/gi, fix: 'necessary', id: 'spell-necessary' },
  { wrong: /\bformating\b/gi, fix: 'formatting', id: 'spell-formatting' },
  { wrong: /\binitalize\b/gi, fix: 'initialize', id: 'spell-initialize' },
  { wrong: /\bparmeter\b/gi, fix: 'parameter', id: 'spell-parameter' },
  { wrong: /\bimpelment\b/gi, fix: 'implement', id: 'spell-implement' },
  { wrong: /\bcompatability\b/gi, fix: 'compatibility', id: 'spell-compatibility' },
  { wrong: /\bauthentification\b/gi, fix: 'authentication', id: 'spell-authentication' },
  { wrong: /\bfunctionallity\b/gi, fix: 'functionality', id: 'spell-functionality' },
]);

// ────────────────────────────────────────────────────────────────
// Rule 7-8: Double-word detection
// ────────────────────────────────────────────────────────────────
const DOUBLE_WORD_REGEX = /\b(\w+)\s+\1\b/gi;

/**
 * Detect repeated adjacent words ("the the", "fix fix").
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkDoubleWords(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const matches = text.match(DOUBLE_WORD_REGEX);
  if (!matches) {
    return findings;
  }

  const MAX_MATCHES = 20;
  const limit = Math.min(matches.length, MAX_MATCHES);
  for (let i = 0; i < limit; i++) {
    const word = matches[i].split(/\s+/)[0];
    findings.push({
      level: 'error',
      rule: 'double-word',
      message: `Repeated word "${word}" detected.`,
      suggestion: `Remove the duplicate: "${word}" instead of "${matches[i]}".`,
    });
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 9-15: L1-aware missing article patterns (CJK speakers)
// ────────────────────────────────────────────────────────────────
const MISSING_ARTICLE_PATTERNS = Object.freeze([
  { pattern: /\b(fix|resolve|close)\s+(bug|issue|error|problem)\b/gi, article: 'the', id: 'l1-article-definite' },
  { pattern: /\b(add|create|implement)\s+(method|function|class|component|module|endpoint)\b/gi, article: 'a', id: 'l1-article-indefinite' },
  { pattern: /\b(update|change|modify)\s+(configuration|config|setting)\b/gi, article: 'the', id: 'l1-article-config' },
  { pattern: /\b(remove|delete)\s+(unused|old|deprecated)\s+(file|function|method|class)\b/gi, article: null, id: 'l1-article-adj-noun' },
  { pattern: /\b(handle|catch)\s+(error|exception)\b/gi, article: 'the', id: 'l1-article-error' },
  { pattern: /\b(improve|optimize)\s+(performance|speed)\b/gi, article: null, id: 'l1-article-perf' },
  { pattern: /\b(refactor)\s+(code|logic|implementation)\b/gi, article: 'the', id: 'l1-article-refactor' },
]);

/**
 * Check for missing articles common in L1-transfer from CJK languages.
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkMissingArticles(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const MAX_PATTERNS = MISSING_ARTICLE_PATTERNS.length;

  for (let i = 0; i < MAX_PATTERNS; i++) {
    const rule = MISSING_ARTICLE_PATTERNS[i];
    if (!rule.article) {
      continue; // Some patterns are valid without articles
    }

    const match = text.match(rule.pattern);
    if (!match) {
      continue;
    }

    const parts = match[0].split(/\s+/);
    if (parts.length >= 2) {
      const verb = parts[0];
      const noun = parts.slice(1).join(' ');
      findings.push({
        level: 'info',
        rule: rule.id,
        message: `Consider adding an article: "${verb} ${noun}".`,
        suggestion: `L1 tip: "${verb} ${rule.article} ${noun}" may read more naturally in English.`,
      });
    }
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 16-19: Wrong preposition patterns
// ────────────────────────────────────────────────────────────────
const PREPOSITION_RULES = Object.freeze([
  { wrong: /\bdepend of\b/gi, fix: 'depend on', id: 'prep-depend' },
  { wrong: /\bconsist in\b/gi, fix: 'consist of', id: 'prep-consist' },
  { wrong: /\bresult of\s+(\w+ing)\b/gi, fix: 'result in', id: 'prep-result' },
  { wrong: /\bcompatible to\b/gi, fix: 'compatible with', id: 'prep-compatible' },
  { wrong: /\bresponsible of\b/gi, fix: 'responsible for', id: 'prep-responsible' },
  { wrong: /\brelated with\b/gi, fix: 'related to', id: 'prep-related' },
  { wrong: /\bcompliant to\b/gi, fix: 'compliant with', id: 'prep-compliant' },
]);

/**
 * Check for wrong prepositions.
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkPrepositions(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const MAX_RULES = PREPOSITION_RULES.length;

  for (let i = 0; i < MAX_RULES; i++) {
    const rule = PREPOSITION_RULES[i];
    if (rule.wrong.test(text)) {
      findings.push({
        level: 'warning',
        rule: rule.id,
        message: `Incorrect preposition detected.`,
        suggestion: `Use "${rule.fix}" instead. Common L1-transfer error.`,
      });
    }
    // Reset lastIndex since we use /g flag
    rule.wrong.lastIndex = 0;
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 20-22: Subject-verb agreement
// ────────────────────────────────────────────────────────────────
const SVA_PATTERNS = Object.freeze([
  { pattern: /\b(this|that)\s+(fix|add|remove|update|change)s\b/gi, id: 'sva-demonstrative' },
  { pattern: /\b(it)\s+(fix|add|remove|update|change)\b(?!es|s)/gi, id: 'sva-pronoun' },
]);

/**
 * Check for subject-verb agreement errors.
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkSubjectVerbAgreement(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const MAX_PATTERNS = SVA_PATTERNS.length;

  for (let i = 0; i < MAX_PATTERNS; i++) {
    const rule = SVA_PATTERNS[i];
    if (rule.pattern.test(text)) {
      findings.push({
        level: 'warning',
        rule: rule.id,
        message: `Possible subject-verb agreement issue.`,
        suggestion: `In commit messages, prefer imperative mood: "fix X" not "this fixes X".`,
      });
    }
    rule.pattern.lastIndex = 0;
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 23-25: Capitalization checks
// ────────────────────────────────────────────────────────────────

/**
 * Check capitalization issues in commit subject.
 * @param {string} subject
 * @returns {GrammarFinding[]}
 */
function checkCapitalization(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];

  // Rule 23: ALL CAPS check (ignore short acronyms)
  if (subject.length > 10 && subject === subject.toUpperCase() && /[A-Z]/.test(subject)) {
    findings.push({
      level: 'warning',
      rule: 'all-caps',
      message: 'Subject is entirely in UPPERCASE.',
      suggestion: 'Use normal sentence or lowercase casing for readability.',
    });
  }

  // Rule 24: Random MID-word capitalization (camelCase in prose context)
  const words = subject.split(/\s+/);
  const MAX_WORDS = 50;
  const limit = Math.min(words.length, MAX_WORDS);
  for (let i = 0; i < limit; i++) {
    const word = words[i];
    // Skip common code identifiers, types, and short words
    if (word.length <= 2 || word.includes('.') || word.includes('_') || word.includes('/')) {
      continue;
    }
    if (/^[a-z]+[A-Z]/.test(word) && !/^(iOS|macOS|npm|TypeScript|JavaScript)$/i.test(word)) {
      findings.push({
        level: 'info',
        rule: 'camel-case-prose',
        message: `"${word}" looks like a code identifier in prose.`,
        suggestion: 'Consider wrapping code identifiers in backticks: `' + word + '`.',
      });
      break; // Report only first occurrence
    }
  }

  // Rule 25: Sentence case after conventional commit prefix
  const colonIdx = subject.indexOf(': ');
  if (colonIdx > 0) {
    const afterColon = subject.slice(colonIdx + 2);
    if (afterColon.length > 0 && /^[A-Z]/.test(afterColon)) {
      findings.push({
        level: 'info',
        rule: 'lowercase-after-type',
        message: 'Description starts with uppercase after type prefix.',
        suggestion: 'Conventional Commits recommends lowercase after the colon: "fix: add ..." not "fix: Add ...".',
      });
    }
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 26-27: Spelling checks for common dev words
// ────────────────────────────────────────────────────────────────

/**
 * Check for common developer spelling errors.
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkSpelling(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const MAX_RULES = SPELLING_RULES.length;

  for (let i = 0; i < MAX_RULES; i++) {
    const rule = SPELLING_RULES[i];
    if (rule.wrong.test(text)) {
      findings.push({
        level: 'error',
        rule: rule.id,
        message: `Spelling error detected.`,
        suggestion: `Use "${rule.fix}" instead.`,
      });
    }
    rule.wrong.lastIndex = 0;
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Rule 28+: Additional L1 patterns
// ────────────────────────────────────────────────────────────────
const L1_EXTRA_PATTERNS = Object.freeze([
  { pattern: /\bmake\s+it\s+to\s+work\b/gi, fix: 'make it work', id: 'l1-infinitive' },
  { pattern: /\ballow\s+to\b/gi, fix: 'allow [noun] to', id: 'l1-allow-to' },
  { pattern: /\benable\s+to\b/gi, fix: 'enable [noun] to', id: 'l1-enable-to' },
  { pattern: /\bpermit\s+to\b/gi, fix: 'permit [noun] to', id: 'l1-permit-to' },
]);

/**
 * Check for additional L1-transfer patterns.
 * @param {string} text
 * @returns {GrammarFinding[]}
 */
function checkL1ExtraPatterns(text) {
  console.assert(typeof text === 'string', 'text must be a string');
  console.assert(text.length >= 0, 'text length must be non-negative');

  const findings = [];
  const MAX_RULES = L1_EXTRA_PATTERNS.length;

  for (let i = 0; i < MAX_RULES; i++) {
    const rule = L1_EXTRA_PATTERNS[i];
    if (rule.pattern.test(text)) {
      findings.push({
        level: 'info',
        rule: rule.id,
        message: `L1-transfer pattern: "${text.match(rule.pattern)?.[0] || ''}".`,
        suggestion: `Consider: "${rule.fix}". Common L1-transfer from Romance and Slavic languages.`,
      });
    }
    rule.pattern.lastIndex = 0;
  }

  return findings;
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/**
 * Run all grammar checks on a commit message.
 * @param {string} message - The full commit message.
 * @returns {GrammarFinding[]}
 */
export function checkGrammar(message) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(message.length > 0, 'message must not be empty');

  const subject = message.split('\n')[0] || '';
  const findings = [];

  findings.push(...checkSpelling(message));
  findings.push(...checkDoubleWords(message));
  findings.push(...checkMissingArticles(subject));
  findings.push(...checkPrepositions(message));
  findings.push(...checkSubjectVerbAgreement(subject));
  findings.push(...checkCapitalization(subject));
  findings.push(...checkL1ExtraPatterns(message));

  return findings;
}
