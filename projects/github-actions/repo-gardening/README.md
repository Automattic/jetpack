# GitHub Repository Gardening Action

This GitHub Action includes multiple tasks, to automate some of the things we must do to each issue and PR that is handled in an Automattic repository.

**Note**: this action addresses needs and uses standards that are specific to Automattic. They may not be useful to you.

Here is the current list of tasks handled by this action:

- Assign Issues (`assignIssues`): Adds assignee for issues which are being worked on, and adds the "In Progress" label.
- Add Milestone (`addMilestone`): Adds a valid milestone to all PRs that get merged and don't already include a milestone.
- Check Description (`checkDescription`): Checks the contents of a PR description, and ensure it matches our recommendations.
- Add Labels (`addLabels`): Adds labels to PRs that touch specific features.
- Clean Labels (`cleanLabels`): Removes Status labels once a PR has been merged.
- WordPress.com Commit Reminder (`wpcomCommitReminder`): Posts a comment on merged PRs to remind Automatticians to commit the matching WordPress.com change.
- Notify Design (`notifyDesign`): Sends a Slack Notification to the Design team to request feedback, based on labels applied to a PR.
- Notify Editorial (`notifyEditorial`): Sends a Slack Notification to the Editorial team to request feedback, based on labels applied to a PR.
- Flag OSS (`flagOss`): flags entries by external contributors, adds an "OSS Citizen" label to the PR, and sends a Slack message.
- Triage New Issues (`triageNewIssues`): Adds labels to new issues based on issue content.
- Gather support references (`gatherSupportReferences`): Adds a new comment with a list of all support references on the issue, and escalates that issue via a Slack message if needed.
- Reply to customers Reminder ( `replyToCustomersReminder` ): sends a Slack message about closed issues to remind Automatticians to update customers.

Some of the tasks are may not satisfy your needs. If that's the case, you can use the `tasks` option to limit the action to the list of tasks you need in your repo. See the example below to find out more.

## Usage

### Example

In the example below, we'll set up the action to run 2 tasks (`cleanLabels` and `notifyDesign`):

```yml
name: Repo Gardening

on:
  # We need to listen to all these events to catch all scenarios
  # where notifying the Design team or cleaning labels may be necessary.
  # Refer to src/index.js to see a list of all events each task needs to be listen to.
  pull_request_target:
    types: ['closed', 'labeled']

jobs:
  repo-gardening:
    name: 'Clean up labels, and notify Design when necessary'
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request_target' || github.event.pull_request.head.repo.full_name == github.event.pull_request.base.repo.full_name
    timeout-minutes: 10  # 2021-03-12: Successful runs seem to take a few seconds, but can sometimes take a lot longer since we wait for previous runs to complete.

    steps:
     - name: Checkout
       uses: actions/checkout@v3

     - name: Setup Node
       uses: actions/setup-node@v3
        with:
          node-version: lts/*

     - name: Wait for prior instances of the workflow to finish
       uses: softprops/turnstyle@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

     - name: 'Run gardening action'
       uses: automattic/action-repo-gardening@v3
       with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_design_channel: ${{ secrets.SLACK_DESIGN_CHANNEL }}
          tasks: 'cleanLabels,notifyDesign'
```

### Inputs

The action relies on the following parameters. 

- (Required) `github_token` is a GitHub Access Token used to access GitHub's API. The user account associated with the token is the one that will be seen as posting the checkDescription comment, adding and removing labels, and so on. If omitted, the standard token for the github-actions bot will be used.
- (Optional) `tasks` allows for running selected tasks instead of the full suite. The value is a comma-separated list of task identifiers. You can find the list of the different tasks (and what event it's attached to) in `src/index.js`.
- (Optional) `slack_token` is the Auth token of a bot that is installed on your Slack workspace. The token should be stored in a [secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). See the instructions below to create a bot.
- (Optional) `slack_design_channel` is the Slack public channel ID where messages for the design team will be posted. Again, the value should be stored in a secret.
- (Optional) `slack_editorial_channel` is the Slack public channel ID where messages for the Editorial team will be posted. Again, the value should be stored in a secret.
- (Optional) `slack_team_channel` is the Slack public channel ID where general notifications about your repo should be posted. Again, the value should be stored in a secret.
- (Optional) `slack_he_triage_channel` is the Slack public channel ID where messages for the HE Triage team will be posted. The value should be stored in a secret.
- (Optional) `slack_quality_channel` is the Slack public channel ID where issues needing extra triage / escalation will be sent. The value should be stored in a secret.
- (Optional) `reply_to_customers_threshold`. It is optional, and defaults to 10. It is the minimum number of support references needed to trigger an alert that we need to reply to customers.

#### How to create a Slack bot and get your SLACK_TOKEN

To create a bot and get your `SLACK_TOKEN`, follow [the general instructions here](https://slack.com/intl/en-hu/help/articles/115005265703-Create-a-bot-for-your-workspace):

- Go to [api.slack.com/apps?new_app=1](https://api.slack.com/apps?new_app=1)
- After creating your app, provide basic information about the display of your app.
- Add the "Bots" feature to your app; in the process, you'll be offered the option to add permissions. You can give it the `chat:write`, `chat:write.customize`, and `chat:write.public` permissions.
- Once you've done all this, you can install the app in your workspace.
- Go to "OAuth & Permissions" in your app settings, and copy the `Bot User OAuth Token` value.

To get the channel ID of the channel where you'd like to post, copy one of the messages posted in the channel, and copy the first ID that appears in that URL.

### PR Checkout

Certain tasks require filesystem access to the PR, which `pull_request_target` does not provide. To accommodate this, you'll need to include a step to check the PR out in a subdirectory, like

```yaml
     - name: Checkout the PR
       if: github.event_name == 'pull_request_target'
       uses: actions/checkout@v3
       with:
         ref: ${{ github.event.pull_request.head.ref }}
         repository: ${{ github.event.pull_request.head.repo.full_name }}
         # DO NOT run any code in this checkout. Not even an `npm install`.
         path: ./pr-checkout
```
As the comment says, **do not** run any code in that checkout, not even an `npm install` or the like. Read [this article](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/) to learn why.

Then pass the path as environment variable to the repo-gardening action, like
```yaml
     - name: 'Run gardening action'
       uses: automattic/action-repo-gardening@v3
       env:
         PR_WORKSPACE: ${{ github.workspace }}${{ github.event_name == 'pull_request_target' && '/pr-checkout' || '' }}
       with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          ...
```

## Credits

This action was originally based off [`@wordpress/project-management-automation`](https://www.npmjs.com/package/@wordpress/project-management-automation).

## License

This project is licensed under the GPL2+ License - see the LICENSE.txt file for details.
