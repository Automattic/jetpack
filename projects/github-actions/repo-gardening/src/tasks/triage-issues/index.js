const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for Priority label on an issue
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<Array>} Promise resolving to an array of the existing Priority labels found.
 */
async function hasPriorityLabels( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	return labels.filter( label => label.match( /^\[Pri\].*$/ ) );
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
async function hasEscalatedLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// Does the list of labels includes the "[Status] Escalated" or "[Status] Escalated to Kitkat" label?
	return (
		labels.includes( '[Status] Escalated' ) || labels.includes( '[Status] Escalated to Kitkat' )
	);
}

/**
 * Ensure the issue is a bug.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @param {string} action  - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} label   - Label that was added to the issue.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function isBug( octokit, owner, repo, number, action, label ) {
	// If the issue has a "[Type] Bug" label, it's a bug.
	const labels = await getLabels( octokit, owner, repo, number );
	if ( labels.includes( '[Type] Bug' ) ) {
		return true;
	}

	// Next, check if the current event was a [Type] Bug label being added.
	if ( 'labeled' === action && '[Type] Bug' === label.name ) {
		return true;
	}
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

	debug( `triage-issues: No plugin indicators found.` );
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

	debug( `triage-issues: no platform indicators found.` );
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
			`triage-issues: Reported priority indicators for issue: "${ impact }" / "${ blocking }"`
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
		return 'TBD';
	}

	debug( `triage-issues: No priority indicators found.` );
	return 'TBD';
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

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( 'triage-issues: Input slack_token is required but missing. Aborting.' );
		return;
	}

	const channel = getInput( 'slack_quality_channel' );
	if ( ! channel ) {
		setFailed( 'triage-issues: Input slack_quality_channel is required but missing. Aborting.' );
		return;
	}

	// Find Priority.
	const priorityLabels = await hasPriorityLabels( octokit, ownerLogin, name, number, action );
	if ( priorityLabels.length > 0 ) {
		debug(
			`triage-issues: Issue #${ number } has existing priority labels: ${ priorityLabels.join(
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

		// Add priority label, if none already exists on the issue.
		if ( priorityLabels.length === 0 ) {
			debug( `triage-issues: Adding [Pri] ${ priority } label to issue #${ number }` );

			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: [ `[Pri] ${ priority }` ],
			} );

			// If we're adding a TBD priority, if we're in the Calypso repo, if that's a bug,
			// send a Slack notification.
			if ( priority === 'TBD' && full_name === 'Automattic/wp-calypso' && isBugIssue ) {
				debug(
					`triage-issues: #${ number } doesn't have a Priority set. Sending in Slack message to the Kitkat team.`
				);
				const message = '@kitkat-team New bug missing priority. Please do a priority assessment.';
				const slackMessageFormat = formatSlackMessage( payload, channel, message );
				await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );
			}
		}
	}

	// Is this a bug,
	// Is the issue still opened,
	// is it a high priority or blocker (inferred from the existing labels or from the issue body),
	// and is this a new issue, not escalated yet?
	// If so, send a Slack notification.
	const isEscalated = await hasEscalatedLabel( octokit, ownerLogin, name, number );
	const highPriorityIssue = priority === 'High' || priorityLabels.includes( '[Pri] High' );
	const blockerIssue = priority === 'BLOCKER' || priorityLabels.includes( '[Pri] BLOCKER' );
	if ( isBugIssue && state === 'open' && ! isEscalated && ( highPriorityIssue || blockerIssue ) ) {
		const message = `New ${
			highPriorityIssue ? 'High-priority' : 'Blocker'
		} bug! Please check the priority.`;
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );

		debug( `triage-issues: Adding a label to issue #${ number } to show that Kitkat was warned.` );
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ '[Status] Escalated' ],
		} );
	}
}
module.exports = triageIssues;
