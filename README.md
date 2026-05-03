# BeLikeNative Commit Lint

A GitHub Action that analyzes commit messages in pull requests for grammar, format, clarity, and proper tense — with L1-aware suggestions for non-native English speakers.

Powered by [BeLikeNative](https://belikenative.com) — helping developers communicate clearly across languages.

## What It Checks

### 1. Format (Conventional Commits)
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- Proper format: `type(scope): description`
- Lowercase description after colon
- No trailing period on subject line
- Blank line between subject and body

### 2. Grammar (25+ rules, L1-aware)
- Common developer spelling errors (15 words: "refernce", "enviroment", "dependancy", etc.)
- Double word detection ("the the", "fix fix")
- Missing articles for CJK speakers ("fix bug" -> "fix the bug")
- Wrong prepositions ("depend of" -> "depend on", "compatible to" -> "compatible with")
- Subject-verb agreement
- Capitalization issues (ALL CAPS, camelCase in prose)
- L1-transfer patterns from Romance/Slavic languages ("allow to" -> "allow [noun] to")

### 3. Quality (scored 0-100)
- Vague message detection: flags "fix", "update", "wip", "stuff", "things"
- Generic combos: "fix bug", "update code", "small fix"
- Minimum 3 words in subject
- No ALL CAPS subjects
- No emoji-only subjects
- Issue reference encouragement (#123, PROJ-456)

### 4. Tense (Imperative Mood)
- Past tense detection: "added" -> "add", "fixed" -> "fix"
- Present participle detection: "adding" -> "add", "fixing" -> "fix"
- 30+ regular verbs mapped
- 20+ irregular verbs handled ("wrote" -> "write", "built" -> "build")

### 5. Length
- Subject line: 72 characters max (configurable)
- Body lines: wrapped at 72 characters

## Usage

Add this to your workflow file (e.g., `.github/workflows/commit-lint.yml`):

```yaml
name: Commit Lint

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  lint-commits:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: theluckystrike/bln-commit-lint@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### With all options:

```yaml
      - uses: theluckystrike/bln-commit-lint@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          enforce-conventional: true    # Fail on non-conventional format
          max-subject-length: 72        # Max subject line length
```

## Configuration

| Input | Description | Default |
|---|---|---|
| `github-token` | GitHub token for API access | **required** |
| `enforce-conventional` | Fail the check if commits don't follow Conventional Commits | `false` |
| `max-subject-length` | Maximum subject line length | `72` |

## How It Works

1. Triggered on pull request events (opened, synchronize, reopened)
2. Fetches all commits in the PR via the GitHub API
3. Runs each commit message through 5 analysis passes: format, grammar, quality, tense, and length
4. Posts a single review comment with a summary table and per-commit findings
5. Sets the check status: pass (no errors) or fail (errors found)

## Output Example

The action posts a comment on the PR like this:

> ### `a1b2c3d` — added new feature for users
> **Quality score:** :yellow_circle: 65/100
>
> | | Rule | Issue | Suggestion |
> |---|---|---|---|
> | :warning: | `imperative-past` | "added" is past tense. | Use imperative mood: "add" instead of "added". |
> | :warning: | `conventional-format` | Subject does not follow Conventional Commits format. | Use format: type(scope): description |
> | :bulb: | `issue-reference` | No issue reference found. | Consider linking to an issue for traceability. |

## L1-Aware Suggestions

This linter is designed with empathy for non-native English speakers. Instead of just flagging errors, it explains common L1-transfer patterns:

- **CJK speakers**: Missing articles ("fix bug" -> "fix the bug")
- **Romance language speakers**: Wrong prepositions ("depend of" -> "depend on")
- **Slavic language speakers**: Missing infinitive objects ("allow to" -> "allow users to")
- **All L1 backgrounds**: Tense correction with examples, not just rules

---

## BeLikeNative Developer Tools

This tool is part of the **[BeLikeNative](https://belikenative.com)** ecosystem — AI-powered writing tools for non-native English speakers.

| Tool | Type | Description |
|------|------|-------------|
| [Grammar Check](https://github.com/theluckystrike/belikenative-grammar-check) | GitHub Action | PR grammar checker with 60 rules and L1-aware insights |
| [Writing Assistant](https://github.com/theluckystrike/bln-writing-assistant) | GitHub Action | Writing quality analysis: readability, structure, clarity |
| [i18n Checker](https://github.com/theluckystrike/bln-i18n-checker) | GitHub Action | Find hardcoded strings that need internationalization |
| [MCP Grammar Server](https://github.com/theluckystrike/bln-mcp-grammar-server) | MCP Server | 70 local grammar rules for Claude Desktop & Cursor |
| [Website Grader](https://github.com/theluckystrike/bln-website-grader) | Web Tool | Free website performance grader |

**[BeLikeNative Chrome Extension](https://chromewebstore.google.com/detail/belikenative-ai-writing-a/gchojmpfpbpmpfgdppfdkpchikbcgabp)** — AI writing assistant for 100+ languages, 15 tones, 15 styles. 10,000+ users, 4.6★ rating.

## License

MIT
