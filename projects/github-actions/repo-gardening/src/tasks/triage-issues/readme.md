# Triage Issues

This task is triggered for newly opened issues, issues being reopened, as well as existing issues being labeled.

> [!NOTE]
> This is best used in combination with GitHub [issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository#creating-issue-forms), specifically forms following the templates in use in the Jetpack repo.

The task examines the issue contents as well as labels that may have been provided, and automatically triages the issue accordingly.

## Triaging actions

The task goes through 3 main triaging actions:

- It parses the issue contents and automatically adds labels based on that.
- It adds the issue to GitHub Project boards and updates board columns based on issue labels.
- It warns Product ambassadors when important issues (High or Blocker) come up.

### Adding labels

Here are the 4 types of labels added to newly opened issues. Those labels are inferred from the issue content.

1. Add a `[Plugin]` label if a specific plugin is impacted by the issue.
2. Add a `[Pri]` label if we can determine the severity of the issue from the issue contents. If we cannot, we add a `[Pri] TBD` label.
3. Add a `[Platform]` label if the issue is specific to a platform.
4. Add `[Feature]` and `[Feature Group]` labels based on the issue contents, based on AI recommendations. **This option is only available for Automattic-hosted repositories.**

### Triage issues to GitHub Project boards

For now, we have 6 Project Board automations in place:

1. If an issue is classified as a bug (it has a "[Type] bug" label), we'll add it to our project board, if it's not already there. When it gets added to the board, it should also receive the "Needs Triage" status.
2. Look for updates to the "[Pri]" labels. We'll want to automatically update the Priority field for that issue in the board, to match the label used in the issue.
3. Look for the "Triaged" label. If it has been added to an issue, let's update the status to "Triaged" in the board.
4. Look for a mapping of labels <> team provided with the workflow. If we have that, we'll look at all the labels provided in the issue, and if any of them match a label in the mapping, we'll move the issue to the corresponding team column in the board.
5. If a team has specified a custom Slack Channel ID alongside their team <> label mapping, we'll send a Slack message to that channel when an issue is moved to that team's column in the board, and if that issue is a bug with a high or blocker priority.
6. If a team has specified a custom GitHub Project Board URL alongside their team <> label mapping, we'll add the issue to that team's column in the board, when the issue is labeled with a specific label in the mapping. That will allow teams that use their own boards for triage of their work or triage of work on specific features to have those issues added to their board automatically, so they get warned before to even have to look at the general project board.

#### Usage

- Pass a custom list of label mappings in your workflow configuration, as a JSON object, using `labels_team_assignments`. When specifying a new mapping, you must provide a unique feature name as key, and then a `team` value matching a column in your GitHub project board, as well as a `labels` array matching existing labels in use in your repo. No wild cards or regular expressions are supported for those arrays. You can also optionally pass a `slack_id`, matching a Slack channel ID where that team would like to be notified, as well as `board_id`, matching a GitHub project board URL where that team would like to have issues added automatically.
- **Note**: if you work in a repository in the Automattic organization, you do not need to pass a custom list. Instead, add your mappings to the existing `automattic-label-team-assignments.js` in this GitHub action.

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

### Sending Slack notifications

Slack notifications are only sent in specific scenarios:

1. If the issue is a bug, and is a High or Blocker priority.
2. If the issue is a bug, and no Priority could be inferred from the issue content. This is currently only enabled in the Calypso repo.
3. If the issue is a bug, is a High or Blocker priority, and has been assigned to a specific team that has specified a Slack channel ID where they want to be warned.

## Rationale

* Adding labels to new issues allows each team to get quick notices of issues that need their attention, without having to wait for manual triage. Priority also allows them to sort through the issues in the right order.
* Flagging important issues with a Slack notification allows the Quality team to get notified of important issues, and take action on them.
* Flagging issues that have no priority allows the Quality team to triage them manually, and add a priority label.
* Ensuring our project boards are as up to date as possible ensures that folks on each team can prioritize their work appropriately.
