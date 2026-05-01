---
description: Create a pull request for Jetpack changes using the PR template
---

Create a pull request for the current branch using Jetpack's PR template.

Instructions:
1. Check git status and analyze all commits from trunk to HEAD
2. Check if changes include any projects (projects/plugins/*, projects/packages/*, projects/github-actions/*, or projects/js-packages/*):
   - If yes, verify a changelog entry exists in the project's changelog/ directory
   - If no changelog exists, run `/jetpack-changelog` first to create one
   - If changes are only to .claude/, docs, or non-project files, skip changelog check
3. Ensure the branch is pushed to remote (push if needed)
4. CRITICAL: Read the file `.github/PULL_REQUEST_TEMPLATE.md` using the Read tool. You MUST read this file every time — do not rely on memory for the template structure.
5. Prepare the PR title and body following the EXACT section structure from the template you just read:
   - Title (for `--title`, NOT included in the body file): Clear summary of changes
   - Fixes #: Link to issue if applicable, or leave blank / "N/A" if none
   - Proposed changes: Bullet points of functional changes
   - Testing instructions: Step-by-step how to test the changes
   - Include all sections from the template, filling in what's relevant and leaving defaults for the rest
6. Create the PR using `gh pr create`:
   - IMPORTANT: To avoid bash escaping issues, ALWAYS use `--body-file` instead of `--body`
   - Write the PR body to a temporary file using a heredoc, then pass it to `gh`. Use a safe, non-hardcoded path (e.g., `mktemp` or a project-local temp file) — avoid fixed paths in shared directories like `/tmp`.
     ```bash
     BODY_FILE="$(mktemp)"
     cat > "$BODY_FILE" << 'EOF'
     [PR body content here]
     EOF
     gh pr create --title "..." --body-file "$BODY_FILE" --label "..." --assignee @me
     ```
7. Add required labels:
   - `[Status] *` - use `[Status] In Progress` by default, or `[Status] Needs Review` if ready for review

Deduce all information from git history and code changes - do not ask the user for input.
