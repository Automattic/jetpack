const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const isBug = require( '../../utils/labels/is-bug' );
const findPlatforms = require( '../../utils/parse-content/find-platforms' );
const findPlugins = require( '../../utils/parse-content/find-plugins' );
const formatSlackMessage = require( '../../utils/slack/format-slack-message' );
const notifyImportantIssues = require( '../../utils/slack/notify-important-issues' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );
const aiLabeling = require( './ai-labeling' );
const getIssuePriority = require( './get-issue-priority' );
const updateBoard = require( './update-board' );

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
	const { number, body, state } = issue;
	const { owner, name, full_name } = repository;
	const ownerLogin = owner.login;

	// Do not run this task if the issue is not open.
	if ( 'open' !== state ) {
		debug( `triage-issues: Issue #${ number } is not open. No need to triage it.` );
		return;
	}

	const { labels: priorityLabels, inferred } = await getIssuePriority( payload, octokit );
	const isBugIssue = await isBug( octokit, ownerLogin, name, number, action, label );
	const qualityChannel = getInput( 'slack_quality_channel' );

	// If this is a new issue, add labels.
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

		// Add priority label to the issue, if none already existed on the issue.
		if ( priorityLabels.length === 1 && isBugIssue && inferred ) {
			const inferredPriority = priorityLabels[ 0 ];
			debug( `triage-issues: Adding ${ inferredPriority } label to issue #${ number }` );

			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: [ inferredPriority ],
			} );

			// If we're adding a TBD priority, if we're in the Calypso repo,
			// send a Slack notification.
			if (
				inferredPriority === '[Pri] TBD' &&
				full_name === 'Automattic/wp-calypso' &&
				qualityChannel
			) {
				debug(
					`triage-issues: #${ number } doesn't have a Priority set. Sending in Slack message to the triage team.`
				);
				const message = 'New bug missing priority. Please do a priority assessment.';
				const slackMessageFormat = formatSlackMessage( payload, qualityChannel, message );
				await sendSlackMessage( message, qualityChannel, payload, slackMessageFormat );
			}
		}

		// Use OpenAI to automatically add labels to issues.
		await aiLabeling( payload, octokit );
	}

	// Triage the issue to a Project board if necessary and possible.
	await updateBoard( payload, octokit, isBugIssue, priorityLabels );

	// Send a Slack notification to Product ambassadors if the issue is important.
	if (
		isBugIssue &&
		qualityChannel &&
		priorityLabels.length > 0 &&
		( priorityLabels.includes( '[Pri] BLOCKER' ) || priorityLabels.includes( '[Pri] High' ) )
	) {
		await notifyImportantIssues( octokit, payload, qualityChannel, 'product-ambassadors' );
	}
}
module.exports = triageIssues;
