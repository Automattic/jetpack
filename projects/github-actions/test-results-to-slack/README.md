# Test results to Slack GitHub Action

This GitHub Action will send Slack messages with the tests results.

## How it works

The action will send notifications with the workflow status grouped by a unique identifier depending on the trigger event. Grouping means that a main message will be created and this message will be updated with new status information as long as new workflows will run for the same event.

For pull_request, the notifications will be grouped by PR number.
For push, the notifications will be grouped by commit id.
For schedule event there will be no grouping. Each new run will have its own main message. 

If workflow failed and no main message exists, a main message is created and then a reply is sent with the failed run details.

If workflow failed and a main message exists, the main message is updated with the latest info and a reply is sent with the new failed run details.

If workflow conclusion is success and a main message exists, the main message gets updated with the latest status and run info.

If workflow conclusion is success and no main message is found nothing is sent.


## Usage

### Example

```yml
name: Tests

on:
  pull_request:
  push:

jobs:
  run-tests:
    [...]

  slack-notification:
    name: 'Send Slack notification'
    runs-on: ubuntu-latest

    steps:
      - name: 'Send Slack notification'
        uses: automattic/action-test-results-to-slack@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_channel: "your Slack channel"
          slack_username: 'Slack username'
          slack_icon_emoji: 'Slack icon emoji'
```

### Inputs

The action relies on the following parameters.

- (Required) `github_token` is a GitHub Access Token used to access GitHub's API. The token should be stored in a [secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository)
- (Required) `slack_token` is the Auth token of a bot that is installed on your Slack workspace. The token should be stored in a [secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). See the [instructions here](https://slack.com/intl/en-hu/help/articles/115005265703-Create-a-bot-for-your-workspace) on how to create a bot.
- (Required) `slack_channel` is the Slack channel ID where the messages will be sent to.
- (Optional) `slack_username` is the Slack username the bot will use to send messages. Defaults to "GitHub Reporter".
- (Optional) `slack_icon_emoji` is the icon emoji to use for messages. If not set it will default to different icons depending on status.

## License

This project is licensed under the GPL2+ License - see the LICENSE.txt file for details.
