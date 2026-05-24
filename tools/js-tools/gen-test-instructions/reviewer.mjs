/**
 * Reviewer stage — reads the AI-generated guide and surfaces structured
 * findings: blockers (must fix), decisions (need human judgment), and
 * minor_remarks (advisory).
 *
 * The orchestrator loops generate → review while blockers exist, with a hard
 * iteration cap. Decisions go through HITL (TTY) or land in the sidecar
 * (non-interactive). Minor remarks are appended to the rendered markdown as
 * `## Reviewer Notes` and mirrored in the sidecar.
 *
 * The reviewer prompt excludes PR bodies — they balloon iteration tokens
 * without changing what a reviewer can catch (faithfulness violations are
 * visible from the guide + each PR's title + testing_instructions).
 */

/**
 * Build the reviewer prompt.
 *
 * @param {object} guide                 - Parsed AI guide JSON (sections/other_changes/flags).
 * @param {Array}  mergedClassifications - Merged classification records (one per in-scope PR).
 * @param {Map}    prDetailsByPR         - PR detail records keyed by PR number (used for title/changelog_text only).
 * @param {string} releaseLabel          - Release version label.
 * @return {string} Prompt text.
 */
export function buildReviewerPrompt( guide, mergedClassifications, prDetailsByPR, releaseLabel ) {
	const evidence = mergedClassifications.map( c => {
		const pr = prDetailsByPR.get( c.pr ) || {};
		return {
			pr: c.pr,
			title: c.title,
			testing_instructions: c.testing_instructions || null,
			changelog_text: c.changelog_text || null,
			engineer_environment: c.engineer_environment,
			external_accounts: c.external_accounts,
			signals: c.signals,
			labels: c.labels,
			has_review_comments: Array.isArray( pr.reviewTexts ) && pr.reviewTexts.length > 0,
		};
	} );

	return `You are reviewing a Jetpack call-for-testing guide for release ${ releaseLabel } before a human release lead sees it. Another AI just produced the guide JSON; you are the second pair of eyes.

Return ONLY a single JSON object matching this schema. No Markdown, no code fences, no preamble:

{
  "blockers": [
    { "pr_numbers": [<int>, ...], "summary": "<one sentence>", "suggested_fix": "<plan-actionable change>" }
  ],
  "decisions": [
    { "pr_numbers": [<int>, ...], "summary": "<one sentence>", "options": ["<choice A>", "<choice B>"], "suggested_fix": "<plan-actionable change>" }
  ],
  "minor_remarks": [
    { "pr_numbers": [<int>, ...], "summary": "<one sentence>", "suggested_fix": "<plan-actionable change>" }
  ]
}

Severity definitions — these are the ONLY criteria. Anything else is a minor remark:

**Blockers** — rule violations only. Use ONLY for:
1. Faithfulness violations: a step in the guide that has no basis in the source PR's testing_instructions or that fabricates a prerequisite/flow/verification the source doesn't state.
2. Missing \`important\` callout when a related PR has a non-null engineer_environment OR non-empty external_accounts. Skipping the renderer-deterministic prepend doesn't fix this — the section's tester-facing copy should also reference the requirement.
3. Forbidden vague phrases in steps: "smoke test", "test thoroughly", "verify it works", "should be properly applied", "as expected", "make sure everything works", "exploratory testing", "everything should work as before".
4. A PR with multi-role testing_instructions (admin/editor/subscriber/etc.) that the guide flattened into a single-role step.
5. A PR that touches both editor and frontend behavior but the guide has no frontend verification step.
6. A PR that landed in \`other_changes\` despite having concrete testing_instructions AND a user-facing surface signal.

**Decisions** — judgment calls a human should resolve. Use for:
- Over-consolidation across genuinely unrelated PRs (the AI grouped them, but they're not really one feature area).
- Ambiguous scope where the source PR's instructions can be interpreted multiple ways and the AI picked one without justification.
- Sub-test boundaries that look arbitrary (could be one section, could be N sub-tests — neither is wrong).
- Cases where the AI ignored a \`has_review_comments: true\` signal that probably contains additional context.

Each decision MUST include 2-4 \`options\` that name the choices a human would pick from.

**Minor remarks** — cosmetic, advisory, ignorable. Wording polish, redundant phrasing, missing punctuation, suggested re-orderings.

Constraints:
- Max 8 items per category. If you would emit more, pick the most important ones.
- \`suggested_fix\` must describe a concrete change to the guide JSON (e.g., "Add a frontend step under sub-test 'Editor' that views the post and confirms the embed renders.").
- \`pr_numbers\` is the PRs the finding concerns; empty list is allowed for guide-wide concerns.
- Do NOT report on PRs that aren't in the input evidence.
- Do NOT include findings that boil down to "this could be better worded" without a concrete fix — those are noise.

Here is the guide you are reviewing:

${ JSON.stringify( guide, null, 2 ) }

Here is the per-PR evidence (testing_instructions, classification signals, whether review comments exist):

${ JSON.stringify( evidence, null, 2 ) }

Output the JSON object directly to stdout. Begin your response with the literal character "{" and end it with "}".`;
}

/**
 * Parse the reviewer response. Tolerates code fences and surrounding prose.
 * Always returns the three-bucket shape — missing buckets default to [].
 *
 * @param {string} raw - Raw runner output.
 * @return {{blockers: Array, decisions: Array, minor_remarks: Array}|null} Parsed findings, or null on failure.
 */
export function parseReviewerJson( raw ) {
	if ( ! raw || typeof raw !== 'string' ) {
		return null;
	}
	let text = raw.trim();
	const fenceMatch = text.match( /^```(?:json)?\s*([\s\S]*?)\s*```$/i );
	if ( fenceMatch ) {
		text = fenceMatch[ 1 ].trim();
	}
	const firstBrace = text.indexOf( '{' );
	const lastBrace = text.lastIndexOf( '}' );
	if ( firstBrace < 0 || lastBrace <= firstBrace ) {
		return null;
	}
	try {
		const parsed = JSON.parse( text.slice( firstBrace, lastBrace + 1 ) );
		if ( ! parsed || typeof parsed !== 'object' ) {
			return null;
		}
		return {
			blockers: Array.isArray( parsed.blockers ) ? parsed.blockers : [],
			decisions: Array.isArray( parsed.decisions ) ? parsed.decisions : [],
			minor_remarks: Array.isArray( parsed.minor_remarks ) ? parsed.minor_remarks : [],
		};
	} catch {
		return null;
	}
}

/**
 * Run the reviewer with a single JSON-parse retry. On final failure, returns
 * the empty {blockers:[], decisions:[], minor_remarks:[]} shape so the loop
 * exits cleanly — reviewer failures should not block the pipeline.
 *
 * @param {object}   guide                 - Guide to review.
 * @param {Array}    mergedClassifications - Merged classifications.
 * @param {Map}      prDetailsByPR         - PR detail records.
 * @param {string}   releaseLabel          - Release version label.
 * @param {Function} runner                - Runner function (claude/codex).
 * @return {Promise<{blockers: Array, decisions: Array, minor_remarks: Array}>} Findings; empty buckets on failure.
 */
export async function runReviewer(
	guide,
	mergedClassifications,
	prDetailsByPR,
	releaseLabel,
	runner
) {
	const prompt = buildReviewerPrompt( guide, mergedClassifications, prDetailsByPR, releaseLabel );

	let parsed = null;
	let lastError = null;
	for ( let attempt = 1; attempt <= 2 && ! parsed; attempt++ ) {
		try {
			const promptForAttempt =
				attempt === 1
					? prompt
					: prompt +
					  '\n\nIMPORTANT: your previous response was not valid JSON. Return ONLY the JSON object — no Markdown, no code fences, no preamble.';
			const raw = await runner( promptForAttempt );
			parsed = parseReviewerJson( raw );
			if ( ! parsed ) {
				lastError = new Error( 'Reviewer response was not valid JSON' );
				if ( attempt === 1 ) {
					console.warn( '\n⚠️  Reviewer response not valid JSON; retrying once.\n' );
				}
			}
		} catch ( error ) {
			lastError = error;
			break;
		}
	}

	if ( ! parsed ) {
		console.warn(
			`\n⚠️  Reviewer failed: ${
				lastError ? lastError.message : 'unknown error'
			}. Accepting current plan; no findings to apply.\n`
		);
		return { blockers: [], decisions: [], minor_remarks: [] };
	}
	return parsed;
}

/**
 * Print reviewer findings to stderr for the run-time view.
 *
 * @param {object} findings  - { blockers, decisions, minor_remarks }
 * @param {number} iteration - 1-indexed iteration count.
 * @return {void}
 */
export function printReviewerFindings( findings, iteration ) {
	const { blockers = [], decisions = [], minor_remarks: minor = [] } = findings || {};
	const lines = [];
	lines.push( '' );
	lines.push(
		`🔎 Reviewer (iteration ${ iteration }): ${ blockers.length } blocker(s), ${ decisions.length } decision(s), ${ minor.length } minor remark(s).`
	);
	const fmt = ( prefix, items ) => {
		for ( const it of items ) {
			const prList =
				Array.isArray( it.pr_numbers ) && it.pr_numbers.length > 0
					? ' (' + it.pr_numbers.map( n => `#${ n }` ).join( ', ' ) + ')'
					: '';
			lines.push( `  ${ prefix }${ prList } ${ ( it.summary || '' ).trim() }` );
			if ( it.suggested_fix ) {
				lines.push( `       fix: ${ it.suggested_fix }` );
			}
		}
	};
	fmt( '🚧', blockers );
	fmt( '🙋', decisions );
	fmt( '📝', minor );
	lines.push( '' );
	process.stderr.write( lines.join( '\n' ) + '\n' );
}
