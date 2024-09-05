const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getAvailableLabels = require( '../../utils/labels/get-available-labels' );
const getLabels = require( '../../utils/labels/get-labels' );
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
 * @param {string} title   - Issue title.
 * @param {string} body    - Issue body.
 *
 * @return {Promise<Object>} Promise resolving to an object of labels to apply to the issue, and their explanations.
 */
async function fetchOpenAiLabelsSuggestions( octokit, owner, repo, title, body ) {
	const suggestions = { labels: [], explanations: {} };

	// Get all the Feature and Feature Group labels in the repo.
	const pattern = /^(\[Feature\]|\[Feature Group\])/;
	const repoLabels = await getAvailableLabels( octokit, owner, repo, pattern );

	// If no labels are found, bail.
	if ( repoLabels.length === 0 ) {
		debug( 'triage-issues: No labels found in the repository. Aborting OpenAI request.' );
		return suggestions;
	}

	const prompt = `You must analyse the content below, composed of 2 data points pulled from a GitHub issue:

- a title
- the issue body

Here is the issue title. It is the most important part of the text you must analyse:

- ${ title }

Here is the issue body:

**********************

${ body }

**********************

You must analyze this content, and suggest labels related to the content.
The labels you will suggest must all come from the list below:

${ repoLabels
	.map( label => `- ${ label.name }${ label?.description ? `: ${ label.description }` : '' }` )
	.join( '\n' ) }

Analyze the issue and suggest relevant labels. Rules:
- Use only existing labels provided.
- Include 1 '[Feature Group]' label.
- Include 1 to 3 '[Feature]' labels.
- Briefly explain each label choice in 1 sentence.
- Format your response as a JSON object, with each suggested label as a key, and its explanation as the value.

Example response format:
{
    "[Feature Group] User Interaction & Engagement": "The issue involves how users interact with the platform.",
    "[Feature] Comments": "Specifically, it's about the commenting functionality."
}`;

	const response = await sendOpenAiRequest( prompt, 'json_object' );
	debug( `triage-issues: OpenAI response: ${ response }` );

	let parsedResponse;
	try {
		parsedResponse = JSON.parse( response );
	} catch ( error ) {
		debug(
			`triage-issues: OpenAI did not send back the expected JSON-formatted response. Error: ${ error }`
		);
		return suggestions;
	}

	const labels = Object.keys( parsedResponse );

	if ( ! Array.isArray( labels ) ) {
		return suggestions;
	}

	return { labels, explanations: parsedResponse };
}

/**
 * Check if the issue has the "[Experiment] Automated labeling" label.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 *
 * @return {Promise<boolean>} Promise resolving to boolean.
 */
async function hasTestLabel( octokit, owner, repo, number, action, eventLabel ) {
	// Check existing labels.
	const labels = await getLabels( octokit, owner, repo, number );
	if ( labels.includes( '[Experiment] Automated labeling' ) ) {
		return true;
	}

	// Next, check if the current event was a [Experiment] Automated labeling label being added.
	if (
		'labeled' === action &&
		eventLabel.name &&
		'[Experiment] Automated labeling' === eventLabel.name
	) {
		return true;
	}

	return false;
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
	const { number, body, title } = issue;
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
	// During testing, we'll run it for any issues, not just opened,
	// but only on issues with the "[Experiment] Automated labeling" label.
	const isTestIssue = await hasTestLabel( octokit, ownerLogin, name, number, action, label );
	const apiKey = getInput( 'openai_api_key' );
	if ( isTestIssue && apiKey ) {
		debug( `triage-issues: Fetching labels suggested by OpenAI for issue #${ number }` );
		const { labels, explanations } = await fetchOpenAiLabelsSuggestions(
			octokit,
			ownerLogin,
			name,
			title,
			body
		);

		if ( labels.length === 0 ) {
			debug( `triage-issues: No labels suggested by OpenAI for issue #${ number }` );
		} else {
			// Add the suggested labels to the issue.
			debug(
				`triage-issues: Adding the following labels to issue #${ number }, as suggested by OpenAI: ${ labels.join(
					', '
				) }`
			);
			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels,
			} );

			// During testing, post a comment on the issue with the explanations.
			const explanationComment = `**OpenAI suggested the following labels for this issue:**
${ Object.entries( explanations )
	.map( ( [ labelName, explanation ] ) => `- ${ labelName }: ${ explanation }` )
	.join( '\n' ) }`;

			await octokit.rest.issues.createComment( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				body: explanationComment,
			} );
		}
	}

	// Send a Slack notification if the issue is important.
	if ( isBugIssue ) {
		await notifyImportantIssues( octokit, payload, channel );
	}
}
module.exports = triageIssues;
