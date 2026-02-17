---
description: Update .codex/ documentation after code changes
---

**Scope: currently only supported for `projects/packages/forms`.** If the user requests this for a different project, explain that the codex system is only set up for the forms package and decline to proceed.

Update the `.codex/` knowledge system for a project after source code changes. Only update the codex inside the project's own directory — never modify codex docs in other projects.

The user may provide a project path and/or description of changes. If the project path is not provided, infer it from recent git changes or ask.

## Steps

### 1. Identify what changed in the source code

Figure out which source files were modified and how:
- Check `git diff --name-only` (staged and unstaged) filtered to the project path
- Check `git log --oneline --name-only` for recent commits on the current branch (compare against trunk/main)
- If the user described the changes, use that as a starting point
- Read the actual diffs or changed files to understand the nature of each change

### 2. Decide if the codex needs updating

Not every source change requires a codex update. **Skip the update** (and tell the user) if:
- Changes are test-only (new/modified test files, no production code changes)
- Changes are cosmetic (formatting, comments, whitespace, import reordering)
- Changes are in files not covered by any codex doc and don't introduce new patterns

If no update is needed, append a brief "no update needed" entry to `log.md` with the reason, and stop.

### 3. Find which codex docs are affected

Read `.codex/map.md` to understand the current documentation structure. Then:
- Check the **"Files involved"** tables in `flows/*.md` — does any flow doc list a changed file?
- Check `files/*.md` — is there a note file for any changed file?
- Check `map.md` itself — were files added/removed/renamed, or did class relationships change?
- Check `references.md` — were new external dependencies introduced?

Read the affected codex docs so you know what they currently say.

### 4. Update affected documents

For each affected codex doc, read the corresponding source files and update:

- **map.md**: File inventory (add/remove/rename entries), class hierarchy, entry points, data flow diagram
- **flows/*.md**: Sequence steps, method references, key decisions, gotchas. If a flow fundamentally changed, rewrite it rather than patching.
- **files/*.md**: Key methods, patterns, state, hooks, gotchas. If a file was deleted or simplified, remove the doc.
- **references.md**: New external dependencies, packages, or hooks

**If the change introduces a significant new cross-file process**, create a new flow doc rather than overloading an existing one.

### 5. Update freshness signals

For every codex doc you modified, update the verified comment at the top:

```markdown
<!-- verified: YYYY-MM-DD, commit: short-hash -->
```

Use the current date and the latest commit hash for the source files covered by that doc.

### 6. Verify your references

For each codex doc you modified, confirm that `Class::method()` references still exist in the source. Methods get renamed or removed — check that the methods you reference are still there. A quick Grep for each method name is sufficient.

### 7. Log what you did to the codex

Append to `.codex/log.md`. This log tracks **codex maintenance activity** — which docs you edited and why. It is NOT a changelog of the source code.

```markdown
## YYYY-MM-DD — [What you changed in the codex, e.g. "Updated submission flow for new webhook step"]
- Codex docs modified: [list of .codex/ files you created or edited]
- Trigger: [what source code change prompted this, e.g. "New retry logic in Form_Webhooks::send()"]
- Gaps found: [anything the codex was missing that you needed — or "none"]
- Still needed: [follow-up codex improvements you noticed but didn't do — or "none"]
```

## Quality Standards

- Use `Class::method()` references, not line numbers. Method names are stable and greppable.
- Don't just patch docs mechanically — re-read context to ensure descriptions are still accurate
- If a flow has fundamentally changed, rewrite the flow doc rather than patching it
- Keep `log.md` entries concise but informative
- Only update the codex in this project's directory — don't touch codex docs in other projects

## Important

- Always read source files before writing codex updates. Never guess at what changed.
- If changes are extensive (new feature, major refactor), consider creating new flow docs rather than overloading existing ones.
- The codex is for orientation, not exhaustive documentation. If a doc isn't helping anyone understand the code faster, remove it.
