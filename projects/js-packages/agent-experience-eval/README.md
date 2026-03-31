# @automattic/jetpack-agent-experience-eval

Evaluate a repository's AI agent experience quality. Scores CLAUDE.md, AGENTS.md, and other AI instruction files against a standardized rubric using the Claude API.

Requires Node.js >= 22 and an Anthropic API key.

## CLI Usage

```bash
# Human-readable report to terminal
agent-experience-eval

# JSON to file, human summary to terminal
agent-experience-eval -o eval.json

# JSON to stdout (for piping)
agent-experience-eval --format json

# Human report saved to file
agent-experience-eval --format human -o report.txt

# Evaluate a different repo
agent-experience-eval --repo /path/to/repo -o eval.json
```

Options:
- `-o, --output <path>` — Write output to file
- `--repo <path>` — Repository root (default: cwd)
- `--model <model>` — Claude model (default: claude-sonnet-4-6)
- `--format <json|human|auto>` — Output format (default: auto)
  - `auto`: human report on TTY, JSON when piped. With `-o`, JSON goes to file and human summary to terminal.
  - `json`: JSON output
  - `human`: human-readable report
- `-h, --help` — Show help

## Programmatic API

```typescript
import { evaluate } from '@automattic/jetpack-agent-experience-eval';

const metadata = await evaluate({
  repoRoot: '/path/to/repo',
  apiKey: 'sk-ant-...',          // or set ANTHROPIC_API_KEY env var
  model: 'claude-sonnet-4-6',   // optional
});

console.log(metadata.result.score);  // 0-100
console.log(metadata.result.grade);  // A, B, C, D, F
```

### Lower-level helpers

```typescript
import { discoverFiles, validateCurrency, buildPrompt } from '@automattic/jetpack-agent-experience-eval';

// Just find AI instruction files
const files = await discoverFiles('/path/to/repo');

// Validate referenced paths and commands
const validation = await validateCurrency('/path/to/repo', files);

// Build the prompt (without calling the API)
const { prompt, truncated } = buildPrompt(files, validation);
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Licensed under GNU General Public License v2 (or later).
