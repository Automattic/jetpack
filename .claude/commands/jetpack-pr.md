---
description: Create a pull request for Jetpack changes using the PR template
---

Create a pull request for the current branch using Jetpack's PR template.

Instructions:
1. Check git status and analyze all commits from trunk to HEAD
2. Check if changes include any projects (projects/plugins/* or projects/packages/*):
   - If yes, verify a changelog entry exists in the project's changelog/ directory
   - If no changelog exists, run `/jetpack-changelog` first to create one
   - If changes are only to .claude/, docs, or non-project files, skip changelog check
3. Ensure the branch is pushed to remote (push if needed)
4. Fill out the PR template (.github/PULL_REQUEST_TEMPLATE.md) with:
   - Title: Clear summary of changes
   - Fixes #: Link to issue if applicable (or remove if none)
   - Proposed changes: Bullet points of functional changes
   - Testing instructions: Step-by-step how to test the changes
5. Create the PR using `gh pr create` with the filled template

The `gh pr create` command will automatically use the template. Deduce all information from git history and code changes - do not ask the user for input.
