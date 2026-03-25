Run /claude-md-management:claude-md-improver to audit this repo.

After the skill produces its quality report, convert the results into
a JSON object matching this exact schema:

{
  "version": 1,
  "score": <number 0-100, the average score from the report>,
  "grade": "<A|B|C|D|F, from the report>",
  "files_found": ["<relative paths from repo root, e.g. .claude/CLAUDE.md not /home/runner/work/repo/.claude/CLAUDE.md>"],
  "criteria": {
    "commands_workflows":   { "score": <0-20>, "max": 20, "notes": "<feedback from report>" },
    "architecture_clarity": { "score": <0-20>, "max": 20, "notes": "<feedback from report>" },
    "non_obvious_patterns": { "score": <0-15>, "max": 15, "notes": "<feedback from report>" },
    "conciseness":          { "score": <0-15>, "max": 15, "notes": "<feedback from report>" },
    "currency":             { "score": <0-15>, "max": 15, "notes": "<feedback from report>" },
    "actionability":        { "score": <0-15>, "max": 15, "notes": "<feedback from report>" }
  },
  "issues": ["<specific problems from the report>"],
  "recommendations": ["<specific recommendations from the report>"]
}

IMPORTANT:
- Run the skill FIRST, then extract the data into JSON.
- Do NOT modify any repo files. Only output the JSON.
- If no AI instruction files exist, score 0, grade F.
- The "score" field must equal the sum of all criteria scores.
- The "grade" must match the score: A (90-100), B (70-89), C (50-69), D (30-49), F (0-29).
- All file paths in "files_found" must be relative to the repo root (no absolute paths).
- Output ONLY the JSON object. No markdown code fences. No text before or after.
