const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getDiff = require( '../../utils/get-diff' );
const getLabels = require( '../../utils/labels/get-labels' );
const sendOpenAiRequest = require( '../../utils/openai/send-request' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Clean up the PR body content for AI processing.
 * Remove links and HTML from the content.
 *
 * @param {string} content - PR body content.
 * @return {string} Cleaned up content.
 */
function cleanContent( content ) {
	if ( ! content ) {
		return '';
	}

	// Remove markdown links [text](url), but keep the text.
	content = content.replace( /\[([^\]]*)\]\([^)]+\)/g, '$1' );

	// Remove HTML links <a ...>text</a>, but keep the text.
	content = content.replace( /<a\b[^>]*>(.*?)<\/a>/gi, '$1' );

	// Replace bare URLs with [link].
	content = content.replace( /https?:\/\/\S+/g, '[link]' );

	// Remove HTML comments, applying repeatedly to avoid incomplete multi-character sanitization.
	let previousContent;
	do {
		previousContent = content;
		content = content.replace( /<!--[\s\S]*?-->/g, '' );
	} while ( content !== previousContent );

	return content;
}

/**
 * Build the prompt for the AI to analyze the PR.
 *
 * @param {string} title - PR title.
 * @param {string} body  - PR body (cleaned).
 * @param {string} diff  - PR diff (cleaned).
 * @return {string} The prompt for the AI.
 */
function buildPrompt( title, body, diff ) {
	return `You are analyzing a GitHub Pull Request to determine if the changes are "user-facing".

User-facing changes include:
- UI changes (new buttons, layouts, styling, text changes visible to users)
- Feature changes (new functionality, modified behavior that users interact with)
- User-visible behavior changes (error messages, notifications, validation messages)
- Changes to user documentation, help text, or tooltips
- Changes to public APIs that external developers use

NOT user-facing changes include:
- Refactoring or code cleanup with no behavior change
- Test-only changes (adding or modifying tests)
- Internal tooling or build configuration changes
- Internal documentation (code comments, developer docs)
- Dependency updates that don't change behavior
- CI/CD configuration changes

Here is the PR title:
${ title }

Here is the PR description:
${ body || '(No description provided)' }

Here is the code diff:
\`\`\`
${ diff }
\`\`\`

Analyze this PR and determine if the changes are user-facing.

Respond with a JSON object in this exact format:
{
  "is_user_facing": boolean,
  "confidence": "high" | "medium" | "low",
  "reason": "Brief explanation (1-2 sentences)"
}`;
}

/**
 * Check if a PR contains user-facing changes using AI analysis.
 * If user-facing with medium/high confidence, add the [Status] UI Changes label.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function checkIfDocsNeeded( payload, octokit ) {
	const {
		pull_request: { number, body, title },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	const uiChangesLabel = '[Status] UI Changes';

	// Check if OpenAI API key is provided.
	const apiKey = getInput( 'openai_api_key' );
	if ( ! apiKey ) {
		debug( `check-if-docs-needed: No OpenAI key is provided. Bail.` );
		return;
	}

	// Fetch current labels.
	const prLabels = await getLabels( octokit, ownerLogin, name, number );

	// Check if PR already has the UI Changes label.
	if ( prLabels.includes( uiChangesLabel ) ) {
		debug(
			`check-if-docs-needed: PR #${ number } already has "${ uiChangesLabel }" label. Skipping.`
		);
		return;
	}

	// Skip if PR title contains "revert" (case-insensitive).
	if ( /revert/i.test( title ) ) {
		debug( `check-if-docs-needed: PR #${ number } title contains "revert". Skipping.` );
		return;
	}

	// Fetch the diff.
	let diff;
	try {
		diff = await getDiff( octokit, ownerLogin, name, number );
	} catch ( error ) {
		debug( `check-if-docs-needed: Failed to fetch diff for PR #${ number }: ${ error }` );
		return;
	}

	// Check if diff is too small to analyze.
	if ( ! diff || diff.length < 50 ) {
		debug( `check-if-docs-needed: PR #${ number } diff is too small to analyze. Skipping.` );
		return;
	}

	// Clean the PR body and build the prompt.
	const cleanedBody = cleanContent( body );
	const prompt = buildPrompt( title, cleanedBody, diff );

	debug( `check-if-docs-needed: Sending PR #${ number } to OpenAI for analysis.` );

	// Call OpenAI.
	const response = await sendOpenAiRequest( prompt, 'json_object' );

	if ( ! response ) {
		debug(
			`check-if-docs-needed: OpenAI request returned no response for PR #${ number }. Skipping docs check.`
		);
		return;
	}

	debug( `check-if-docs-needed: OpenAI response for PR #${ number }: ${ response }` );

	// Parse the response.
	let result;
	try {
		result = JSON.parse( response );
	} catch ( error ) {
		debug(
			`check-if-docs-needed: Failed to parse OpenAI response for PR #${ number }: ${ error }`
		);
		return;
	}

	const { is_user_facing: isUserFacing, confidence, reason } = result;

	// Apply UI Changes label if user-facing with medium or high confidence.
	if ( isUserFacing && ( confidence === 'high' || confidence === 'medium' ) ) {
		debug(
			`check-if-docs-needed: PR #${ number } is user-facing (confidence: ${ confidence }). Adding "${ uiChangesLabel }" label. Reason: ${ reason }`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ uiChangesLabel ],
		} );

		// Send Slack notification if quality channel is configured.
		const slackQualityChannel = getInput( 'slack_quality_channel' );
		const slackToken = getInput( 'slack_token' );

		if ( slackQualityChannel && slackToken ) {
			debug( `check-if-docs-needed: Sending Slack notification for PR #${ number }.` );
			try {
				await sendSlackMessage(
					`This PR was flagged as containing user-facing changes. Please review and update documentation if needed.\n\n*AI reasoning:* ${ reason }`,
					slackQualityChannel,
					payload
				);
			} catch ( error ) {
				debug(
					`check-if-docs-needed: Failed to send Slack notification for PR #${ number }: ${ error }`
				);
			}
		} else if ( slackQualityChannel && ! slackToken ) {
			debug(
				`check-if-docs-needed: Slack quality channel is configured but slack_token is missing. Skipping Slack notification for PR #${ number }.`
			);
		}
	} else {
		debug(
			`check-if-docs-needed: PR #${ number } is not user-facing or low confidence. Not adding label. Reason: ${ reason }`
		);
	}
}

module.exports = checkIfDocsNeeded;
