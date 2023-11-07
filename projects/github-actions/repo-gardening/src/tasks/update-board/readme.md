# Update Board

This task is triggered every time labels are updated on an issue.

For now, we have 3 automations in place, both of which only triggered if an issue is already on our Project board.

1. If an issue is classified as a bug (it has a "[Type] bug" label), we'll add it to our project board, if it's not already there. When it gets added to the board, it should also receive the "Needs Triage" status.
2. Look for updates to the "[Pri]" labels. We'll want to automatically update the Priority field for that issue in the board, to match the label used in the issue.
3. Look for the "Triaged" label. If it has been added to an issue, let's update the status to "Triaged" in the board.

## Rationale

* Ensuring our project board is as up to date as possible ensures that folks on each team can prioritize their work appropriately.
