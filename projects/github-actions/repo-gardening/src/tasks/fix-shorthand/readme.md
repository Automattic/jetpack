# Fix shorthand

This GitHub Action workflow automatically fixes common incorrect shorthand on Automattic support interactions. The fix is not an exhaustive list -- we can add more incorrect formats as they are spotted. This workflow runs only on new comments on issues and PRs. It does not affect issues that are being edited, thus allowing the comment author to edit again if needed.

## Rationale

This is a Automattic-specific workflow that ensures that interaction IDs tracked on our repositories use the proper format that's described on PCYsg-5Xx-p2. Updating to the proper shorthand format will allow Automattic readers with the userscript to navigate to that interaction without having to manually visit it.
