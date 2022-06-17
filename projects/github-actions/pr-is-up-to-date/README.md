# PR is Up-to-Date

This [Github Action](https://github.com/features/actions) will check that PRs in the repo
are up to date with respect to a tag.

The idea is to work like GitHub's "Require branches to be up to date before merging" setting,
but using one or more tags rather than the HEAD of the target branch.

## Example

```yaml
name: PR is up-to-date
on:
  pull_request_target:
    branches: [ main ]
  push:
    tags: [ latest ]

jobs:
  check:
    name: Check
    runs-on: ubuntu-latest
    steps:
      - name: Handle pull request
        if: github.event_name != 'push'
        uses: Automattic/action-pr-is-up-to-date@v2
        with:
          token: ${{ secrets.API_TOKEN_GITHUB }}
          tags: latest

      - name: Handle tag push
        if: github.event_name == 'push'
        uses: Automattic/action-pr-is-up-to-date@v2
        with:
          token: ${{ secrets.API_TOKEN_GITHUB }}
          tag: latest
```

## Usage

This action is intended to be triggered by `pull_request_target` or `pull_request` targeting the specified branch, and by a `push` to the specified tags.
It will not work for pushes to anything else.

### On pull request

```yaml
- uses: Automattic/action-pr-is-up-to-date@v2
  with:
    # Branch to use. Defaults to the repository's default branch.
    branch:

    # Specify the "context" for the status to set. This is what shows up in the
    # PR's checks list. The default is "PR is up to date".
    status:

    # Specify the "description" when the PR is out of date.
    # The default is "This PR needs a ${{ inputs.branch }} merge or rebase.".
    description-fail:

    # Specify the "description" when the PR is up to date. The default is empty.
    description-ok:

    # Specify the tags that are used for the check, separated by whitespace.
    # The tags must point to commits that are reachable from the input branch.
    # For backwards compatibility, if `tags` is not set but `tag` is, the single tag in `tag` will be used here.
    tags:

    # GitHub Access Token. The user associated with this token will show up
    # as the "creator" of the status check.
    token:
```

The current pull request will be checked for being up to date with the specified tags. The status check will be set accordingly.

### On tag push

```yaml
- uses: Automattic/action-pr-is-up-to-date@v2
  with:
    # Branch to use. Defaults to the repository's default branch.
    branch:

    # Specify the "context" for the status to set. This is what shows up in the
    # PR's checks list. The default is "PR is up to date".
    status:

    # Specify the "description" when the PR is out of date.
    # The default is "This PR needs a ${{ inputs.branch }} merge or rebase.".
    description-fail:

    # Specify the tag that is used for the check. The tag must point to a commit that
    # is reachable from the input branch.
    tag:

    # Only process PRs that touch a file matching one of these paths (one path per line).
    # Any path format accepted by `git diff` may be used.
    paths:

    # GitHub Access Token. The user associated with this token will show up
    # as the "creator" of the status check.
    token:
```

All open pull requests targeting the specified branch will be checked for being up to date with the specified tag.
Any that are not will have the status check set to a failing status.

Pull requests to process may be filtered by setting `paths`. In that case, only PRs that affect the specified paths will be processed.

### Updating tags

You may update tags manually, for example from the command line with
```
git tag --force $TAG $COMMIT
git push --force origin $TAG
```

Or you might use another action to examine pushes to your branch and update the tags accordingly.
In that case, you'd want to make sure to use a custom access token as [events triggered by the stock `GITHUB_TOKEN` will not trigger workflows](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow) and you'll want this workflow to be triggered by the tag push.

### Multiple tags

As of v2, this action supports use of multiple tags. The intended use is for a monorepo where you want separate tags per project.

* On pull request, you'd analyze the paths affected by the PR to determine which tags apply and pass all relevant tags as `tags`.
* On push to any of the tags, you'd pass that tag as `tag` and set `paths` to the paths that tag applies to.

Perhaps something like this:

```yaml
- name: Determine tags for PR or paths for pull request
  id: determine
  run: some-script.sh
- name: Check PR
  if: github.event_name == 'pull_request'
  uses: Automattic/action-pr-is-up-to-date@v2
  with:
    tags: steps.determine.outputs.pr-tags
- name: Check tag push
  if: github.event_name == 'push'
  uses: Automattic/action-pr-is-up-to-date@v2
  with:
    tag: steps.determine.outputs.push-tag
    paths: steps.determine.outputs.push-paths
```
