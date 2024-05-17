# Triage Issues

This task is triggered for newly opened issues, as well as existing issues being labeled.

It is used to add labels and potentially send Slack notifications to warn the Quality team about important issues.

Here are the labels added to newly opened issues. Those labels are inferred from the issue content.

1. Add a `[Plugin]` label if a specific plugin is impacted by the issue.
2. Add a `[Pri]` label if we can determine the severity of the issue from the issue contents. If we cannot, we add a `[Pri] TBD` label.
3. Add a `[Platform]` label if the issue is specific to a platform.

Slack notifications are only sent in specific scenarios:

1. If the issue is a bug, and is a High or Blocker priority,
2. If the issue is a bug, and no Priority could be inferred from the issue content. This is currently only enabled in the Calypso repo.

This is best used in combination with GitHub [issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository#creating-issue-forms).

## Rationale

* Adding labels to new issues allows each team to get quick notices of issues that need their attention, without having to wait for manual triage. Priority also allows them to sort through the issues in the right order.
* Flagging important issues with a Slack notification allows the Quality team to get notified of important issues, and take action on them.
* Flagging issues that have no priority allows the Quality team to triage them manually, and add a priority label.
