# Agent Experience Evaluation

A GitHub Action that evaluates a repository's AI agent experience quality by scoring its CLAUDE.md, AGENTS.md, and other AI instruction files against a standardized rubric.

Uses the [`@automattic/jetpack-agent-experience-eval`](../../js-packages/agent-experience-eval/) package under the hood.

## Usage

```yaml
- name: Evaluate Agent Experience
  uses: Automattic/jetpack/projects/github-actions/agent-experience-eval@trunk
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

The action handles everything internally: discovers AI files, validates references, calls the Claude API, uploads the artifact.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `anthropic_api_key` | Yes | — | Anthropic API key |
| `model` | No | `claude-sonnet-4-6` | Claude model to use |
| `output_path` | No | `agent-experience-eval.json` | Path for JSON output |
| `upload_artifact` | No | `true` | Whether to upload as artifact |
| `artifact_name` | No | `agent-experience-eval` | Name of the artifact |
| `artifact_retention_days` | No | `30` | Artifact retention in days |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Overall score (0-100) |
| `grade` | Letter grade (A, B, C, D, F) |
| `json_path` | Path to the JSON report |

## Scoring Rubric

| Criterion | Points | What it measures |
|-----------|--------|------------------|
| Commands/Workflows | 20 | Are build, test, lint, deploy commands documented? |
| Architecture Clarity | 20 | Is there a codebase map with directories, modules, data flow? |
| Non-obvious Patterns | 15 | Gotchas, quirks, workarounds documented? |
| Conciseness | 15 | Dense and valuable without filler? |
| Currency | 15 | Do commands work? Are file refs accurate? |
| Actionability | 15 | Copy-paste ready commands and concrete steps? |

Grade scale: A (90-100), B (70-89), C (50-69), D (30-49), F (0-29).

## AI Files Detected

The evaluator discovers these file patterns:

- `CLAUDE.md`, `AGENTS.md`, `AGENTS.override.md` (root and subdirectories)
- `.cursorrules`, `.windsurfrules`, `.aider.conf.yml`, `.codeiumrc`
- `.github/copilot-instructions.md`
- Files inside `.claude/`, `.cursor/`, `.codex/` directories

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

agent-experience-eval is licensed under GNU General Public License v2 (or later).
