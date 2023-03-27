const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for a high priority label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasHighPrioLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the [Pri] High label.
	return labels.includes( '[Pri] High' );
}

/**
 * Check for a BLOCKER priority label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasBlockerPrioLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the [Pri] BLOCKER label.
	return labels.includes( '[Pri] BLOCKER' );
}

/**
 * Check for a label showing that it was already escalated.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasKitkatSignalLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// Does the list of labels includes the "[Status] Escalated" or "[Status] Escalated to Kitkat" label?
	return (
		labels.includes( '[Status] Escalated' ) || labels.includes( '[Status] Escalated to Kitkat' )
	);
}

/**
 * Build an object containing the slack message and its formatting to send to Slack.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {string}              channel - Slack channel ID.
 * @param {string}              message - Basic message (without the formatting).
 * @returns {object} Object containing the slack message and its formatting.
 */
function formatSlackMessage( payload, channel, message ) {
	const { issue } = payload;
	const { html_url, title } = issue;

	return {
		channel,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message,
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `<${ html_url }|${ title }>`,
				},
			},
		],
		text: `${ message } -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
		mrkdwn: true, // Formatting of the fallback text.
		unfurl_links: false,
		unfurl_media: false,
	};
}

/**
 * Send a Slack notification about a label to Team KitKat.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function notifyKitKat( payload, octokit ) {
	const {
		issue: { number, state },
		repository,
	} = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( 'notify-kitkat: Input slack_token is required but missing. Aborting.' );
		return;
	}

	const channel = getInput( 'slack_kitkat_channel' );
	if ( ! channel ) {
		setFailed( 'notify-kitkat: Input slack_kitkat_channel is required but missing. Aborting.' );
		return;
	}

	// Only proceed if the issue is stil open.
	if ( 'open' !== state ) {
		debug( `notify-kitkat: Issue #${ number } is state '${ state }'. Aborting.` );
		return;
	}

	// Check if Kitkat input was already requested for that issue.
	const hasBeenRequested = await hasKitkatSignalLabel( octokit, ownerLogin, repo, number );
	if ( hasBeenRequested ) {
		debug( `notify-kitkat: Kitkat input was already requested for issue #${ number }. Aborting.` );
		return;
	}

	// Check for a [Pri] High label.
	const isLabeledHighPriority = await hasHighPrioLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledHighPriority ) {
		debug(
			`notify-kitkat: Found a [Pri] High label on issue #${ number }. Sending in Slack message.`
		);
		const message = `New high priority bug! Please check the priority.`;
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );
	}

	// Check for a BLOCKER priority label.
	const isLabeledBlocker = await hasBlockerPrioLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledBlocker ) {
		debug(
			`notify-kitkat: Found a [Pri] BLOCKER label on issue #${ number }. Sending in Slack message.`
		);
		const message = `New blocker bug!  Please check the priority.`;
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );
	}

	if ( isLabeledHighPriority || isLabeledBlocker ) {
		debug( `notify-kitkat: Adding a label to issue #${ number } to show that Kitkat was warned.` );
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			labels: [ '[Status] Escalated' ],
		} );
	}
}

module.exports = notifyKitKat;
