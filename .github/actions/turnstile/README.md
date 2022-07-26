# Turnstile

Ensure that previous runs of the current workflow for the current branch have completed before proceeding with the current run.

## Why?

GitHub Actions has [very limited ability](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#concurrency) to control concurrency of workflow or job runs:
You can have just one pending run that waits for an in-progress run to complete, with any additional submissions cancelling a previous pending run.
You can optionally cancel the in-progress run when a new run is submitted.

You can't have _multiple_ pending runs queued, as needed for something like building and pushing each commit to a mirror repo where you want to try to preserve the commit history as closely as possible.
You also can't directly run some initial steps in parallel before engaging the concurrency, although you could use multiple jobs (along with outputs and artifacts) to do it.

## Example

```yaml
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build
        run: npm build

      - name: Wait for earlier in-progress runs so deploys happen in order
        uses: ./.github/actions/turnstile

      - name: Deploy
        run: ...
```

## Usage

```yaml
- uses: ./.github/actions/turnstile
  with:
    # Polling interval, in seconds.
    poll-interval: 60

    # GitHub access token. Defaults to `github.token`.
    token: ${{ github.token }}
```

If you want to limit the maximum amount of time spent waiting, use GitHub's [timeout-minutes](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepstimeout-minutes) on the step. If you want to continue if the timeout expires, use GitHub's [continue-on-error](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepscontinue-on-error) on the step.

## How?

Using the current run's run ID, it first hits GitHub's [workflow run API](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run) to fetch the workflow ID and head branch.

Then it hits the [list workflow runs API](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs) to fetch up to 100 in-progress runs of the workflow for the branch. If any are returned with a lower run ID number, it sleeps for 60 seconds and repeats.

### Caveats

- If there are somehow more than 100 in-progress runs of the workflow, only the first 100 will be checked.
- Queued or pending runs will not be waited for.
- If you re-run a job it reuses the same run ID. Thus it won't wait for later jobs that are already in progress.
- If you often have many runs waiting on each other, the API calls involved could use up your [rate limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting).
- If your Actions usage is [metered](https://github.com/features/actions#pricing-details) (i.e. you've copied this into a private repo), the time spent waiting will cost you minutes.
- This is something of a hack. GitHub could do this sort of thing much better if they wanted to.

## Inspiration

This is inspired by https://github.com/softprops/turnstyle, which does much the same thing.

Differences:

- Written in bash rather than js, mainly to avoid requiring an install step.
- Fewer options.
- Comprehensive information on the API calls to allow for debugging.
- More efficient determination of the workflow ID and branch.
- Token as an input (with default) rather than as an environment variable.
