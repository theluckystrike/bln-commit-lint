/**
 * index.mjs — BeLikeNative Commit Lint orchestrator.
 * Entry point for the GitHub Action. Fetches PR commits, runs all checkers,
 * posts a review comment, and sets the check status.
 * NASA Power of 10 compliant: bounded loops, <60-line functions, 2+ assertions.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { checkFormat } from './format-checker.mjs';
import { checkGrammar } from './grammar-checker.mjs';
import { checkQuality } from './quality-checker.mjs';
import { checkTense } from './tense-checker.mjs';
import { fetchPRCommits, buildReviewBody, postReviewComment } from './github-api.mjs';

/**
 * Read and validate action inputs.
 * @returns {{ token: string, enforceConventional: boolean, maxSubjectLength: number }}
 */
function readInputs() {
  const token = core.getInput('github-token', { required: true });
  console.assert(typeof token === 'string' && token.length > 0, 'github-token is required');

  const enforceRaw = core.getInput('enforce-conventional') || 'false';
  const enforceConventional = enforceRaw.toLowerCase() === 'true';

  const maxLenRaw = core.getInput('max-subject-length') || '72';
  const maxSubjectLength = parseInt(maxLenRaw, 10);
  console.assert(!isNaN(maxSubjectLength) && maxSubjectLength > 0, 'max-subject-length must be a positive integer');

  return { token, enforceConventional, maxSubjectLength };
}

/**
 * Extract PR context from the GitHub event payload.
 * @returns {{ owner: string, repo: string, prNumber: number }|null}
 */
function extractPRContext() {
  const context = github.context;
  console.assert(context != null, 'GitHub context must exist');
  console.assert(context.payload != null, 'GitHub payload must exist');

  const pr = context.payload.pull_request;
  if (!pr) {
    return null;
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const prNumber = pr.number;

  console.assert(typeof owner === 'string', 'owner must be a string');
  console.assert(typeof prNumber === 'number', 'prNumber must be a number');

  return { owner, repo, prNumber };
}

/**
 * Analyze a single commit message through all checkers.
 * @param {string} message - Full commit message.
 * @param {{ enforceConventional: boolean, maxSubjectLength: number }} options
 * @returns {{ findings: Array, score: number }}
 */
function analyzeCommit(message, options) {
  console.assert(typeof message === 'string' && message.length > 0, 'message required');
  console.assert(options != null, 'options required');

  const allFindings = [];

  const formatFindings = checkFormat(message, {
    enforceConventional: options.enforceConventional,
    maxSubjectLength: options.maxSubjectLength,
  });
  allFindings.push(...formatFindings);

  const grammarFindings = checkGrammar(message);
  allFindings.push(...grammarFindings);

  const qualityResult = checkQuality(message);
  allFindings.push(...qualityResult.findings);

  const tenseFindings = checkTense(message);
  allFindings.push(...tenseFindings);

  return { findings: allFindings, score: qualityResult.score };
}

/**
 * Determine if any findings are errors (should fail the check).
 * @param {Array<{sha: string, findings: Array<{level: string}>}>} results
 * @returns {boolean}
 */
function hasErrors(results) {
  console.assert(Array.isArray(results), 'results must be an array');
  console.assert(results.length >= 0, 'results length must be non-negative');

  const MAX_RESULTS = 250;
  const limit = Math.min(results.length, MAX_RESULTS);

  for (let i = 0; i < limit; i++) {
    const findings = results[i].findings;
    const MAX_FINDINGS = 100;
    const fLimit = Math.min(findings.length, MAX_FINDINGS);
    for (let j = 0; j < fLimit; j++) {
      if (findings[j].level === 'error') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Main action entry point.
 */
async function run() {
  console.assert(core != null, 'core module must be loaded');
  console.assert(github != null, 'github module must be loaded');

  const inputs = readInputs();
  const prContext = extractPRContext();

  if (!prContext) {
    core.warning('This action only runs on pull_request events. Skipping.');
    return;
  }

  core.info(`Analyzing PR #${prContext.prNumber} in ${prContext.owner}/${prContext.repo}`);

  const octokit = github.getOctokit(inputs.token);
  const commits = await fetchPRCommits(octokit, prContext.owner, prContext.repo, prContext.prNumber);

  console.assert(Array.isArray(commits), 'commits must be an array');
  core.info(`Found ${commits.length} commit(s) to analyze.`);

  if (commits.length === 0) {
    core.info('No commits found in PR. Nothing to analyze.');
    return;
  }

  const results = [];
  const MAX_COMMITS = 250;
  const limit = Math.min(commits.length, MAX_COMMITS);

  for (let i = 0; i < limit; i++) {
    const commit = commits[i];
    const subject = commit.message.split('\n')[0] || '';
    const analysis = analyzeCommit(commit.message, inputs);

    results.push({
      sha: commit.sha,
      subject,
      score: analysis.score,
      findings: analysis.findings,
    });

    core.info(`  [${i + 1}/${limit}] ${commit.sha.slice(0, 7)}: score ${analysis.score}, ${analysis.findings.length} finding(s)`);
  }

  const reviewBody = buildReviewBody(results);
  await postReviewComment(octokit, prContext.owner, prContext.repo, prContext.prNumber, reviewBody);
  core.info('Review comment posted.');

  if (hasErrors(results)) {
    core.setFailed('Commit message lint found errors. See the PR comment for details.');
  } else {
    core.info('All commit messages passed lint checks.');
  }
}

run().catch((err) => {
  core.setFailed(`BeLikeNative Commit Lint failed: ${err.message}`);
});
