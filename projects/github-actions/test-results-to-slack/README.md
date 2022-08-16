# Test results to Slack GitHub Action

This GitHub Action will send Slack messages with the tests results.

## How it works

The action will send notifications with the workflow status grouped by a unique identifier depending on the trigger event. Grouping means that a main message will be created and this message will be updated with new status information as long as new workflows will run for the same event.

For pull_request, the unique identifier will be `pr-${number}`, so the notifications will be grouped by PR number.
For push, the unique identifier will be `commit-${id}`, so the notifications will be grouped by commit id.
For schedule, the unique identifier will be `sched-${timestamp}`. For this event there will be no grouping. Each new run will have its own main message. 

If failed and no main message exists, a main message is created and then a reply is sent with the failed run details.

If failed and a main message exists, the main message is updated with the latest info and a reply is sent with the new failed run details.

If success and a main message exists, the main message gets updated with the latest status and run info.

If success and no main message is found nothing is sent. This is to reduce noise.


## Usage

### Example

...

```yml

```

### Inputs

...


#### How to create a Slack bot and get your SLACK_TOKEN

...

## License

This project is licensed under the GPL2+ License - see the LICENSE.txt file for details.
