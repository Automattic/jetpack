import { getInput } from '@actions/core';
import debug from '../../utils/debug.ts';
import getDiff from '../../utils/get-diff.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import sendOpenAiRequest from '../../utils/openai/send-request.ts';
import sendSlackMessage from '../../utils/slack/send-slack-message.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Clean up the PR body content for AI processing.
 * Remove links and HTML from the content.
 *
 * @param content - PR body content.
 * @return Cleaned up content.
 */
function cleanContent( content: string ): string {
	if ( ! content ) {
		return '';
	}

	// Remove markdown links [text](url), but keep the text.
	content = content.replace( /\[([^\]]*)\]\([^)]+\)/g, '$1' );

	// Remove HTML links <a ...>text</a>, but keep the text.
	content = content.replace( /<a\b[^>]*>(.*?)<\/a>/gi, '$1' );

	// Replace bare URLs with [link].
	content = content.replace( /https?:\/\/\S+/g, '[link]' );

	// Remove complete HTML comments, applying repeatedly to avoid incomplete multi-character sanitization.
	let previousContent;
	do {
		previousContent = content;
		content = content.replace( /<!--[\s\S]*?-->/g, '' );
	} while ( content !== previousContent );

	// Remove incomplete HTML comments (opening tag without closing) by truncating at the first `<!--`.
	const incompleteCommentIndex = content.indexOf( '<!--' );
	if ( incompleteCommentIndex !== -1 ) {
		content = content.slice( 0, incompleteCommentIndex );
	}

	return content;
}

/**
 * Sanitize content for inclusion in a markdown code block.
 *
 * In GitHub-flavored Markdown, backslashes don't escape backticks inside code blocks.
 * Instead, you use more backticks for the fence than appear in the content.
 * We use 4 backticks for our fences, so we replace any sequence of 4+ backticks.
 *
 * @param content - Content to sanitize.
 * @return Sanitized content.
 */
function sanitizeForPrompt( content: string ): string {
	if ( ! content ) {
		return '';
	}

	// Replace sequences of 4 or more backticks (which could break our 4-backtick fences)
	// with a safe placeholder. This prevents prompt injection via code block delimiters.
	return content.replace( /````+/g, '[code-fence]' );
}

/**
 * Build the prompt for the AI to analyze the PR.
 *
 * @param title - PR title.
 * @param body  - PR body (cleaned).
 * @param diff  - PR diff (cleaned).
 * @return The prompt for the AI.
 */
function buildPrompt( title: string, body: string, diff: string ): string {
	const sanitizedTitle = sanitizeForPrompt( title || '' );
	const sanitizedBody = sanitizeForPrompt( body || '' );
	const sanitizedDiff = sanitizeForPrompt( diff || '' );

	return `You are analyzing a GitHub Pull Request to determine if it contains changes that would require updates to user-facing support documentation.

The key question is: "Would support documentation need to be updated to reflect these changes?"

Changes that WOULD require documentation updates (flag these):
- Changed UI workflows or interactions users need to understand
- New features or settings that need to be documented
- Changed text that appears in documentation screenshots or examples
- Changed behavior that affects how users accomplish tasks
- Changes to public APIs that external developers need to know about
- Modified error messages that support docs reference

Changes that would NOT require documentation updates (do NOT flag these):
- Refactoring code without changing user-visible behavior
- Code cleanup that preserves identical functionality
- Test-only changes (adding, modifying, or removing tests)
- Internal tooling or build configuration
- Developer documentation and code comments
- Dependency updates with no behavior change
- CI/CD configuration changes
- Performance optimizations with no visible behavior change
- Minor visual polish (slight color adjustments, spacing tweaks)
- Bug fixes that restore documented behavior

IMPORTANT: The question is not "does this change something users see?" but "would a technical writer need to update the support documentation?"

Here is the PR title:
\`\`\`\`
${ sanitizedTitle }
\`\`\`\`

Here is the PR description:
\`\`\`\`
${ sanitizedBody || '(No description provided)' }
\`\`\`\`

Here is the code diff:
\`\`\`\`
${ sanitizedDiff }
\`\`\`\`

Analyze this PR and determine if support documentation would need to be updated.

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
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function checkIfDocsNeeded(
	payload: PullRequestEvent,
	octokit: OctokitClient
): Promise< void > {
	const {
		pull_request: { number, body, title, merged },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	// Skip if the PR was closed without being merged.
	if ( ! merged ) {
		debug( `check-if-docs-needed: PR #${ number } was closed without being merged. Skipping.` );
		return;
	}

	const uiChangesLabel = '[Status] UI Changes';

	// Check if OpenAI API key is provided.
	const apiKey = getInput( 'openai_api_key' );
	if ( ! apiKey ) {
		debug( `check-if-docs-needed: No OpenAI API key provided for PR #${ number }. Skipping.` );
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

	// Skip if PR title starts with "Revert" (the standard GitHub revert format).
	// This avoids false positives like "Undo revert and fix..." or "New UI for post revert feature".
	if ( /^revert\b/i.test( title ) ) {
		debug( `check-if-docs-needed: PR #${ number } title starts with "revert". Skipping.` );
		return;
	}

	// Fetch the diff.
	let diff: string | undefined;
	try {
		diff = await getDiff( octokit, ownerLogin, name, number );
	} catch ( error: unknown ) {
		debug( `check-if-docs-needed: Failed to fetch diff for PR #${ number }: ${ error }` );
		return;
	}

	// Check if diff is too small to analyze.
	if ( ! diff || diff.length < 50 ) {
		debug( `check-if-docs-needed: PR #${ number } diff is too small to analyze. Skipping.` );
		return;
	}

	// Clean the PR body and build the prompt.
	const cleanedBody = cleanContent( body ?? '' );
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
	let result: { is_user_facing?: unknown; confidence?: unknown; reason?: unknown } | undefined;
	try {
		result = JSON.parse( response );
	} catch ( error: unknown ) {
		debug(
			`check-if-docs-needed: Failed to parse OpenAI response for PR #${ number }: ${ error }. Response was: ${ response }`
		);
		return;
	}

	let isUserFacing = false;
	if ( typeof result?.is_user_facing === 'boolean' ) {
		isUserFacing = result.is_user_facing;
	} else {
		debug(
			`check-if-docs-needed: PR #${ number } - is_user_facing is not a boolean, got: ${ JSON.stringify(
				result?.is_user_facing
			) }. Defaulting to false.`
		);
	}

	let confidence = 'low';
	if (
		result?.confidence &&
		typeof result.confidence === 'string' &&
		[ 'low', 'medium', 'high' ].includes( result.confidence.trim().toLowerCase() )
	) {
		confidence = result.confidence.trim().toLowerCase();
	} else {
		debug(
			`check-if-docs-needed: PR #${ number } - confidence is not a valid value, got: ${ JSON.stringify(
				result?.confidence
			) }. Defaulting to low.`
		);
	}

	const reason = result?.reason && typeof result.reason === 'string' ? result.reason.trim() : '';

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

		// Send Slack notification if product ambassadors channel is configured.
		const slackProductAmbassadorsChannel = getInput( 'slack_product_ambassadors_channel' );
		const slackToken = getInput( 'slack_token' );

		if ( slackProductAmbassadorsChannel && slackToken ) {
			debug( `check-if-docs-needed: Sending Slack notification for PR #${ number }.` );
			try {
				await sendSlackMessage(
					`This PR was flagged as containing user-facing changes. Please review and update documentation if needed.\n\n*AI reasoning:* ${ reason }`,
					slackProductAmbassadorsChannel,
					payload
				);
			} catch ( error: unknown ) {
				debug(
					`check-if-docs-needed: Failed to send Slack notification for PR #${ number }: ${ error }`
				);
			}
		} else if ( slackProductAmbassadorsChannel && ! slackToken ) {
			debug(
				`check-if-docs-needed: Slack product ambassadors channel is configured but slack_token is missing. Skipping Slack notification for PR #${ number }.`
			);
		}
	} else {
		debug(
			`check-if-docs-needed: PR #${ number } is not user-facing or low confidence. Not adding label. Reason: ${ reason }`
		);
	}
}

export default checkIfDocsNeeded;
