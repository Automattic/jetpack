import { getInput } from '@actions/core';
import debug from '../../utils/debug.ts';
import getDiff from '../../utils/get-diff.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import createLinearIssue from '../../utils/linear/create-linear-issue.ts';
import sendOpenAiRequest from '../../utils/openai/send-request.ts';
import sendSlackMessage from '../../utils/slack/send-slack-message.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';
import type { LinearIssueDetails } from '../../utils/linear/create-linear-issue.ts';

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

	return `You are a documentation triage assistant for Jetpack, a WordPress plugin developed in a monorepo. Your job is to determine whether a merged GitHub Pull Request would require an update to an existing page — or the creation of a new page — on jetpack.com/support (Jetpack's end-user support documentation site).

## IMPORTANT CONTEXT

https://jetpack.com/support documents these Jetpack features and products for end users (site owners and administrators). The following is the list of documented feature areas:

- **Security:** VaultPress Backup, Scan, Brute Force Protection (Protect), Monitor, SSO / Secure Sign On, Firewall / WAF, Account Protection
- **Performance:** Site Accelerator / Image CDN, Boost, Search, VideoPress, Infinite Scroll
- **Growth:** Stats, Social, Newsletter (incl. Newsletter Categories), Blaze, SEO Tools, Sharing, Likes, Comment Likes, Related Posts, Enhanced Distribution, Ads
- **Content & Blocks:** AI Assistant, Jetpack Blocks (Contact Form, Carousel, Tiled Galleries, Repeat Visitor, Pay with PayPal, etc.), Custom Content Types, Copy Post, Markdown, Shortcode Embeds
- **Management:** Jetpack Manage / Pro Dashboard, Plugin Management, Notifications, Modules page
- **Other:** Getting Started / Installation / Connection, Troubleshooting, Privacy / Data Sync, Gravatar Hovercards, Widget Visibility, Extra Sidebar Widgets, Sitemaps, Site Verification, WP.me Shortlinks, Post by Email, Beautiful Math / LaTeX

The docs are written for non-technical WordPress site owners. They explain how to enable, configure, and use features via the WordPress dashboard (wp-admin) or the WordPress.com dashboard (cloud.jetpack.com).

## TWO-PART TEST

Only flag a PR if BOTH conditions are true:

1. **The PR changes a feature listed above** (or introduces an entirely new user-facing feature that would need a new support page).
2. **A site owner following the existing support docs would encounter something different** — for example: a setting was added/removed/renamed, a workflow changed, a UI screen looks substantially different, a new feature was launched, plan/pricing gating changed, or a feature was deprecated/removed.

## Flag as needing docs review (is_user_facing = true):

- A new user-facing feature or setting was added to a documented area
- An existing setting, toggle, or option was renamed, moved, added, or removed
- A user-facing workflow changed (different steps to accomplish a task)
- UI layout of a documented screen changed substantially (not minor polish)
- Plan or pricing gating for a feature changed (e.g., feature moved from paid to free or vice versa)
- A feature or module was deprecated or removed
- New Jetpack block added, or existing block got new user-facing controls
- Connection or onboarding flow changed
- Default behavior of a feature changed in a way users would notice

## Do NOT flag (is_user_facing = false):

- Internal refactoring, code cleanup, or restructuring with no user-visible change
- Test file changes (adding, modifying, or removing tests)
- CI/CD, build tooling, GitHub Actions, or linting configuration
- Dependency/package version bumps with no behavior change
- Developer-facing changes (REST API internals, hooks, filters, PHP docblocks)
- Changes to developer.jetpack.com docs (that is a different site)
- Changelog file edits or version bump commits
- Performance optimizations with no visible behavior change
- Minor CSS tweaks, spacing adjustments, or color fine-tuning
- Bug fixes that restore already-documented behavior (the docs are already correct)
- Error message text changes that are not referenced in support docs
- Internal logging, tracking, or analytics instrumentation changes
- Changes scoped entirely to Calypso, WordPress.com, or WooCommerce (not jetpack.com/support)
- Changes to packages that are only consumed internally and not exposed to users
- Accessibility improvements that don't change documented workflows
- Translation/i18n string changes or locale updates

## WHEN IN DOUBT

If the change is borderline, lean toward is_user_facing = false. The goal is to surface only PRs that would actually leave a support page outdated or missing. A false negative (missing a flaggable PR) is much less costly than a false positive (noisy alerts the team learns to ignore).

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
		pull_request: { number, body, title, merged, html_url: prUrl },
		repository: {
			owner: { login: ownerLogin },
			name,
			full_name: repoFullName,
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

		// Attempt to create a Linear issue if a Linear team ID is provided.
		const linearTeamId = getInput( 'linear_docs_team_id' );

		let linearIssue: LinearIssueDetails | null = null;
		if ( linearTeamId ) {
			debug( `check-if-docs-needed: Creating Linear issue for PR #${ number }.` );
			const escapedTitle = title
				.replace( /\\/g, '\\\\' )
				.replace( /\[/g, '\\[' )
				.replace( /\]/g, '\\]' );
			const linearDescription = `A pull request was flagged as containing user-facing changes that may require documentation updates.\n\n**Pull request:** [${ escapedTitle }](${ prUrl })\n**Repository:** ${ repoFullName }\n**AI reasoning:** ${ reason }`;

			linearIssue = await createLinearIssue(
				`Docs update needed: ${ title }`,
				linearDescription,
				linearTeamId
			);

			if ( linearIssue ) {
				debug(
					`check-if-docs-needed: Created Linear issue ${ linearIssue.identifier } for PR #${ number }.`
				);
			}
		}

		// Send Slack notification if product ambassadors channel is configured.
		const slackProductAmbassadorsChannel = getInput( 'slack_product_ambassadors_channel' );
		const slackToken = getInput( 'slack_token' );

		if ( slackProductAmbassadorsChannel && slackToken ) {
			debug( `check-if-docs-needed: Sending Slack notification for PR #${ number }.` );

			let slackMessage = `This PR was flagged as containing user-facing changes. Please review and update documentation if needed.\n\n*AI reasoning:* ${ reason }`;

			if ( linearIssue ) {
				slackMessage += `\n\nA Linear issue was created to track this: *<${ linearIssue.url }|${ linearIssue.identifier }>*`;
			}

			try {
				await sendSlackMessage( slackMessage, slackProductAmbassadorsChannel, payload );
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
