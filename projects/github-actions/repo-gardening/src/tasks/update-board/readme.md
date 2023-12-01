# Update Board

This task is triggered every time labels are updated on an issue.

For now, we have 6 automations in place:

1. If an issue is classified as a bug (it has a "[Type] bug" label), we'll add it to our project board, if it's not already there. When it gets added to the board, it should also receive the "Needs Triage" status.
2. Look for updates to the "[Pri]" labels. We'll want to automatically update the Priority field for that issue in the board, to match the label used in the issue.
3. Look for the "Triaged" label. If it has been added to an issue, let's update the status to "Triaged" in the board.
4. Look for a mapping of labels <> team provided with the workflow. If we have that, we'll look at all the labels provided in the issue, and if any of them match a label in the mapping, we'll move the issue to the corresponding team column in the board.
5. If a team has specified a custom Slack Channel ID alongside their team <> label mapping, we'll send a Slack message to that channel when an issue is moved to that team's column in the board, and if that issue is a bug with a high or blocker priority.
6. If a team has specified a custom GitHub Project Board URL alongside their team <> label mapping, we'll add the issue to that team's column in the board, when the issue is labeled with a specific label in the mapping. That will allow teams that use their own boards for triage of their work or triage of work on specific features to have those issues added to their board automatically, so they get warned before to even have to look at the general project board.

## Rationale

* Ensuring our project board is as up to date as possible ensures that folks on each team can prioritize their work appropriately.

## Usage

- Set the `task: updateBoard` task as part of the workflow.
- Pass a custom list of label mappings as a JSON object, using `labels_team_assignments`. When specifying a new mapping, you must provide a unique feature name as key, and then a `team` value matching a column in your GitHub project board, as well as a `labels` array matching existing labels in use in your repo. No wild cards or regular expressions are supported for those arrays. You can also optionally pass a `slack_id`, matching a Slack channel ID where that team would like to be notified, as well as `board_id`, matching a GitHub project board URL where that team would like to have issues added automatically.
- **Note**: if you work in a repository in the Automattic organization, you do not need to pass a custom list. Instead, add your mappings to the existing `automatticAssignments` object in the `updateBoard` task.

Example:
```yml
  ...
  with:
    tasks: 'updateBoard'
    labels_team_assignments: |
      {
        "AI Tools": {
          "team": "Korvax",
          "labels": [
            "[Feature] AI Tools",
            "[Block] A Block Name"
          ],
          "slack_id": "CN2FSK7L4",
          "board_id": "https://github.com/users/yourname/projects/3"
        }
      }
```
