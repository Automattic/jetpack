# Update Board

This task is triggered every time labels are updated on an issue.

For now, we specifically look for updates to the "[Pri]" labels. If the issue is part of our Project board, we'll want to automatically update the Priority field for that issue in the board, to match the label used in the issue.

## Rationale

* Ensuring our project board is as up to date as possible ensures that folks on each team can prioritize their work appropriately.
