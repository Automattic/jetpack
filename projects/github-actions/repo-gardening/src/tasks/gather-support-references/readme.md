# Gather support references

Happiness Engineers can comment on issues to add references to support interactions with customers that would like to be updated whenever the problem is solved.

This task creates a new comment that lists all support references found in all comments on the issue.

The tasks also monitors the number of support references it has gathered:

- If it gathered at least 10 issues, it will send a Slack message to the triage team to let them know it may be time to escalate the issue.
- Once it has gathered more than 10 issues, it will add a label to the issue with a number range that indicates the number of support references it has gathered.

## Rationale

Gathering all references into a single, actionable comment makes it easier to follow-up, without having to hunt for ticket references, especially on issues with a large amount of comments.
