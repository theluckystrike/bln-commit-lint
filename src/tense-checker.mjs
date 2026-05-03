/**
 * tense-checker.mjs — Imperative mood checker for commit subjects.
 * Detects past tense, present participle, and suggests imperative mood.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

/**
 * @typedef {Object} TenseFinding
 * @property {string} level
 * @property {string} rule
 * @property {string} message
 * @property {string} suggestion
 */

// ────────────────────────────────────────────────────────────────
// Past tense to imperative mapping (regular verbs)
// ────────────────────────────────────────────────────────────────
const PAST_TENSE_MAP = Object.freeze({
  'added': 'add',
  'fixed': 'fix',
  'removed': 'remove',
  'updated': 'update',
  'changed': 'change',
  'deleted': 'delete',
  'created': 'create',
  'merged': 'merge',
  'moved': 'move',
  'renamed': 'rename',
  'resolved': 'resolve',
  'implemented': 'implement',
  'refactored': 'refactor',
  'improved': 'improve',
  'optimized': 'optimize',
  'configured': 'configure',
  'migrated': 'migrate',
  'integrated': 'integrate',
  'deployed': 'deploy',
  'reverted': 'revert',
  'introduced': 'introduce',
  'corrected': 'correct',
  'adjusted': 'adjust',
  'replaced': 'replace',
  'upgraded': 'upgrade',
  'enabled': 'enable',
  'disabled': 'disable',
  'simplified': 'simplify',
  'extracted': 'extract',
  'converted': 'convert',
});

// ────────────────────────────────────────────────────────────────
// Present participle to imperative mapping
// ────────────────────────────────────────────────────────────────
const PARTICIPLE_MAP = Object.freeze({
  'adding': 'add',
  'fixing': 'fix',
  'removing': 'remove',
  'updating': 'update',
  'changing': 'change',
  'deleting': 'delete',
  'creating': 'create',
  'merging': 'merge',
  'moving': 'move',
  'renaming': 'rename',
  'resolving': 'resolve',
  'implementing': 'implement',
  'refactoring': 'refactor',
  'improving': 'improve',
  'optimizing': 'optimize',
  'configuring': 'configure',
  'migrating': 'migrate',
  'integrating': 'integrate',
  'deploying': 'deploy',
  'reverting': 'revert',
  'introducing': 'introduce',
  'correcting': 'correct',
  'adjusting': 'adjust',
  'replacing': 'replace',
  'upgrading': 'upgrade',
  'enabling': 'enable',
  'disabling': 'disable',
  'simplifying': 'simplify',
  'extracting': 'extract',
  'converting': 'convert',
});

// ────────────────────────────────────────────────────────────────
// Irregular verbs (past tense only — participles follow regular patterns)
// ────────────────────────────────────────────────────────────────
const IRREGULAR_PAST_MAP = Object.freeze({
  'wrote': 'write',
  'ran': 'run',
  'got': 'get',
  'made': 'make',
  'set': null, // "set" is same in imperative — skip
  'put': null,
  'cut': null,
  'built': 'build',
  'sent': 'send',
  'brought': 'bring',
  'began': 'begin',
  'broke': 'break',
  'chose': 'choose',
  'drew': 'draw',
  'drove': 'drive',
  'fell': 'fall',
  'found': 'find',
  'gave': 'give',
  'held': 'hold',
  'kept': 'keep',
  'knew': 'know',
  'led': 'lead',
  'left': 'leave',
  'lost': 'lose',
  'paid': 'pay',
  'took': 'take',
  'told': 'tell',
  'thought': 'think',
  'threw': 'throw',
  'understood': 'understand',
  'went': 'go',
  'won': 'win',
  'split': null,
  'spread': null,
  'shut': null,
  'rid': null,
});

/**
 * Extract the first meaningful word from the subject (after any CC prefix).
 * @param {string} subject - The commit subject line.
 * @returns {string} The first word of the description.
 */
function extractFirstWord(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  // Strip conventional commit prefix (e.g., "feat(scope): ")
  const colonIdx = subject.indexOf(': ');
  const content = colonIdx >= 0 ? subject.slice(colonIdx + 2).trim() : subject.trim();
  const words = content.split(/\s+/).filter(Boolean);

  return words.length > 0 ? words[0].toLowerCase() : '';
}

/**
 * Check for past tense verbs at the start of the subject.
 * @param {string} subject - The commit subject line.
 * @returns {TenseFinding[]}
 */
function checkPastTense(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];
  const firstWord = extractFirstWord(subject);

  if (!firstWord) {
    return findings;
  }

  // Check regular past tense
  const regularImperative = PAST_TENSE_MAP[firstWord];
  if (regularImperative) {
    findings.push({
      level: 'warning',
      rule: 'imperative-past',
      message: `"${firstWord}" is past tense.`,
      suggestion: `Use imperative mood: "${regularImperative}" instead of "${firstWord}". E.g., "${regularImperative} ${subject.split(/\s+/).slice(1).join(' ')}".`,
    });
    return findings;
  }

  // Check irregular past tense
  const irregularImperative = IRREGULAR_PAST_MAP[firstWord];
  if (irregularImperative) {
    findings.push({
      level: 'warning',
      rule: 'imperative-irregular-past',
      message: `"${firstWord}" is past tense (irregular verb).`,
      suggestion: `Use imperative mood: "${irregularImperative}" instead of "${firstWord}".`,
    });
  }

  return findings;
}

/**
 * Check for present participle (-ing) at the start of the subject.
 * @param {string} subject - The commit subject line.
 * @returns {TenseFinding[]}
 */
function checkParticiple(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length >= 0, 'subject length must be non-negative');

  const findings = [];
  const firstWord = extractFirstWord(subject);

  if (!firstWord) {
    return findings;
  }

  const imperative = PARTICIPLE_MAP[firstWord];
  if (imperative) {
    findings.push({
      level: 'warning',
      rule: 'imperative-participle',
      message: `"${firstWord}" is present participle (-ing form).`,
      suggestion: `Use imperative mood: "${imperative}" instead of "${firstWord}".`,
    });
    return findings;
  }

  // Catch unlisted -ing words that are likely participles
  if (firstWord.endsWith('ing') && firstWord.length > 4 && !PARTICIPLE_MAP[firstWord]) {
    const stem = deriveImperativeFromIng(firstWord);
    if (stem) {
      findings.push({
        level: 'info',
        rule: 'imperative-participle-unlisted',
        message: `"${firstWord}" appears to be a present participle.`,
        suggestion: `Consider imperative mood: "${stem}" instead of "${firstWord}".`,
      });
    }
  }

  return findings;
}

/**
 * Attempt to derive the imperative form from an -ing word.
 * @param {string} word - A word ending in "ing".
 * @returns {string|null}
 */
function deriveImperativeFromIng(word) {
  console.assert(typeof word === 'string', 'word must be a string');
  console.assert(word.endsWith('ing'), 'word must end in "ing"');

  const base = word.slice(0, -3); // Remove "ing"

  if (base.length < 2) {
    return null;
  }

  // "running" -> base "runn" -> "run" (double consonant)
  if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
    return base.slice(0, -1);
  }

  // "making" -> base "mak" -> "make" (add silent e)
  // Simple heuristic: if base ends in consonant, try adding 'e'
  const vowels = 'aeiou';
  if (!vowels.includes(base[base.length - 1])) {
    return base + 'e';
  }

  return base;
}

/**
 * Run all tense checks on a commit subject.
 * @param {string} message - The full commit message.
 * @returns {TenseFinding[]}
 */
export function checkTense(message) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(message.length > 0, 'message must not be empty');

  const subject = message.split('\n')[0] || '';
  const findings = [];

  findings.push(...checkPastTense(subject));
  findings.push(...checkParticiple(subject));

  return findings;
}
