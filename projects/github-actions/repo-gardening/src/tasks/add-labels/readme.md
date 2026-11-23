# Add Labels

Add labels to PRs that touch specific features.

## Rationale

Instead of having to manually add labels for each feature that is touched in a given PR, let's look at the list of changed files in that PR, and automatically apply matching labels.

When new commits are pushed or the base branch changes, project labels (`[Action]`, `[Package]`, `[Plugin]`, `[JS Package]`) that no longer match any changed file are removed, but only if the `github-actions[bot]` account applied them. Labels someone added by hand stay. If you run the action with a token for another account, nothing is removed.

## Usage

- Set the `task: addLabels` task as part of the workflow.
- Optionally pass custom path to label mappings as a JSON array of `{"path": "...", "label": "..." }` objects. Paths are matched as prefixes, no wild cards or regular expressions are supported.

Example:
```
  ...
  with:
    # Required
    tasks: 'addLabels'
    # Optional
    add_labels: |
      [
        { "path": "projects/your-project/", "label": "[Project] Your Project" },
        { "path": "somepath/", "label": "Some label" }
      ]
```
