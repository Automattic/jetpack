/**
 * External dependencies
 */
const { debug, setFailed, getInput } = require( '@actions/core' );
const { context, getOctokit } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignIssues = require( './tasks/assign-issues' );
const addMilestone = require( './tasks/add-milestone' );
const addLabels = require( './tasks/add-labels' );
const cleanLabels = require( './tasks/clean-labels' );
const checkDescription = require( './tasks/check-description' );
const wpcomCommitReminder = require( './tasks/wpcom-commit-reminder' );
const notifyDesign = require( './tasks/notify-design' );
const notifyEditorial = require( './tasks/notify-editorial' );
const flagOss = require( './tasks/flag-oss' );
const triageNewIssues = require( './tasks/triage-new-issues' );
const ifNotFork = require( './if-not-fork' );
const ifNotClosed = require( './if-not-closed' );

const automations = [
	{
		event: 'pull_request',
		action: [ 'opened', 'synchronize', 'edited' ],
		task: ifNotFork( assignIssues ),
	},
	{
		event: 'push',
		task: addMilestone,
	},
	{
		event: 'pull_request',
		action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
		task: ifNotClosed( addLabels ),
	},
	{
		event: 'pull_request',
		action: [ 'closed' ],
		task: cleanLabels,
	},
	{
		event: 'pull_request',
		action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
		task: ifNotClosed( checkDescription ),
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
