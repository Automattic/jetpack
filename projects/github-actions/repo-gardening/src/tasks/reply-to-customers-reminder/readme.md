# Reply to Customers Reminder

When a high priority issue gets closed, we'll remind the support triage team via Slack, so they can now reply to all the customers impacted by this issue.

This is only useful when used in combination with the `gatherSupportReferences` task.

The Slack message is sent in the following conditions:

- When the issue is closed.
- The issue must have one of the following labels: `[Pri] High` , `[Pri] BLOCKER`.
- The issue must have at least a certain number of gathered support references. That number can be customized via the `reply_to_customers_threshold` parameter, and defaults to 10.

This task relies on 2 extra parameters, passed to the action: `slack_token` and `slack_he_triage_channel`.

## Rationale

If we warn the triage team as soon as an issue gets closed, they can make sure to reply to customers in a timely manner.
