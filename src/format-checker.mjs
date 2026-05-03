/**
 * format-checker.mjs — Conventional Commits compliance checker.
 * Validates commit messages against the Conventional Commits specification.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

const VALID_TYPES = Object.freeze([
  'feat', 'fix', 'docs', 'style', 'refactor',
  'test', 'chore', 'perf', 'ci', 'build', 'revert',
]);

const CC_REGEX = /^([a-z]+)(?:\(([a-z0-9._-]+)\))?(!)?:\s(.+)$/;

/**
 * Parse the subject line into conventional commit parts.
 * @param {string} subject - The first line of the commit message.
 * @returns {{ type: string|null, scope: string|null, breaking: boolean, description: string|null }}
 */
function parseConventionalSubject(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length > 0, 'subject must not be empty');

  const match = subject.match(CC_REGEX);
  if (!match) {
    return { type: null, scope: null, breaking: false, description: null };
  }

  return {
    type: match[1],
    scope: match[2] || null,
    breaking: match[3] === '!',
    description: match[4],
  };
}

/**
 * Check if the subject line follows conventional commit type rules.
 * @param {string} subject - The first line of the commit message.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkSubjectFormat(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length > 0, 'subject must not be empty');

  const findings = [];
  const parsed = parseConventionalSubject(subject);

  if (!parsed.type) {
    findings.push({
      level: 'warning',
      rule: 'conventional-format',
      message: 'Subject does not follow Conventional Commits format.',
      suggestion: 'Use format: type(scope): description — e.g., "feat(auth): add login endpoint"',
    });
    return findings;
  }

  if (!VALID_TYPES.includes(parsed.type)) {
    findings.push({
      level: 'error',
      rule: 'conventional-type',
      message: `Unknown type "${parsed.type}".`,
      suggestion: `Valid types: ${VALID_TYPES.join(', ')}`,
    });
  }

  return findings;
}

/**
 * Check the description portion of a conventional commit subject.
 * @param {string} subject - The first line of the commit message.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkDescriptionFormat(subject) {
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(subject.length > 0, 'subject must not be empty');

  const findings = [];
  const parsed = parseConventionalSubject(subject);

  if (!parsed.description) {
    return findings;
  }

  const desc = parsed.description;
  const firstChar = desc.charAt(0);

  if (firstChar !== firstChar.toLowerCase()) {
    findings.push({
      level: 'warning',
      rule: 'subject-lowercase',
      message: 'Description should start with a lowercase letter after the colon.',
      suggestion: `Use "${desc.charAt(0).toLowerCase()}${desc.slice(1)}" instead of "${desc}"`,
    });
  }

  if (subject.endsWith('.')) {
    findings.push({
      level: 'warning',
      rule: 'no-trailing-period',
      message: 'Subject line should not end with a period.',
      suggestion: 'Remove the trailing period from the subject line.',
    });
  }

  return findings;
}

/**
 * Check body formatting rules (blank line separator, line wrapping).
 * @param {string} fullMessage - The full commit message including body.
 * @param {number} maxBodyLineLength - Maximum body line length.
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
function checkBodyFormat(fullMessage, maxBodyLineLength) {
  console.assert(typeof fullMessage === 'string', 'fullMessage must be a string');
  console.assert(typeof maxBodyLineLength === 'number', 'maxBodyLineLength must be a number');

  const findings = [];
  const lines = fullMessage.split('\n');

  if (lines.length < 2) {
    return findings;
  }

  if (lines.length >= 2 && lines[1].trim() !== '') {
    findings.push({
      level: 'error',
      rule: 'body-blank-line',
      message: 'There must be a blank line between the subject and body.',
      suggestion: 'Add an empty line after the subject before the body text.',
    });
  }

  const bodyLines = lines.slice(2);
  const MAX_BODY_LINES = 500;
  const linesToCheck = Math.min(bodyLines.length, MAX_BODY_LINES);

  for (let i = 0; i < linesToCheck; i++) {
    if (bodyLines[i].length > maxBodyLineLength) {
      findings.push({
        level: 'warning',
        rule: 'body-line-length',
        message: `Body line ${i + 3} is ${bodyLines[i].length} chars (max ${maxBodyLineLength}).`,
        suggestion: `Wrap body lines at ${maxBodyLineLength} characters.`,
      });
      break; // Report only the first long line to avoid noise.
    }
  }

  return findings;
}

/**
 * Run all format checks on a commit message.
 * @param {string} message - The full commit message.
 * @param {{ enforceConventional: boolean, maxSubjectLength: number }} options
 * @returns {Array<{level: string, rule: string, message: string, suggestion: string}>}
 */
export function checkFormat(message, options) {
  console.assert(typeof message === 'string', 'message must be a string');
  console.assert(
    options && typeof options.maxSubjectLength === 'number',
    'options.maxSubjectLength required'
  );

  const subject = message.split('\n')[0] || '';
  const findings = [];

  const subjectFindings = checkSubjectFormat(subject);
  const descFindings = checkDescriptionFormat(subject);
  const bodyFindings = checkBodyFormat(message, options.maxSubjectLength);

  findings.push(...subjectFindings);
  findings.push(...descFindings);
  findings.push(...bodyFindings);

  // Subject length check
  if (subject.length > options.maxSubjectLength) {
    findings.push({
      level: 'warning',
      rule: 'subject-length',
      message: `Subject is ${subject.length} chars (max ${options.maxSubjectLength}).`,
      suggestion: `Shorten the subject line to ${options.maxSubjectLength} characters or fewer.`,
    });
  }

  // Upgrade warnings to errors when enforcement is enabled
  if (options.enforceConventional) {
    const MAX_FINDINGS = 200;
    const limit = Math.min(findings.length, MAX_FINDINGS);
    for (let i = 0; i < limit; i++) {
      if (findings[i].rule === 'conventional-format' || findings[i].rule === 'conventional-type') {
        findings[i] = { ...findings[i], level: 'error' };
      }
    }
  }

  return findings;
}

export { VALID_TYPES, parseConventionalSubject };
