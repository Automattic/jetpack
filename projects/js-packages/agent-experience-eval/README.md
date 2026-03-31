# @automattic/jetpack-agent-experience-eval

Evaluate a repository's AI agent experience quality. Scores CLAUDE.md, AGENTS.md, and other AI instruction files against a standardized rubric using the Claude API.

Requires Node.js >= 22 and an Anthropic API key.

## CLI Usage

```bash
npx @automattic/jetpack-agent-experience-eval --repo /path/to/repo -o eval.json
```

Options:
- `-o, --output <path>` — Write JSON to file (default: stdout)
- `--repo <path>` — Repository root (default: cwd)
- `--model <model>` — Claude model (default: claude-sonnet-4-6)
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

Licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
