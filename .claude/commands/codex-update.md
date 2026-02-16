---
description: Update .codex/ documentation after code changes
---

**Scope: currently only supported for `projects/packages/forms`.** If the user requests this for a different project, explain that the codex system is only set up for the forms package and decline to proceed.

Update the `.codex/` knowledge system for a project after code changes.

The user may provide a project path and/or description of changes. If the project path is not provided, infer it from recent git changes or ask.

## Steps

### 1. Identify what changed

Determine what files were modified:
- Check `git diff --name-only` (staged and unstaged) for the project
- Check `git diff --name-only HEAD~1..HEAD` for recently committed changes
- If the user described changes, use that as a guide

### 2. Read affected codex docs

Read the project's `.codex/README.md` and `.codex/map.md` to understand the current documentation state. Then read any flow docs or file docs that cover the changed files.

### 3. Read the changed source files

Read the actual modified source files to understand what changed. Compare against what the codex currently says.

### 4. Update affected documents

For each changed source file, determine which codex documents need updates:

- **map.md**: Update if files were added/removed/renamed, or if class relationships changed
- **flows/*.md**: Update if the change affects any documented flow (check the "Files involved" tables). Update line numbers, sequence steps, key decisions.
- **files/*.md**: Update if a deeply-documented file was modified. Update method index, line numbers, hooks, properties.
- **references.md**: Update if new external dependencies or references were added

### 5. Verify line numbers

After updating, spot-check that file:line references in updated docs still point to the correct code. Line numbers shift when code is added/removed above them.

### 6. Log the update

Append to `.codex/log.md`:

```markdown
## YYYY-MM-DD — [Brief description of changes]
- Changed files: [list]
- Updated codex docs: [list]
- Notes: [any gaps found, improvements needed]
```

### 7. Self-improvement check

After updating, briefly consider:
- Did the codex have everything needed to understand the change? If not, note the gap in log.md.
- Are there new patterns or flows that should be documented?
- Did any existing documentation become stale or misleading?
- Should README.md instructions be updated based on this experience?

## Quality Standards

- Every file:line reference must be verified against current source code
- Don't just update line numbers mechanically — re-read the context to ensure the description is still accurate
- If a flow has fundamentally changed, rewrite the flow doc rather than patching it
- Keep log.md entries concise but informative

## Important

- Always read source files before updating codex docs. Never guess at what changed.
- If changes are extensive (new feature, major refactor), consider creating new flow docs rather than overloading existing ones.
- If a file deep dive no longer applies (file deleted or simplified below 500 lines), remove it and update map.md.
