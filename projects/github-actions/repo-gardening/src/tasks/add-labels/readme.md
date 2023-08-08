# Add Labels

Add labels to PRs that touch specific features.

## Rationale

Instead of having to manually add labels for each feature that is touched in a given PR, let's look at the list of changed files in that PR, and automatically apply matching labels.

## Usage

- Set the `task: addLabels` task as part of the workflow. 
- Optionally pass custom values `[{"path/": "label"}]` to add labels to certain changed paths.  

Example: 
```
  ...
  with:
    # Required
    tasks: 'addLabels'
    # Optional
    add_labels: '[
        {"path": "projects/your-project/", "label": "[Project] Your Project"},
        {"path": "somepath/", "label": "Some label"}
      ]'
```
