# PR is Up-to-Date

This [Github Action](https://github.com/features/actions) will check that PRs in the repo
are up to date with respect to a tag.

The idea is to work like GitHub's "Require branches to be up to date before merging" setting,
but using a tag rather than the HEAD of the target branch.

## Example

```yaml
name: PR is up-to-date
on:
  pull_request_target:
    branches: [ master ]
  push:
    tags: [ latest ]

jobs:
  check:
    name: Check
    runs-on: ubuntu-latest
    steps:
      - uses: Automattic/action-pr-is-up-to-date@v1
        with:
          token: ${{ secrets.API_TOKEN_GITHUB }}
          tag: latest
```

## Usage

This action is intended to be triggered by `pull_request_target` or `pull_request` targeting the specified branch, and by a `push` to the specified tag.
It will not work for pushes to anything else.

```yaml
- uses: Automattic/action-pr-is-up-to-date@v1
  with:
    # Branch to use. Defaults to the repository's default branch.
    branch:

    # Specify the "context" for the status to set. This is what shows up in the
    # PR's checks list. The default is "PR is up to date with ${{ inputs.tag }}".
    status:

    # Specify the "description" when the PR is out of date.
    # The default is "This PR needs a ${{ inputs.branch }} merge or rebase.".
    description-fail:

    # Specify the "description" when the PR is up to date. The default is empty.
    description-ok:

    # Specify the tag that is used for the check. The tag must point to a commit that
    # is reachable from the input branch.
    tag:

    # GitHub Access Token. This token must allow for pushing to all relevant
    # branches of all relevant mirror repos.
    token:
```

The specified tag must, of course, exist. You may update it manually, for example from the command line with
```
git tag --force $TAG $COMMIT
git push --force origin $TAG
```
Or you might use another action to examine pushes to your branch and update the tag accordingly.
Either way, the push of the tag will update the status on all open PRs targeting the branch.
