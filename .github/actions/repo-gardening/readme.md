# GitHub repository gardening

This action includes multiple different tasks to automate some of the things we must do to each issue and PR that is handled in the repo.

Here is the current list of tasks handled by this action:

- Assign Issues: Adds assignee for issues which are being worked on, and adds the "In Progress" label.
- Add Milestone: Adds a valid milestone to all PRs that get merged and don't already include a milestone.
- Check Description: Checks the contents of a PR description, and ensure it matches our recommendations.
- Add Labels: Adds labels to PRs that touch specific features.
- WordPress.com Commit Reminder: Posts a comment on merged PRs to remind Automatticians to commit the matching WordPress.com change.

## Build your own

The action relies on [the Octokit JavaScript REST API client](https://github.com/octokit/rest.js). That client can be used to make requests to the GitHub API, and is available in this action via the `@actions/github` package. The API client interacts with the GitHub action environment via [the `@actions/core` package](https://github.com/actions/toolkit/tree/master/packages/core).

You can create your own new task and decide when it gets triggered (what event triggers it) it in `src/index.js`. The events when the action gets triggered are listed at the top of the main action file, in `.github/workflows/gardening.yml`.
