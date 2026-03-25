Evaluate this repository's AI agent experience quality.

Find and read all AI instruction files in this repository:
- CLAUDE.md, AGENTS.md, AGENTS.override.md (root and subdirectories)
- .cursorrules, .windsurfrules, .aider.conf.yml, .codeiumrc
- .github/copilot-instructions.md
- Files inside .claude/, .cursor/, .codex/ directories

Score the repository against this rubric:

1. Commands/Workflows (0-20): Are build, test, lint, deploy commands documented?
2. Architecture Clarity (0-20): Is there a codebase map with directories, modules, data flow?
3. Non-obvious Patterns (0-15): Are gotchas, quirks, workarounds, edge cases documented?
4. Conciseness (0-15): Is the content dense and valuable without filler?
5. Currency (0-15): Do commands work, are file refs accurate, is the stack current?
6. Actionability (0-15): Are there copy-paste ready commands and concrete steps?

Output a JSON object matching this exact schema:

{
  "version": 1,
  "score": <number 0-100, sum of all criteria scores>,
  "grade": "<A|B|C|D|F>",
  "files_found": ["<relative paths from repo root, e.g. .claude/CLAUDE.md not /home/runner/work/repo/.claude/CLAUDE.md>"],
  "criteria": {
    "commands_workflows":   { "score": <0-20>, "max": 20, "notes": "<feedback>" },
    "architecture_clarity": { "score": <0-20>, "max": 20, "notes": "<feedback>" },
    "non_obvious_patterns": { "score": <0-15>, "max": 15, "notes": "<feedback>" },
    "conciseness":          { "score": <0-15>, "max": 15, "notes": "<feedback>" },
    "currency":             { "score": <0-15>, "max": 15, "notes": "<feedback>" },
    "actionability":        { "score": <0-15>, "max": 15, "notes": "<feedback>" }
  },
  "issues": ["<specific problems found>"],
  "recommendations": ["<specific recommendations>"]
}

IMPORTANT:
- Do NOT modify any repo files. Only output the JSON.
- If no AI instruction files exist, score 0, grade F.
- The "score" field must equal the sum of all criteria scores.
- The "grade" must match the score: A (90-100), B (70-89), C (50-69), D (30-49), F (0-29).
- All file paths in "files_found" must be relative to the repo root (no absolute paths).
- Output ONLY the JSON object. No text before or after.
