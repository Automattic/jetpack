const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getIssueType = require( '../../utils/labels/get-issue-type' );
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
 * If we could not add labels via OpenAI, let's add a comment to ask the issue author to add their own labels.
 *
 * We only want to do this if the author can actually add labels to the issue, i.e. if they're part of the organization.
 *
 * @param {GitHub} octokit     - Initialized Octokit REST client.
 * @param {string} ownerLogin  - Owner of the repository.
 * @param {string} authorLogin - Author of the issue.
 * @param {string} repo        - Repository name.
 * @param {number} issueNumber - Issue number.
 *
 * @return {Promise<void>} Promise resolving when the comment is added.
 */
async function addCommentAskLabels( octokit, ownerLogin, authorLogin, repo, issueNumber ) {
	debug(
		`triage-issues > auto-label: Issue #${ issueNumber } created by ${ authorLogin }, lacking label suggestions by OpenAI. Asking the author to add labels.`
	);

	// Check if issue author is org member
	// Result is communicated by status code, and non-successful status codes throw.
	// https://docs.github.com/en/rest/orgs/members?apiVersion=2022-11-28#check-organization-membership-for-a-user
	try {
		await octokit.rest.orgs.checkMembershipForUser( {
			org: ownerLogin,
			username: authorLogin,
		} );
	} catch {
		debug(
			`triage-issues > auto-label: Author ${ authorLogin } is not an org member. Skipping comment.`
		);
		return;
	}

	const commentBody = `This issue could use some more labels, to help prioritize and categorize our work. Could you please add at least a \`[Type]\`, a \`[Feature]\`, and a \`[Pri]\` label?
`;

	await octokit.rest.issues.createComment( {
		owner: ownerLogin,
		repo,
		body: commentBody,
		issue_number: issueNumber,
	} );
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
	const { action, issue, repository } = payload;
	const {
		user: { login: authorLogin },
		number,
		body,
		state,
	} = issue;
	const { owner, name, full_name } = repository;
	const ownerLogin = owner.login;

	// Do not run this task if the issue is not open.
	if ( 'open' !== state ) {
		debug( `triage-issues: Issue #${ number } is not open. No need to triage it.` );
		return;
	}

	const { labels: priorityLabels, inferred } = await getIssuePriority( payload, octokit );
	const issueType = await getIssueType( octokit, ownerLogin, name, number );
	const isBug = issueType === 'Bug';
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
		if ( priorityLabels.length === 1 && isBug && inferred ) {
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

		// If AI Labeling is enabled, use OpenAI to automatically add labels to issues.
		if ( getInput( 'ai_labeling_enabled' ) === 'true' ) {
			const issueLabels = await aiLabeling( payload, octokit );

			// At this point, if we still miss a [Type] label, a [Feature] label, or a [Pri] label, ask the author to add it.
			const requiredLabelTypes = [ /^\[Type\]/, /^\[Pri/, /^\[[^\]]*Feature/ ];
			const missingLabelTypes = requiredLabelTypes.filter(
				requiredLabelType => ! issueLabels.some( label => requiredLabelType.test( label ) )
			);

			if ( missingLabelTypes.length > 0 ) {
				await addCommentAskLabels( octokit, ownerLogin, authorLogin, name, number );
			}
		}
	}

	// Triage the issue to a Project board if necessary and possible.
	await updateBoard( payload, octokit, issueType, priorityLabels );

	// Send a Slack notification to Product ambassadors if the issue is important.
	if (
		isBug &&
		qualityChannel &&
		priorityLabels.length > 0 &&
		( priorityLabels.includes( '[Pri] BLOCKER' ) || priorityLabels.includes( '[Pri] High' ) )
	) {
		await notifyImportantIssues( octokit, payload, qualityChannel, 'product-ambassadors' );
	}
}
module.exports = triageIssues;
