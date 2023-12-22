const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const hasPriorityLabels = require( '../../utils/labels/has-priority-labels' );
const isBug = require( '../../utils/labels/is-bug' );
const findPlatforms = require( '../../utils/parse-content/find-platforms' );
const findPlugins = require( '../../utils/parse-content/find-plugins' );
const findPriority = require( '../../utils/parse-content/find-priority' );
const formatSlackMessage = require( '../../utils/slack/format-slack-message' );
const notifyImportantIssues = require( '../../utils/slack/notify-important-issues' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Automatically add labels to issues, and send Slack notifications.
 *
 * This task can send 2 different types of Slack notifications:
 * - If an issue is determined as High or Blocker priority,
 * - If no priority is determined.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function triageIssues( payload, octokit ) {
	const { action, issue, label = {}, repository } = payload;
	const { number, body } = issue;
	const { owner, name, full_name } = repository;
	const ownerLogin = owner.login;

	const channel = getInput( 'slack_quality_channel' );
	if ( ! channel ) {
		setFailed( 'triage-issues: Input slack_quality_channel is required but missing. Aborting.' );
		return;
	}

	// Find Priority.
	const priorityLabels = await hasPriorityLabels(
		octokit,
		ownerLogin,
		name,
		number,
		action,
		label
	);
	if ( priorityLabels.length > 0 ) {
		debug(
			`triage-issues: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }`
		);
	} else {
		debug( `triage-issues: Issue #${ number } has no existing priority labels.` );
	}

	debug( `triage-issues: Finding priority for issue #${ number } based off the issue contents.` );
	const priority = findPriority( body );
	debug( `triage-issues: Priority for issue #${ number } is ${ priority }` );

	const isBugIssue = await isBug( octokit, ownerLogin, name, number, action, label );

	// If this is a new issue, try to add labels.
	if ( action === 'opened' || action === 'reopened' ) {
		// Find impacted plugins, and add labels.
		const impactedPlugins = findPlugins( body );
		if ( impactedPlugins.length > 0 ) {
			debug( `triage-issues: Adding plugin labels to issue #${ number }` );

			const pluginLabels = impactedPlugins.map( plugin => `[Plugin] ${ plugin }` );

			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: pluginLabels,
			} );
		}

		// Find platform info, and add labels.
		const impactedPlatforms = findPlatforms( body );
		if ( impactedPlatforms.length > 0 ) {
			debug( `triage-issues: Adding platform labels to issue #${ number }` );

			const platformLabels = impactedPlatforms.map( platform => `[Platform] ${ platform }` );

			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: platformLabels,
			} );
		}

		// Add priority label to all bugs, if none already exists on the issue.
		if ( priorityLabels.length === 0 && isBugIssue ) {
			debug( `triage-issues: Adding [Pri] ${ priority } label to issue #${ number }` );

			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: [ `[Pri] ${ priority }` ],
			} );

			// If we're adding a TBD priority, if we're in the Calypso repo,
			// send a Slack notification.
			if ( priority === 'TBD' && full_name === 'Automattic/wp-calypso' ) {
				debug(
					`triage-issues: #${ number } doesn't have a Priority set. Sending in Slack message to the triage team.`
				);
				const message = 'New bug missing priority. Please do a priority assessment.';
				const slackMessageFormat = formatSlackMessage( payload, channel, message );
				await sendSlackMessage( message, channel, payload, slackMessageFormat );
			}
		}
	}

	// Send a Slack notification if the issue is important.
	if ( isBugIssue ) {
		await notifyImportantIssues( octokit, payload, channel );
	}
}
module.exports = triageIssues;
