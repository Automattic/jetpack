# Notify Design

Send a Slack notification to the design team when we need their input on a PR.

## Rationale

Adding a label to a PR allows us to signify that we'd like input from our design team on a project.

## How to set it up

To set this up, you'll need to add 2 new secrets to your GitHub repository, [as explained here](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository):

- `SLACK_TOKEN` is the Auth token of a bot that is installed on your Slack workspace.
- `SLACK_DESIGN_CHANNEL` is the public channel's ID where you'll want messages to be posted.

To create a bot and get your `SLACK_TOKEN`, follow [the general instructions here](https://slack.com/intl/en-hu/help/articles/115005265703-Create-a-bot-for-your-workspace):

- Go to [api.slack.com/apps?new_app=1](https://api.slack.com/apps?new_app=1)
- After creating your app, provide basic information about the display of your app.
- Add the "Bots" feature to your app; in the process, you'll be offered the option to add permissions. You can give it the `chat:write`, `chat:write.customize`, and `chat:write.public` permissions.
- Once you've done all this, you can install the app in your workspace.
- Go to "OAuth & Permissions" in your app settings, and copy the `Bot User OAuth Token` value.

To get the channel ID of the channel where you'd like to post, copy one of the messages posted in the channel, and copy the first ID that appears in that URL.
