const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getAvailableLabels = require( '../../utils/labels/get-available-labels' );
const getLabels = require( '../../utils/labels/get-labels' );
const sendOpenAiRequest = require( '../../utils/openai/send-request' );

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
		debug(
			'triage-issues > auto-label: No labels found in the repository. Aborting OpenAI request.'
		);
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
The labels you will suggest must all come from the list below.
Each item on the list of labels below follows the following format: - <label name>: <label description if it exists>


${ repoLabels
	.map( label => `- ${ label.name }${ label?.description ? `: ${ label.description }` : '' }` )
	.join( '\n' ) }

Analyze the issue and suggest relevant labels. Rules:
- Use only existing labels provided.
- Include 1 '[Feature Group]' label.
- Include 1 to 3 '[Feature]' labels.
- Briefly explain each label choice in 1 sentence.
- Format your response as a JSON object, with each suggested label as a key, and your explanation of the label choice as the value.

Example response format:
{
    "[Feature Group] User Interaction & Engagement": "The issue involves how users interact with the platform.",
    "[Feature] Comments": "Specifically, it's about the commenting functionality."
}`;

	const response = await sendOpenAiRequest( prompt, 'json_object' );
	debug( `triage-issues > auto-label: OpenAI response: ${ response }` );

	let parsedResponse;
	try {
		parsedResponse = JSON.parse( response );
	} catch ( error ) {
		debug(
			`triage-issues > auto-label: OpenAI did not send back the expected JSON-formatted response. Error: ${ error }`
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
 * Clean up the issue content for OpenAI processing.
 * Remove links from the issue content.
 *
 * @param {string} content - Issue body content.
 *
 * @return {string} Cleaned up issue content.
 */
function cleanIssueContent( content ) {
	// Remove links in the format [link text](url), but keep the link text.
	content = content.replace( /\[(.*?)\](?:\([^)]+\))?/g, '$1' );

	// Remove links in the format <a href="url">link text</a>, but keep the link text.
	content = content.replace( /<a href="https?:\/\/\S+">(.*?)<\/a>/g, '$1' );

	// Remove links in the format https://url, and replace with info that OpenAI can understand.
	content = content.replace( /https?:\/\/\S+/g, 'this link with more information' );

	return content;
}

/**
 * Automatically add labels to issues.
 *
 * When an issue is first opened, parse its contents, send them to OpenAI,
 * and add labels if any matching labels can be found.
 * During testing, we'll only run it for issues that are not labeled as "[Type] Task".
 * When we auto-label, we'll add a label to note that the issue was processed.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function aiLabeling( payload, octokit ) {
	const { issue, repository } = payload;
	const { number, body, title } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	const issueLabels = await getLabels( octokit, ownerLogin, name, number );
	const apiKey = getInput( 'openai_api_key' );

	if ( ! apiKey ) {
		debug( `triage-issues > auto-label: No OpenAI key is provided. Bail.` );
		return;
	}

	// If the issue already has [Feature] or [Feature Group] labels, bail.
	if ( issueLabels.some( label => label.startsWith( '[Feature' ) ) ) {
		debug(
			`triage-issues > auto-label: Issue #${ number } already has [Feature] or [Feature Group] labels. Skipping.`
		);
		return;
	}

	if (
		! issueLabels.includes( '[Experiment] AI labels added' ) &&
		! issueLabels.includes( '[Type] Task' )
	) {
		const issueContents = cleanIssueContent( body );

		// Only process issues that have enough content to analyze (more than 100 characters).
		if ( issueContents.length < 150 ) {
			debug(
				`triage-issues > auto-label: Issue #${ number } doesn't have enough content. Skipping OpenAI analysis.`
			);
			return;
		}

		debug(
			`triage-issues > auto-label: Fetching labels suggested by OpenAI for issue #${ number }`
		);
		const { labels, explanations } = await fetchOpenAiLabelsSuggestions(
			octokit,
			ownerLogin,
			name,
			title,
			issueContents
		);

		if ( labels.length === 0 ) {
			debug( `triage-issues > auto-label: No labels suggested by OpenAI for issue #${ number }` );
		} else {
			// Add the suggested labels to the issue.
			debug(
				`triage-issues > auto-label: Adding the following labels to issue #${ number }, as suggested by OpenAI: ${ labels.join(
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

			// Add a label to note that the issue was processed.
			await octokit.rest.issues.addLabels( {
				owner: ownerLogin,
				repo: name,
				issue_number: number,
				labels: [ '[Experiment] AI labels added' ],
			} );
		}
	}
}
module.exports = aiLabeling;
