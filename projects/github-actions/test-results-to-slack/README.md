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
    needs: run-tests
  
    steps:
      - name: 'Send Slack notification'
        uses: automattic/action-test-results-to-slack@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_channel: "your Slack channel"
          slack_username: 'Slack username'
          slack_icon_emoji: 'Slack icon emoji'
          suite_name: 'Your test suite name'
          rules_configuration_path: 'path/to/rules/configuration/file'
```

### Inputs

The action relies on the following parameters.

- (Required) `github_token` is a GitHub Access Token used to access GitHub's API. The token should be stored in a [secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository)
- (Required) `slack_token` is the Auth token of a bot that is installed on your Slack workspace. The token should be stored in a [secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). See the [instructions here](https://slack.com/intl/en-hu/help/articles/115005265703-Create-a-bot-for-your-workspace) on how to create a bot.
- (Required) `slack_channel` is the Slack channel ID where the messages will be sent to. Check the channel's details in your Slack app to get find the channel ID.
- (Optional) `slack_username` is the Slack username the bot will use to send messages. Defaults to "GitHub Reporter".
- (Optional) `slack_icon_emoji` is the icon emoji to use for messages. If not set it will use your app's default icon.
- (Optional) `suite_name` is the name of the test suite. It will be included in the message, and it can also be used to define notification rules. See more in the Rules section.
- (Optional) `rules_configuration_path` is the path to the configuration file that defines the rules. See more in the Rules section.

### Rules

You can configure different rules, to send notifications in multiple channels.

There are two types of rules: refs rules, used to send notifications for specific branches or tags and suite rules, used to send notifications for specific test suites.

#### Refs rules

You can create as many rules as you want. For each rule, you need to define the ref type (branch, tag) and ref name to match, and a list of channels to send the notification in case of a match. Optionally you can also define whether to exclude the default channel. By default, the default channel is not excluded and a notification will also be sent there.

Example:

```json
{
  "refs": [
	{
	  "type": "branch",
	  "name": "trunk",
	  "channels": [
		"CHANNEL_ID_1"
	  ],
	  "excludeDefaultChannel": true
	},
	{
	  "type": "branch",
	  "name": "dev",
	  "channels": [
		"CHANNEL_ID_2"
	  ]
	}
  ]
}
```

In the example, for runs on branch trunk, a notification will be sent to `CHANNEL_ID_1`. For runs on branch dev, a notification will be sent to `CHANNEL_ID_2` and to the default channel.

#### Suites rules

You can create as many suites rules as you want. For each rule, you need to define the suite name to match, and a list of channels to send the notification in case of a match. Optionally you and also define whether to exclude the default channel. By default, the default channel is not excluded.

Example:

```json
{
  "suites": [
	{
	  "name": "Smoke tests",
	  "channels": [
		"CHANNEL_ID_1"
	  ]
	}
  ]
}
```

In the example, for runs with `suite_name` set to "Smoke tests", a notification will be sent to `CHANNEL_ID_1` and to the default channel.

## License

This project is licensed under the GPL2+ License - see the LICENSE.txt file for details.
