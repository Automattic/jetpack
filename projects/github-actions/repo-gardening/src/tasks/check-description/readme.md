# Check PR description

Checks the contents of a PR, and post a comment on the PR with feedback to help the PR author improve. That comment is then updated as the PR is updated.

The comment offers feedback on multiple things, all listed in the `getStatusChecks()` function.

## Usage

- This task is best used in combination with a PR template that will help the PR author build the best description they can. You can use [this PR template](https://github.com/Automattic/jetpack/blob/94df955c1b37fa4763e7c6d88853b4efa9416c9d/.github/PULL_REQUEST_TEMPLATE.md) as an example.
- This task also checks for the presence of a changelog entry on the PR. That entry must be built using [the Changelogger package](https://packagist.org/packages/automattic/jetpack-changelogger).
- The posted comment includes links to [the Jetpack monorepo](https://github.com/Automattic/Jetpack/), so may not be useful when used by third-parties.

## Rationale

When one creates a PR, it's best if it contains enough details and information for the PR reviewers to be able to test and review the changes. This is why we created a PR template that can help one add all the necessary information. This action ensures that the template is respected.
