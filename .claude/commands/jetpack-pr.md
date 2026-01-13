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
4. Prepare the PR content using the sections from .github/PULL_REQUEST_TEMPLATE.md:
   - Title: Clear summary of changes
   - Fixes #: Link to issue if applicable (or remove if none)
   - Proposed changes: Bullet points of functional changes
   - Testing instructions: Step-by-step how to test the changes
5. Create the PR using `gh pr create`, providing the prepared content for the title and body (e.g., with `--title` and `--body` flags)
6. Add required labels:
   - `[Status] *` - use `[Status] In Progress` by default, or `[Status] Needs Review` if ready for review
   - `[Type] *` - choose the appropriate type label:
     - `[Type] Bug` - for bug fixes
     - `[Type] Enhancement` - for new features or improvements
     - `[Type] Janitorial` - for documentation, refactoring, or maintenance

When using `--title` and `--body` with `gh pr create`, the template is not auto-filled; you must format the PR body to match the template structure yourself. Alternatively, omit `--body` to open an editor with the template pre-filled. Deduce all information from git history and code changes - do not ask the user for input.
