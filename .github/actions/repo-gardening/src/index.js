/**
 * External dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { context, getOctokit } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignIssues = require( './tasks/assign-issues' );
const addMilestone = require( './tasks/add-milestone' );
const addLabels = require( './tasks/add-labels' );
const checkDescription = require( './tasks/check-description' );
const wpcomCommitReminder = require( './tasks/wpcom-commit-reminder' );
const notifyDesign = require( './tasks/notify-design' );
const debug = require( './debug' );
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
		action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
		task: ifNotClosed( checkDescription ),
	},
	{
		event: 'pull_request',
		action: [ 'labeled' ],
		task: ifNotClosed( notifyDesign ),
	},
	{
		event: 'push',
		task: wpcomCommitReminder,
	},
];

( async function main() {
	const token = getInput( 'github_token' );
	if ( ! token ) {
		setFailed( 'main: Input `github_token` is required' );
		return;
	}

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( 'main: Input `slack_token` is required' );
		return;
	}

	const slackDesignChannelToken = getInput( 'slack_design_channel' );
	if ( ! slackDesignChannelToken ) {
		setFailed( 'main: Input `slack_design_channel` is required' );
		return;
	}

	const extraTokens = {
		slackToken,
		slackDesignChannelToken,
	};

	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( token );

	// Get info about the event.
	const eventPayload = context.payload;
	const eventAction = eventPayload.action;

	debug( `main: Received event = '${ context.eventName }', action = '${ eventPayload.action }'` );

	for ( const { event, action, task } of automations ) {
		if (
			event === context.eventName &&
			( action === undefined || action.includes( eventAction ) )
		) {
			try {
				debug( `main: Starting task ${ task.name }` );
				await task( eventPayload, octokit, extraTokens );
			} catch ( error ) {
				setFailed( `main: Task ${ task.name } failed with error: ${ error }` );
			}
		}
	}

	debug( 'main: All done!' );
} )();
