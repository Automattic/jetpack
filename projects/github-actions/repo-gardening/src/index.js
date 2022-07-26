const { setFailed, getInput } = require( '@actions/core' );
const { context, getOctokit } = require( '@actions/github' );
const addLabels = require( './tasks/add-labels' );
const addMilestone = require( './tasks/add-milestone' );
const assignIssues = require( './tasks/assign-issues' );
const checkDescription = require( './tasks/check-description' );
const cleanLabels = require( './tasks/clean-labels' );
const flagOss = require( './tasks/flag-oss' );
const gatherSupportReferences = require( './tasks/gather-support-references' );
const notifyDesign = require( './tasks/notify-design' );
const notifyEditorial = require( './tasks/notify-editorial' );
const replyToCustomersReminder = require( './tasks/reply-to-customers-reminder' );
const triageNewIssues = require( './tasks/triage-new-issues' );
const wpcomCommitReminder = require( './tasks/wpcom-commit-reminder' );
const debug = require( './utils/debug' );
const ifNotClosed = require( './utils/if-not-closed' );
const ifNotFork = require( './utils/if-not-fork' );

const automations = [
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
		event: 'push',
		task: wpcomCommitReminder,
	},
	{
		event: 'pull_request_target',
		action: [ 'opened' ],
		task: flagOss,
	},
	{
		event: 'issues',
		action: [ 'opened', 'reopened' ],
		task: triageNewIssues,
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

	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( token );

	// Get info about the event.
	const eventPayload = context.payload;
	const eventAction = eventPayload.action;

	debug( `main: Received event = '${ context.eventName }', action = '${ eventPayload.action }'` );

	const taskList = ( getInput( 'tasks' ) || 'all' ).split( ',' ).map( v => v.trim() );

	for ( const { event, action, task } of automations ) {
		// If the action provided a custom list of tasks to run
		// and if the task is not one of them, bail.
		if ( ! taskList.includes( 'all' ) && ! taskList.includes( task.name ) ) {
			continue;
		}

		if (
			event === context.eventName &&
			( action === undefined || action.includes( eventAction ) )
		) {
			try {
				debug( `main: Starting task ${ task.name }` );
				await task( eventPayload, octokit );
			} catch ( error ) {
				setFailed( `main: Task ${ task.name } failed with error: ${ error }` );
			}
		}
	}

	debug( 'main: All done!' );
} )();
