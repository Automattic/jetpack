const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getAllLabels = require( '../../utils/labels/get-all-labels' );
const hasPriorityLabels = require( '../../utils/labels/has-priority-labels' );
const isBug = require( '../../utils/labels/is-bug' );
const sendOpenAiRequest = require( '../../utils/openai/send-request' );
const findPlatforms = require( '../../utils/parse-content/find-platforms' );
const findPlugins = require( '../../utils/parse-content/find-plugins' );
const findPriority = require( '../../utils/parse-content/find-priority' );
const formatSlackMessage = require( '../../utils/slack/format-slack-message' );
const notifyImportantIssues = require( '../../utils/slack/notify-important-issues' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Request a list of matching labels from Open AI that can be applied to the issue,
 * based on the issue contents.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} body    - Issue body.
 *
 * @return {Promise<Array>} Promise resolving to an array of labels to apply to the issue.
 */
async function fetchOpenAiLabelsSuggestions( octokit, owner, repo, body ) {
	// Get all the Feature and Feature Group labels in the repo.
	const pattern = /^(\[Feature\]|\[Feature Group\])/;
	const repoLabels = await getAllLabels( octokit, owner, repo, pattern );

	// If no labels are found, bail.
	if ( repoLabels.length === 0 ) {
		debug( 'triage-issues: No labels found in the repository. Aborting OpenAI request.' );
		return [];
	}

	const prompt = `Here is the issue body:
${ body }

Here are the existing labels and their descriptions:
${ repoLabels.join( ', ' ) }

Analyze the issue and suggest the most relevant labels for this issue. Follow these rules:

1. Consider the label name and its description when making label suggestions.
2. Only suggest labels that are in the list of existing labels provided.
3. Provide at least 1 label that starts with the string '[Feature Group]', but no more than 2.
4. Provide at least 3 labels that start with the string '[Feature]', but no more than 5.
5. Include specific [Feature] labels as appropriate.
6. Always include a [Product] label if applicable.
7. Explain your reasoning for each label in 1 sentence.
8. Format your response as a JSON object with 'labels' and 'explanations' keys.

Example response format:
{
    "labels": ["[Product] WordPress.com", "[Feature Group] User Interaction & Engagement", "[Feature] Comments"],
    "explanations": {
        "[Product] WordPress.com": "This issue is related to the WordPress.com platform.",
        "[Feature Group] User Interaction & Engagement": "The issue involves how users interact with the platform.",
        "[Feature] Comments": "Specifically, it's about the commenting functionality."
    }
}`;

	const response = await sendOpenAiRequest( prompt );

	let parsedResponse;
	try {
		parsedResponse = JSON.parse( response );
	} catch ( error ) {
		debug(
			`triage-issues: OpenAI did not send back the expected JSON-formatted response. Error: ${ error }`
		);
		return [];
	}

	debug( `triage-issues: OpenAI response: ${ JSON.stringify( parsedResponse ) }` );
	const { labels, explanations } = parsedResponse;

	// Display the explanations in the action logs.
	const explanationString = Object.entries( explanations ).join( ' // ' );
	debug( `triage-issues: OpenAI suggested the following labels: ${ explanationString }` );

	if ( ! Array.isArray( labels ) ) {
		return [];
	}

	return labels;
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

	// When an issue is first opened, parse its contents, send them to OpenAI,
	// and add labels if any matching labels can be found.
	if ( action === 'opened' ) {
		debug( `triage-issues: Fetching labels suggested by OpenAI for issue #${ number }` );
		const labelsSuggestions = await fetchOpenAiLabelsSuggestions( octokit, ownerLogin, name, body );

		if ( labelsSuggestions.length === 0 ) {
			debug( `triage-issues: No labels suggested by OpenAI for issue #${ number }` );
			return;
		}

		// Add the suggested labels to the issue.
		debug(
			`triage-issues: Adding the following labels to issue #${ number }, as suggested by OpenAI: ${ labelsSuggestions.join(
				', '
			) }`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: labelsSuggestions,
		} );
	}

	// Send a Slack notification if the issue is important.
	if ( isBugIssue ) {
		await notifyImportantIssues( octokit, payload, channel );
	}
}
module.exports = triageIssues;
