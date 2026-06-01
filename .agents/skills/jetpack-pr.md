---
description: Create a pull request for Jetpack changes using the PR template
---

Create a pull request for the current branch using Jetpack's PR template.

Instructions:
1. Check git status and analyze all commits from trunk to HEAD
2. Check if changes include any projects (projects/plugins/*, projects/packages/*, projects/github-actions/*, or projects/js-packages/*):
   - If yes, verify a changelog entry exists in the project's changelog/ directory
   - If no changelog exists, follow the instructions in `.agents/skills/jetpack-changelog.md` first to create one
   - If changes are only to .claude/, docs, or non-project files, skip changelog check
3. Push the branch to the right remote (see "Choosing the remote" below)
4. Prepare the PR content using the sections from .github/PULL_REQUEST_TEMPLATE.md:
   - Title: Clear summary of changes
   - Fixes #: Link to issue if applicable (or remove if none)
   - Proposed changes: Bullet points of functional changes
   - Testing instructions: Step-by-step how to test the changes
   - In the testing instructions, also state what you tested and what you did NOT test, so reviewers know where to focus. If you have a test site where the bug can be reproduced (e.g. a Jurassic Ninja site), include its URL — but never include private `*.wordpress.com` internal site URLs in the PR body; use the p2 shorthand (e.g. `peKye1-1Z1-p2`) instead.
5. If the diff touches UI (admin pages, blocks, components, CSS/SCSS, or JS/TSX under `projects/plugins/*` or `projects/js-packages/*`), suggest capturing real-screen before/after screenshots on a Jurassic Ninja site via the `jetpack-screenshot` skill and including them in the PR body. Skip the suggestion when the PR is purely backend/docs/tooling.
6. Create the PR using `gh pr create`, passing the prepared content via `--title` and `--body-file <path>` (never `--body` — heredoc escaping breaks on backticks and special characters). Always include `--assignee @me`.
7. Add required labels:
   - `[Status] *` - use `[Status] In Progress` by default, or `[Status] Needs Review` if ready for review
8. After the PR is created, follow up on automated feedback (see "After opening the PR" below).

When using `--title` and `--body-file` with `gh pr create`, the template is not auto-filled; you must format the PR body to match the template structure yourself. Alternatively, omit both flags to open an editor with the template pre-filled. Deduce all information from git history and code changes - do not ask the user for input.

## Choosing the remote

Automatticians have push access to `Automattic/jetpack` and should push branches directly there, not to a fork. Branches in the canonical repo get full CI signal (fork PRs have restricted access to GitHub Actions secrets, so some workflows and labels behave differently or don't run at all), and reviewers can push follow-up commits to the branch — both make review faster.

The decision is driven by **whether the authenticated user has push access**, not by what `origin` happens to point at — a public clone can have `origin = Automattic/jetpack` without push rights, and a contributor with push access may still have `origin` pointing at a personal fork.

Run these two checks before pushing:

```bash
gh api repos/Automattic/jetpack --jq .permissions.push 2>/dev/null   # "true" if user has push access
git remote -v                                                        # see which remotes exist and where they point
```

Then:

- **`.permissions.push` is `true`**:
  - Identify (or create) a remote pointing at `git@github.com:Automattic/jetpack.git`. Inspect `git remote -v`; the repo's `docs/git-workflow.md` uses the name `jetpack`, so prefer that. Make the step idempotent — do not blindly run `git remote add`, it errors if the name is taken:
    ```bash
    if git remote get-url jetpack >/dev/null 2>&1; then
      git remote set-url jetpack git@github.com:Automattic/jetpack.git
    else
      git remote add jetpack git@github.com:Automattic/jetpack.git
    fi
    ```
    (If `origin` already points at `Automattic/jetpack`, you can just use `origin` and skip the extra remote.)
  - Push the branch to that remote with `git push -u <remote> HEAD`. If origin was a fork, tell the user once what you're doing and why ("Detected push access to Automattic/jetpack — pushing the branch there directly so reviewers and bots have full CI signal").
  - `gh pr create` will default to this remote once the branch tracks it.
- **`.permissions.push` is `false` or the call errors** → external contributor without push access. Check `git remote -v` for a writable remote (typically a personal fork). Two sub-cases:
  - **A fork remote exists** (e.g. `origin` points at `<user>/jetpack`) → push to it as normal. `gh pr create` will open the PR against `Automattic/jetpack`.
  - **No fork remote exists** (e.g. the user cloned `Automattic/jetpack` directly without forking first) → don't try to push to the canonical remote. Ask the user once whether to run `gh repo fork --remote --remote-name=fork Automattic/jetpack` to create their fork and add it as a `fork` remote, then push the branch to `fork`. Don't do this silently — creating a fork creates a publicly-visible repository under the user's account.

Do not ask for confirmation before switching remotes — announce the action and do it. The operation is non-destructive (it only adds/updates a remote and creates a branch on it).

## After opening the PR

PRs trigger several bots and CI checks that leave actionable comments (linting, changelog verification, project-version checks, test results, etc.). Before a human reviews:

1. Wait a minute or two, then read the PR's comments and check runs:
   ```bash
   gh pr view --comments
   gh pr checks
   ```
2. Address any bot feedback in new commits on the same branch. Common ones: missing changelog entries, lint failures, Phan findings, project version fixups.
3. Once everything bot-flagged is resolved, leave a comment on the PR noting that automated feedback has been addressed — this signals to human reviewers that the PR is ready.
4. Optionally, request a GitHub Copilot review on top of human review.
