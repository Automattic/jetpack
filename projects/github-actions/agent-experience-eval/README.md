# Agent Experience Evaluation

A GitHub Action that evaluates a repository's AI agent experience quality by scoring its CLAUDE.md, AGENTS.md, and other AI instruction files against a standardized rubric.

## How it works

1. **Discovers** AI instruction files (CLAUDE.md, AGENTS.md, .cursorrules, .cursor/**, etc.)
2. **Evaluates** them using the Claude Code CLI against a 6-criteria, 100-point rubric
3. **Validates** the structured JSON report
4. **Uploads** the report as a GitHub Actions artifact for central collection

## Usage

```yaml
# .github/workflows/agent-experience-eval.yml
name: Agent Experience Evaluation

on:
  schedule:
    - cron: '0 6 * * 1'  # Weekly, Monday 6am UTC
  push:
    paths:
      - 'CLAUDE.md'
      - '**/CLAUDE.md'
      - 'AGENTS.md'
      - '**/AGENTS.md'
      - '.claude/**'
      - '**/.claude/**'
      - '.cursorrules'
      - '**/.cursorrules'
      - '.cursor/**'
      - '**/.cursor/**'
  workflow_dispatch: {}

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Evaluate Agent Experience
        uses: Automattic/action-agent-experience-eval@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `anthropic_api_key` | Yes | — | Anthropic API key for Claude Code CLI |
| `max_turns` | No | `15` | Maximum turns for the CLI evaluation |
| `output_path` | No | `agent-experience-eval.json` | Path for the evaluation JSON file |
| `upload_artifact` | No | `true` | Upload the JSON as a GitHub Actions artifact |
| `artifact_name` | No | `agent-experience-eval` | Name of the uploaded artifact |
| `artifact_retention_days` | No | `30` | Days to retain the artifact |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Overall evaluation score (0-100) |
| `grade` | Letter grade (A, B, C, D, F) |
| `json_path` | Path to the evaluation JSON file |
| `has_ai_files` | Whether AI instruction files were found |

## Scoring Rubric

| Criterion | Points | Description |
|-----------|--------|-------------|
| Commands/Workflows | 20 | Build, test, lint, deploy commands documented |
| Architecture Clarity | 20 | Codebase map with directories, modules, data flow |
| Non-obvious Patterns | 15 | Gotchas, quirks, workarounds, edge cases |
| Conciseness | 15 | Dense, valuable content with no filler |
| Currency | 15 | Commands work, file refs accurate, stack current |
| Actionability | 15 | Copy-paste ready commands, concrete steps |

**Grade scale:** A (90-100), B (70-89), C (50-69), D (30-49), F (0-29)

## Artifact Schema

The action produces a JSON artifact with this structure:

```json
{
  "version": 1,
  "score": 72,
  "grade": "B",
  "files_found": ["CLAUDE.md", ".cursor/rules/testing.mdc"],
  "criteria": {
    "commands_workflows":   { "score": 18, "max": 20, "notes": "..." },
    "architecture_clarity": { "score": 15, "max": 20, "notes": "..." },
    "non_obvious_patterns": { "score": 12, "max": 15, "notes": "..." },
    "conciseness":          { "score": 10, "max": 15, "notes": "..." },
    "currency":             { "score": 8,  "max": 15, "notes": "..." },
    "actionability":        { "score": 9,  "max": 15, "notes": "..." }
  },
  "issues": ["..."],
  "recommendations": ["..."]
}
```

## AI Files Detected

The action searches for:

- `CLAUDE.md`, `AGENTS.md`, `AGENTS.override.md` (root and subdirectories)
- `.cursorrules`, `.windsurfrules`, `.aider.conf.yml`, `.codeiumrc`
- `.github/copilot-instructions.md`
- `.claude/**`, `.cursor/**`, `.codex/**` directories

## Prerequisites

The Claude Code CLI (`@anthropic-ai/claude-code`) must be installed on the runner before this action runs. See the usage example above.
