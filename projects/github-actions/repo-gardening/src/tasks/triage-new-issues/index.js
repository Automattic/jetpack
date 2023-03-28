const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for a label showing that the Quality team was already notified.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasKitkatSignalLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// Does the list of labels includes the "[Pri] TBD" label?
	return labels.includes( '[Pri] TBD' );
}

/**
 * Check for Priority label on an issue
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasPriorityLabels( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in priority labels, but not if the label is [Pri] TBD.
	return !! labels.find( label => label !== '[Pri] TBD' && label.match( /^\[Pri\].*$/ ) );
}

/**
 * Find list of plugins impacted by issue, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Plugins concerned by issue.
 */
function findPlugins( body ) {
	const regex = /###\sImpacted\splugin\n\n([a-zA-Z ,]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , plugins ] = match;
		return plugins.split( ', ' ).filter( v => v.trim() !== '' );
	}

	debug( `triage-new-issues: No plugin indicators found.` );
	return [];
}

/**
 * Find platform info, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Platforms impacted by issue.
 */
function findPlatforms( body ) {
	const regex = /###\sPlatform\s\(Simple\sand\/or Atomic\)\n\n([a-zA-Z ,-]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , platforms ] = match;
		return platforms
			.split( ', ' )
			.filter( platform => platform !== 'Self-hosted' && platform.trim() !== '' );
	}

	debug( `triage-new-issues: no platform indicators found.` );
	return [];
}

/**
 * Figure out the priority of the issue, based off issue contents.
 * Logic follows this priority matrix: pciE2j-oG-p2
 *
 * @param {string} body - The issue content.
 * @returns {string} Priority of issue.
 */
function findPriority( body ) {
	// Look for priority indicators in body.
	const priorityRegex =
		/###\sImpact\n\n(?<impact>.*)\n\n###\sAvailable\sworkarounds\?\n\n(?<blocking>.*)\n/gm;
	let match;
	while ( ( match = priorityRegex.exec( body ) ) ) {
		const [ , impact = '', blocking = '' ] = match;

		debug(
			`triage-new-issues: Reported priority indicators for issue: "${ impact }" / "${ blocking }"`
		);

		if ( blocking === 'No and the platform is unusable' ) {
			return impact === 'One' ? 'High' : 'BLOCKER';
		} else if ( blocking === 'No but the platform is still usable' ) {
			return 'High';
		} else if ( blocking === 'Yes, difficult to implement' ) {
			return impact === 'All' ? 'High' : 'Normal';
		} else if ( blocking !== '' && blocking !== '_No response_' ) {
			return impact === 'All' || impact === 'Most (> 50%)' ? 'Normal' : 'Low';
		}
		return null;
	}

	debug( `triage-new-issues: No priority indicators found.` );
	return null;
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
 * Add labels to newly opened issues.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function triageNewIssues( payload, octokit ) {
	const { issue, repository } = payload;
	const { number, body } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	// Find impacted plugins.
	const impactedPlugins = findPlugins( body );
	if ( impactedPlugins.length > 0 ) {
		debug( `triage-new-issues: Adding plugin labels to issue #${ number }` );

		const pluginLabels = impactedPlugins.map( plugin => `[Plugin] ${ plugin }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: pluginLabels,
		} );
	}

	// Find platform info.
	const impactedPlatforms = findPlatforms( body );
	if ( impactedPlatforms.length > 0 ) {
		debug( `triage-new-issues: Adding platform labels to issue #${ number }` );

		const platformLabels = impactedPlatforms.map( platform => `[Platform] ${ platform }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: platformLabels,
		} );
	}

	// Find Priority.
	debug( `triage-new-issues: Finding priority for issue #${ number }` );
	const priority = findPriority( body );
	const hasPriorityLabel = await hasPriorityLabels( octokit, ownerLogin, name, number );
	if ( priority !== null && ! hasPriorityLabel ) {
		debug( `triage-new-issues: Adding priority label to issue #${ number }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ `[Pri] ${ priority }` ],
		} );
	} else if ( priority === null && ! hasPriorityLabel ) {
		// No priority found, and no priority label.
		// Let's notify the team so they can prioritize the issue appropriately.
		// So far only enabled in the Calypso repo.
		if ( 'Automattic/wp-calypso' !== repository.full_name ) {
			return;
		}

		// No Slack tokens, we won't be able to escalate. Bail.
		const slackToken = getInput( 'slack_token' );
		const channel = getInput( 'slack_quality_channel' );
		if ( ! slackToken || ! channel ) {
			debug(
				`triage-new-issues: No Slack token or channel found. Not sending any Slack notification for #${ number }.`
			);
			return null;
		}

		// Check if Kitkat input was already requested for that issue.
		const hasBeenRequested = await hasKitkatSignalLabel( octokit, ownerLogin, name, number );
		if ( hasBeenRequested ) {
			debug(
				`triage-new-issues: Kitkat input was already requested for issue #${ number }. Aborting.`
			);
			return;
		}

		debug(
			`triage-new-issues: #${ number } doesn't have a Priority set. Sending in Slack message to the Kitkat team.`
		);

		const message = '@kitkat-team New bug missing priority. Please do a priority assessment.';
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );

		debug(
			`triage-new-issues: Adding a label to issue #${ number } to show that Kitkat was warned.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ '[Pri] TBD' ],
		} );
	}
}

module.exports = triageNewIssues;
