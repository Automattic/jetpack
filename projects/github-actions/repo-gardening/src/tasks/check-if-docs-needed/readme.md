# Check If Docs Needed

Uses AI to analyze PR diffs and descriptions to determine if changes are user-facing. If detected with medium or high confidence, applies the `[Status] UI Changes` label and sends a Slack notification to the product ambassadors channel.

## How it works

1. Fetches the PR diff and description
2. Sends content to OpenAI for analysis
3. If changes are determined to be user-facing (with medium or high confidence):
   - Adds the `[Status] UI Changes` label
   - Sends a Slack notification (if `slack_product_ambassadors_channel` is configured)

## Bailout conditions

The task skips processing when:

- No `openai_api_key` input is provided
- PR is from a fork (handled by the `ifNotFork` wrapper)
- PR already has `[Status] UI Changes` label
- PR title contains "revert"
- PR diff is too small to analyze (less than 50 characters)

## Rationale

User-facing changes often require documentation updates. This task helps identify PRs that may need docs review by automatically flagging them for the product ambassadors team.
