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
   - Why are these changes being made?: The problem this solves and for whom, plus the key decisions made and the alternatives ruled out. Write it from the conversation that led to the change, the issue, or the commit messages, not from the diff; if none of those explain it, ask the user rather than guessing. This repo is public: don't quote or paraphrase P2, Slack or Linear discussions (link their shorthand under "Related product discussion/links" instead), don't name customers, sites or users, and for a security fix leave out the vulnerability and how it could be exploited.
   - Testing instructions: Start with what you already checked by hand (site types such as Jurassic Ninja, browsers used, flows tried; never internal `*.wordpress.com` site URLs) and what you did not, then step-by-step how to test the changes. Manual steps only: don't tell reviewers to run unit, e2e or lint commands, or list them as checks you did, since CI runs them.
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

Deduce all information from git history and code changes - do not ask the user for input, except for the "Why are these changes being made?" section as described above.
