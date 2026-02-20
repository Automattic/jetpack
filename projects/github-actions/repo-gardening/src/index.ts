import { setFailed, getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import addLabels from './tasks/add-labels';
import addMilestone from './tasks/add-milestone';
import assignIssues from './tasks/assign-issues';
import checkDescription from './tasks/check-description';
import checkIfDocsNeeded from './tasks/check-if-docs-needed';
import cleanLabels from './tasks/clean-labels';
import flagOss from './tasks/flag-oss';
import gatherSupportReferences from './tasks/gather-support-references';
import notifyDesign from './tasks/notify-design';
import notifyEditorial from './tasks/notify-editorial';
import replyToCustomersReminder from './tasks/reply-to-customers-reminder';
import triageIssues from './tasks/triage-issues';
import debug from './utils/debug.ts';
import ifNotClosed from './utils/if-not-closed.ts';
import ifNotFork from './utils/if-not-fork.ts';
import type { Automation, TaskPayload } from './types.ts';

const automations: Automation[] = [
	{
		event: 'pull_request_target',
		action: [ 'opened', 'synchronize', 'edited' ],
		task: ifNotFork( assignIssues ),
	},
	{
		event: 'push',
		task: addMilestone,
	},
	{
		event: 'pull_request_target',
		action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
		task: ifNotClosed( addLabels ),
	},
	{
		event: 'pull_request_target',
		action: [ 'closed' ],
		task: cleanLabels,
	},
	{
		event: 'issues',
		action: [ 'closed' ],
		task: cleanLabels,
	},
	{
		event: 'pull_request_target',
		action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
		task: ifNotClosed( checkDescription ),
		// Note this task requires a PR checkout. See README.md for details.
	},
	{
		event: 'pull_request_target',
		action: [ 'labeled' ],
		task: ifNotClosed( notifyDesign ),
	},
	{
		event: 'pull_request_target',
		action: [ 'labeled' ],
		task: ifNotClosed( notifyEditorial ),
	},
	{
		event: 'pull_request_target',
		action: [ 'opened' ],
		task: flagOss,
	},
	{
		event: 'pull_request_target',
		action: [ 'closed' ],
		task: ifNotFork( checkIfDocsNeeded ),
	},
	{
		event: 'issues',
		action: [ 'opened', 'reopened', 'labeled' ],
		task: triageIssues,
	},
	{
		event: 'issues',
		action: [ 'opened', 'reopened', 'edited' ],
		task: gatherSupportReferences,
	},
	{
		event: 'issue_comment',
		action: [ 'created' ],
		task: gatherSupportReferences,
	},
	{
		event: 'issues',
		action: [ 'closed' ],
		task: replyToCustomersReminder,
	},
];

( async function main() {
	const token = getInput( 'github_token' );
	if ( ! token ) {
		setFailed( 'main: Input `github_token` is required' );
		return;
	}

	const octokit = getOctokit( token );

	// Get info about the event.
	const eventPayload = context.payload;
	const eventAction = eventPayload.action;

	debug( `main: Received event = '${ context.eventName }', action = '${ eventPayload.action }'` );

	const taskList = ( getInput( 'tasks' ) || 'all' ).split( ',' ).map( ( v: string ) => v.trim() );

	for ( const { event, action, task } of automations ) {
		// If the action provided a custom list of tasks to run
		// and if the task is not one of them, bail.
		if ( ! taskList.includes( 'all' ) && ! taskList.includes( task.name ) ) {
			continue;
		}

		if (
			event === context.eventName &&
			( action === undefined || action.includes( eventAction ?? '' ) )
		) {
			try {
				debug( `main: Starting task ${ task.name }` );
				// Event-name matching above guarantees the payload type matches the task.
				const dispatch = task as ( p: TaskPayload, o: typeof octokit ) => Promise< void > | void;
				await dispatch( eventPayload as TaskPayload, octokit );
			} catch ( error: unknown ) {
				setFailed( `main: Task ${ task.name } failed with error: ${ error }` );
			}
		}
	}

	debug( 'main: All done!' );
} )();
