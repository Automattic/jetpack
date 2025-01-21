# Sync Labels

This task is triggered

#### Usage


Example:
```yml
  ...
  with:
    tasks: 'syncLabels'
    labels_source_repo: 'https://github.com/automattic/jetpack/'
```

### Sending Slack notifications

Slack notifications are sent to the Quality team when a new sync is triggered, and if you've specified a Slack token and Slack channel ID in your workflow configuration.

## Rationale

* 
