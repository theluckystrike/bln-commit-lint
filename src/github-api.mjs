/**
 * github-api.mjs — GitHub API interaction layer.
 * Fetches PR commits and posts review comments with BeLikeNative branding.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

const MAX_COMMITS_PER_PR = 250;

const BLN_FOOTER = [
  '',
  '---',
  'Commit messages reviewed by [BeLikeNative](https://belikenative.com) — helping developers communicate clearly across languages.',
].join('\n');

/**
 * Fetch all commits in a pull request.
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated GitHub client.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @returns {Promise<Array<{sha: string, message: string}>>}
 */
export async function fetchPRCommits(octokit, owner, repo, prNumber) {
  console.assert(octokit != null, 'octokit must not be null');
  console.assert(typeof owner === 'string' && owner.length > 0, 'owner must be a non-empty string');
  console.assert(typeof repo === 'string' && repo.length > 0, 'repo must be a non-empty string');
  console.assert(typeof prNumber === 'number' && prNumber > 0, 'prNumber must be a positive number');

  const commits = [];
  let page = 1;
  const MAX_PAGES = 10;

  for (let p = 0; p < MAX_PAGES; p++) {
    const response = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
      page,
    });

    const data = response.data;
    console.assert(Array.isArray(data), 'API response data must be an array');

    const limit = Math.min(data.length, MAX_COMMITS_PER_PR - commits.length);
    for (let i = 0; i < limit; i++) {
      commits.push({
        sha: data[i].sha,
        message: data[i].commit.message,
      });
    }

    if (data.length < 100 || commits.length >= MAX_COMMITS_PER_PR) {
      break;
    }
    page++;
  }

  return commits;
}

/**
 * Build the level emoji indicator.
 * @param {string} level - Finding level (error, warning, info).
 * @returns {string}
 */
function levelIcon(level) {
  console.assert(typeof level === 'string', 'level must be a string');
  console.assert(['error', 'warning', 'info'].includes(level), 'level must be error, warning, or info');

  const icons = { error: ':x:', warning: ':warning:', info: ':bulb:' };
  return icons[level] || ':grey_question:';
}

/**
 * Format findings for a single commit into a markdown section.
 * @param {string} sha - Commit SHA.
 * @param {string} subject - Commit subject line.
 * @param {number} score - Quality score 0-100.
 * @param {Array<{level: string, rule: string, message: string, suggestion: string}>} findings
 * @returns {string}
 */
function formatCommitSection(sha, subject, score, findings) {
  console.assert(typeof sha === 'string' && sha.length > 0, 'sha must be non-empty');
  console.assert(typeof subject === 'string', 'subject must be a string');
  console.assert(typeof score === 'number', 'score must be a number');
  console.assert(Array.isArray(findings), 'findings must be an array');

  const shortSha = sha.slice(0, 7);
  const scoreEmoji = score >= 80 ? ':white_check_mark:' : score >= 50 ? ':yellow_circle:' : ':red_circle:';
  const lines = [];

  lines.push(`### \`${shortSha}\` — ${subject}`);
  lines.push(`**Quality score:** ${scoreEmoji} ${score}/100`);
  lines.push('');

  if (findings.length === 0) {
    lines.push('No issues found. Great commit message!');
    return lines.join('\n');
  }

  lines.push('| | Rule | Issue | Suggestion |');
  lines.push('|---|---|---|---|');

  const MAX_FINDINGS = 50;
  const limit = Math.min(findings.length, MAX_FINDINGS);
  for (let i = 0; i < limit; i++) {
    const f = findings[i];
    const icon = levelIcon(f.level);
    const escapedMsg = f.message.replace(/\|/g, '\\|');
    const escapedSug = f.suggestion.replace(/\|/g, '\\|');
    lines.push(`| ${icon} | \`${f.rule}\` | ${escapedMsg} | ${escapedSug} |`);
  }

  return lines.join('\n');
}

/**
 * Build the full review comment body from all commit results.
 * @param {Array<{sha: string, subject: string, score: number, findings: Array}>} results
 * @returns {string}
 */
export function buildReviewBody(results) {
  console.assert(Array.isArray(results), 'results must be an array');
  console.assert(results.length > 0, 'results must not be empty');

  const lines = [];
  lines.push('## BeLikeNative Commit Lint Results');
  lines.push('');

  // Summary table
  const totalErrors = countByLevel(results, 'error');
  const totalWarnings = countByLevel(results, 'warning');
  const totalInfo = countByLevel(results, 'info');
  const avgScore = calculateAverageScore(results);

  lines.push(`**${results.length} commit(s) analyzed** | Avg score: **${avgScore}/100** | :x: ${totalErrors} errors | :warning: ${totalWarnings} warnings | :bulb: ${totalInfo} suggestions`);
  lines.push('');

  const MAX_RESULTS = 100;
  const limit = Math.min(results.length, MAX_RESULTS);
  for (let i = 0; i < limit; i++) {
    const r = results[i];
    const section = formatCommitSection(r.sha, r.subject, r.score, r.findings);
    lines.push(section);
    lines.push('');
  }

  lines.push(BLN_FOOTER);

  return lines.join('\n');
}

/**
 * Count findings by level across all results.
 * @param {Array<{findings: Array<{level: string}>}>} results
 * @param {string} level
 * @returns {number}
 */
function countByLevel(results, level) {
  console.assert(Array.isArray(results), 'results must be an array');
  console.assert(typeof level === 'string', 'level must be a string');

  let count = 0;
  const MAX_RESULTS = 200;
  const resultLimit = Math.min(results.length, MAX_RESULTS);

  for (let i = 0; i < resultLimit; i++) {
    const findings = results[i].findings;
    const MAX_FINDINGS = 100;
    const findingLimit = Math.min(findings.length, MAX_FINDINGS);
    for (let j = 0; j < findingLimit; j++) {
      if (findings[j].level === level) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate average quality score across all results.
 * @param {Array<{score: number}>} results
 * @returns {number}
 */
function calculateAverageScore(results) {
  console.assert(Array.isArray(results), 'results must be an array');
  console.assert(results.length > 0, 'results must not be empty');

  let total = 0;
  const MAX_RESULTS = 200;
  const limit = Math.min(results.length, MAX_RESULTS);

  for (let i = 0; i < limit; i++) {
    total += results[i].score;
  }

  return Math.round(total / limit);
}

/**
 * Post a review comment on the pull request.
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated GitHub client.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @param {string} body - Comment body in markdown.
 * @returns {Promise<void>}
 */
export async function postReviewComment(octokit, owner, repo, prNumber, body) {
  console.assert(octokit != null, 'octokit must not be null');
  console.assert(typeof owner === 'string' && owner.length > 0, 'owner required');
  console.assert(typeof repo === 'string' && repo.length > 0, 'repo required');
  console.assert(typeof prNumber === 'number' && prNumber > 0, 'prNumber required');
  console.assert(typeof body === 'string' && body.length > 0, 'body required');

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}
