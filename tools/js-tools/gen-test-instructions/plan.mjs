/**
 * Plan generation stage: prompt → AI runner → JSON guide → Markdown.
 *
 * `buildConsolidationPrompt` is the same prompt that single-shot mode has
 * always used; the loop pipeline appends reviewer findings and HITL decision
 * answers to it on subsequent iterations via the optional `feedback` arg.
 *
 * The renderer owns layout, ordering, and the canonical "Before you start"
 * preamble — the AI only owns content.
 */

import { GITHUB_REPO, BEFORE_YOU_START } from './constants.mjs';

/**
 * Build the prompt that asks the AI to return a JSON consolidation of the testing guide.
 *
 * @param {Array}  classifications           - In-scope classification records (deterministic + AI-merged).
 * @param {string} releaseLabel              - Human-readable release version (e.g. "15.8").
 * @param {object} feedback                  - Optional reviewer/HITL feedback to inject for re-runs.
 * @param {object} feedback.reviewerFindings - { blockers, decisions, minor_remarks } from the previous reviewer pass.
 * @param {Array}  feedback.decisionAnswers  - Answers the human gave to `decisions` from the previous round.
 * @param {number} feedback.iteration        - 1-indexed iteration count.
 * @return {string} Prompt text to send to the AI.
 */
export function buildConsolidationPrompt( classifications, releaseLabel, feedback = {} ) {
	// Trim classification records to what the AI needs. The full record stays
	// in the sidecar JSON; here we keep the fields that influence prose decisions.
	const inputForAI = classifications.map( c => ( {
		pr: c.pr,
		title: c.title,
		author: c.author,
		changelog_text: c.changelog_text,
		testing_instructions: c.testing_instructions,
		testing_instructions_quality: c.testing_instructions_quality,
		engineer_environment: c.engineer_environment,
		external_accounts: c.external_accounts,
		signals: c.signals,
		consolidation_hint: c.consolidation_hint,
		diff_stats: c.diff_stats,
		labels: c.labels,
	} ) );

	const basePrompt = `You are producing the body of a Jetpack call-for-testing P2 post for release ${ releaseLabel }. The release lead will paste your output into a P2 post and edit it further; aim for a tester-ready draft.

Return ONLY a single JSON object matching this exact schema. No Markdown, no code fences, no preamble, no trailing prose:

{
  "version": "${ releaseLabel }",
  "sections": [
    {
      "title": "<feature area name, tester-facing — e.g. 'Donations Block', 'Forms: Email notifications', 'Jetpack Connector'>",
      "related_prs": [<int>, ...],
      "important": "<one-line callout for required setup (feature flag, account, env) OR null when no special setup is needed>",
      "context": "<1-2 sentence intro paragraph explaining what changed, OR null when steps are self-evident>",
      "steps": ["<single conversational sentence that combines action and observable outcome>", ...],
      "sub_tests": [
        {
          "title": "<sub-test name — e.g. 'Editor', 'Frontend', 'Test 1: ...'>",
          "related_prs": [<int>, ...],
          "steps": ["<step>", ...]
        }
      ]
    }
  ],
  "other_changes": [
    { "pr": <int>, "title": "<PR title>", "one_line": "<why no actionable tester-facing test exists>" }
  ],
  "flags": {
    "classification_corrections": [
      { "pr": <int>, "issue": "<what the deterministic classifier got wrong or missed>", "suggestion": "<how the user should reconsider>" }
    ],
    "coverage_concerns": [
      { "issue": "<what's worrying about coverage — over-consolidation, missing surface, vague source instructions, etc.>", "suggestion": "<concrete next step for the user>" }
    ]
  }
}

\`sub_tests\` and \`steps\` are mutually exclusive at the section level — use \`steps\` for a single-aspect section, use \`sub_tests\` when the feature has multiple distinct test scenarios that deserve their own H4 headings.

Rules for the content you generate — each cites the comment-thread lesson it exists to prevent:

1. **Faithfulness over coverage.** Every step must trace to a sentence in the source PR's testing_instructions or PR body. Do not infer prerequisites, theme matrices, multi-step flows, or verification steps the source does not explicitly state. If a PR's instructions are too thin for a concrete step, write fewer steps — do not pad. **[from comments — 15.1 Recipes section was author-flagged "thrown together in a rush"; Tung Du couldn't identify which shortcode to test. Filling that gap with invented shortcodes would have been worse, not better.]**

2. **Single-sentence steps.** Combine the action and the observable outcome in one sentence (e.g. "Toggle off Monthly as well — only Annual remains and all three toggle buttons show the last-enabled help text."). Use inline "Verify:" or "Expected:" only when the source PR explicitly provides an acceptance check; do not bifurcate every step. **[from reflection — the 15.6 to-test.md used inline Expected: selectively and was rated the strongest human-authored guide of the cycle.]**

3. **The \`important\` callout is non-negotiable when env or accounts are required.** Whenever a related PR has a non-null engineer_environment or non-empty external_accounts, set \`important\` to a single line that names the requirement (e.g. "Requires WPCOM sandbox + wpsh — skip if you don't have access." or "Needs a connected Stripe account."). The renderer also prepends env/account text deterministically, but you should include it so the section reads coherently. **[from comments — 14.9 PayPal Buttons needed a professional PayPal account that wasn't stated; 15.0's 20-block checklist implicitly required Stripe/Nextdoor/Mailchimp/OpenTable accounts (Luis Herranz couldn't test 4 of the 20 blocks); 15.2 Forms notifications shipped on an unmerged branch and two testers couldn't find the feature.]**

4. **Multi-user walkthroughs preserved.** When a PR's instructions distinguish roles (admin / editor / subscriber / connection-owner / non-owner), keep those distinctions and write role-prefixed steps ("As admin: …", "As a second admin: …"). **[from reflection — the tool's multi-user walkthroughs caught the 14.9 license-activation WSOD that humans missed; one of the tool's measurable strengths.]**

5. **Frontend verification paired with editor steps.** When a source PR touches both editor and frontend behavior, at least one step must exercise the frontend. **[from comments — 15.3 Google Sheets embed regression was caught only because a step said "View the post on the front-end and verify the document preview renders".]**

6. **Forbidden phrases.** Rewrite into concrete action+outcome pairs: "smoke test", "test thoroughly", "verify it works", "should be properly applied", "as expected", "make sure everything works", "exploratory testing", "everything should work as before". **[from comments — Mike Stott's 15.3 "I'm not sure what that means" was a direct response to copy-pasted passive-voice criteria.]**

7. **Sub-tests over wall-of-prose.** When a feature area covers more than 4-5 distinct scenarios, split into \`sub_tests\` rather than concatenating into one long list. Target each sub-test at 3-6 steps. **[from reflection — 15.6 (6 sections with sub-tests for Forms "Other") was clearer than 14.9 (5 sections, 737 words, no sub-tests).]**

8. **Consolidation must respect classification hints.** PRs sharing a \`consolidation_hint\` (e.g. all "Donations:" PRs) should consolidate into one section. PRs without a hint stand alone. Do not invent groupings.

9. **Volume target.** Aim for the whole guide at 600-1,200 words across 5-8 sections. If consolidating would push a section above ~10 steps without natural sub-test boundaries, split into sub-tests. **[from reflection — 600-1,000 words / 5-7 sections was the empirical sweet spot across 11 releases.]**

10. **\`flags\` is where you surface anything that the deterministic classifier missed.** Use \`classification_corrections\` to note PRs whose title prefix lies about scope, whose body actually mentions an env requirement the classifier missed, whose testing-instructions look structured but functionally vague, etc. Use \`coverage_concerns\` to note sections that worried you (over-consolidation, missing surface, vague source instructions you couldn't faithfully render). These flags are advisory — the user reviews them; the tool does not auto-fix.

11. **\`other_changes\` is for PRs with no actionable tester-facing test** (internal refactors, dependency bumps, PHP hardening, CI-only, package-only changes whose plugin glue lands elsewhere). Use the \`signals\` flags as hints: \`dependency_bump\`, \`composer_only\`, \`revert\` PRs almost always belong here. Do NOT dump PRs you couldn't think of steps for — only PRs that genuinely have no UI surface to exercise.

12. **PR ownership is exclusive.** Every PR number in the input MUST appear either in \`sections[].related_prs\` (including \`sub_tests[].related_prs\`) OR in \`other_changes[]\` — never both, never neither. The renderer auto-fills "Other PRs" from unplaced PRs as a safety net, but you should be explicit.

Here is the input — one classification record per in-scope PR, in changelog order:

${ JSON.stringify( inputForAI, null, 2 ) }

Output the JSON object directly to stdout. Do not save it to a file, do not announce what you did, do not wrap it in code fences. Begin your response with the literal character "{" and end it with "}".`;

	const feedbackBlock = renderFeedbackBlock( feedback );
	return feedbackBlock ? basePrompt + feedbackBlock : basePrompt;
}

/**
 * Render the reviewer-findings + HITL-answers block appended to the consolidation
 * prompt on iteration ≥ 2. Returns an empty string when there's nothing to add
 * (iteration 1 or no findings).
 *
 * @param {object} feedback - { reviewerFindings, decisionAnswers, iteration }.
 * @return {string} Appended prompt text (with leading double-newline) or ''.
 */
function renderFeedbackBlock( feedback ) {
	const { reviewerFindings, decisionAnswers, iteration } = feedback || {};
	const blockers = Array.isArray( reviewerFindings?.blockers ) ? reviewerFindings.blockers : [];
	const decisions = Array.isArray( reviewerFindings?.decisions ) ? reviewerFindings.decisions : [];
	const minor = Array.isArray( reviewerFindings?.minor_remarks )
		? reviewerFindings.minor_remarks
		: [];
	const answers = Array.isArray( decisionAnswers ) ? decisionAnswers : [];

	if (
		blockers.length === 0 &&
		decisions.length === 0 &&
		minor.length === 0 &&
		answers.length === 0
	) {
		return '';
	}

	const lines = [
		'',
		'',
		'---',
		'',
		`REVIEWER FEEDBACK TO INCORPORATE (iteration ${ iteration || '?' })`,
		'',
		'The previous version of this guide was reviewed. Your task is to regenerate the JSON guide from scratch, using the same rules as before, while resolving the items below. Do NOT produce a diff — produce the full JSON guide.',
		'',
	];

	if ( blockers.length > 0 ) {
		lines.push( 'BLOCKERS (must fix — these are rule violations):' );
		for ( const b of blockers ) {
			lines.push( renderFinding( b ) );
		}
		lines.push( '' );
	}
	if ( answers.length > 0 ) {
		lines.push(
			'HUMAN DECISIONS (the user chose these answers for previously surfaced judgment calls — honor them):'
		);
		for ( const a of answers ) {
			const prList =
				Array.isArray( a.pr_numbers ) && a.pr_numbers.length > 0
					? ' (' + a.pr_numbers.map( n => `#${ n }` ).join( ', ' ) + ')'
					: '';
			lines.push( `- ${ ( a.summary || '' ).trim() }${ prList }` );
			lines.push( `    answer: ${ a.answer }` );
		}
		lines.push( '' );
	}
	if ( decisions.length > 0 && answers.length === 0 ) {
		lines.push(
			'DECISIONS (no human input yet — apply your best judgment but flag them in `flags.coverage_concerns`):'
		);
		for ( const d of decisions ) {
			lines.push( renderFinding( d ) );
		}
		lines.push( '' );
	}
	if ( minor.length > 0 ) {
		lines.push( 'MINOR REMARKS (advisory — apply if cheap, ignore if forced):' );
		for ( const m of minor ) {
			lines.push( renderFinding( m ) );
		}
		lines.push( '' );
	}

	lines.push( 'Return the complete updated JSON guide, beginning with "{" and ending with "}".' );

	return lines.join( '\n' );
}

/**
 * Render one reviewer finding as a bullet line for the feedback block appended
 * to the consolidation prompt on subsequent iterations.
 *
 * @param {object} f - Reviewer finding ({ summary, pr_numbers, suggested_fix }).
 * @return {string} A single bullet line.
 */
function renderFinding( f ) {
	const prList =
		Array.isArray( f.pr_numbers ) && f.pr_numbers.length > 0
			? ' (' + f.pr_numbers.map( n => `#${ n }` ).join( ', ' ) + ')'
			: '';
	const fix = f.suggested_fix ? `\n    fix: ${ f.suggested_fix }` : '';
	return `- ${ ( f.summary || '(no summary)' ).trim() }${ prList }${ fix }`;
}

/**
 * Try to parse a model response as the consolidation JSON object.
 * Tolerates stray code fences and leading/trailing prose by scanning for the first balanced JSON object.
 *
 * @param {string} raw - Raw text from the AI CLI.
 * @return {object|null} Parsed guide object or null on failure.
 */
export function parseGuideJson( raw ) {
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
	const candidate = text.slice( firstBrace, lastBrace + 1 );

	try {
		const parsed = JSON.parse( candidate );
		if ( typeof parsed !== 'object' || parsed === null ) {
			return null;
		}
		if ( ! Array.isArray( parsed.sections ) ) {
			console.warn( '⚠️  Parsed JSON has no `sections` array.' );
		}
		return parsed;
	} catch {
		return null;
	}
}

/**
 * Run the plan generator with a single JSON-parse retry. Returns the parsed
 * guide or null on final failure.
 *
 * @param {Function} runner - Runner function (runClaudeCli / runCodexCli).
 * @param {string}   prompt - Prompt text.
 * @return {Promise<object|null>} Parsed guide, or null when the runner fails or returns unparseable JSON twice.
 */
export async function runPlanWithRetry( runner, prompt ) {
	let parsedGuide = null;
	let lastError = null;
	for ( let attempt = 1; attempt <= 2 && ! parsedGuide; attempt++ ) {
		try {
			const promptForAttempt =
				attempt === 1
					? prompt
					: prompt +
					  '\n\nIMPORTANT: your previous response was not valid JSON. Return ONLY the JSON object — no Markdown, no code fences, no preamble, no trailing prose.';
			const raw = await runner( promptForAttempt );
			parsedGuide = parseGuideJson( raw );
			if ( ! parsedGuide ) {
				lastError = new Error( 'AI response was not valid JSON' );
				if ( attempt === 1 ) {
					console.warn( '\n⚠️  Plan generator response not valid JSON; retrying once.\n' );
				}
			}
		} catch ( error ) {
			lastError = error;
			break;
		}
	}
	if ( ! parsedGuide && lastError ) {
		console.warn( `\n⚠️  Plan generator failed: ${ lastError.message }\n` );
	}
	return parsedGuide;
}

/**
 * Collect every PR number referenced in a section, including its sub-tests.
 *
 * @param {object} section - Section object from the AI guide.
 * @return {Array<number>} Unique PR numbers in this section.
 */
export function collectSectionPRs( section ) {
	const set = new Set();
	for ( const pr of section.related_prs || [] ) {
		set.add( pr );
	}
	for ( const st of section.sub_tests || [] ) {
		for ( const pr of st.related_prs || [] ) {
			set.add( pr );
		}
	}
	return [ ...set ];
}

/**
 * Render the AI-produced JSON guide into the deterministic Markdown shape.
 *
 * The renderer owns the structure: section ordering, label names, and the
 * canonical Before-you-start preamble. The AI only owns the contents
 * (sections, steps, action+expected text).
 *
 * @param {object} guide           - Parsed JSON object from the AI.
 * @param {string} releaseVersion  - Version label for headers (e.g. "15.8").
 * @param {Array}  classifications - Merged classification records used for
 *                                 the deterministic Important: callout and
 *                                 the Other-PRs auto-fill.
 * @return {string} Markdown document.
 */
export function renderGuide( guide, releaseVersion, classifications ) {
	const prLink = n => `[#${ n }](https://github.com/${ GITHUB_REPO }/pull/${ n })`;
	const out = [];

	const classByPR = new Map( classifications.map( c => [ c.pr, c ] ) );
	const titleByPR = new Map( classifications.map( c => [ c.pr, c.title ] ) );

	// Build a deterministic "Important:" callout for a section by unioning
	// engineer_environment and external_accounts across its related PRs. The
	// renderer takes precedence over the AI's `important` string — env / account
	// signal cannot be lost, even if the model omits it. [from comments —
	// 14.9 PayPal Buttons, 15.0 Stripe/Nextdoor blocks, 15.2 Forms unmerged
	// branch all stranded testers when the human or tool dropped the prereq.]
	const buildImportant = section => {
		const allPRs = collectSectionPRs( section );
		const envs = new Set();
		const accounts = new Set();
		for ( const pr of allPRs ) {
			const c = classByPR.get( pr );
			if ( ! c ) {
				continue;
			}
			if ( c.engineer_environment ) {
				envs.add( c.engineer_environment );
			}
			for ( const a of c.external_accounts ) {
				accounts.add( a );
			}
		}
		const parts = [];
		if ( envs.size > 0 ) {
			parts.push( `Requires ${ [ ...envs ].join( ' / ' ) } — skip if you don't have access.` );
		}
		if ( accounts.size > 0 ) {
			parts.push( `Needs a connected ${ [ ...accounts ].join( ' / ' ) } account.` );
		}
		const aiImportant = typeof section.important === 'string' ? section.important.trim() : '';
		if (
			aiImportant &&
			! parts.some( p => p.toLowerCase().includes( aiImportant.toLowerCase().slice( 0, 30 ) ) )
		) {
			parts.push( aiImportant );
		}
		return parts.length > 0 ? parts.join( ' ' ) : null;
	};

	const renderSteps = steps => {
		const arr = Array.isArray( steps ) ? steps : [];
		if ( arr.length === 0 ) {
			out.push(
				'_No steps produced — the source PR(s) had no concrete instructions to draw from._'
			);
			out.push( '' );
			return;
		}
		out.push( 'To test:' );
		out.push( '' );
		arr.forEach( ( step, i ) => {
			const text = typeof step === 'string' ? step : String( step );
			out.push( `${ i + 1 }. ${ text }` );
		} );
		out.push( '' );
	};

	const renderSectionHead = section => {
		const title = section.title || '(untitled section)';
		const related = Array.isArray( section.related_prs ) ? section.related_prs : [];
		if ( related.length === 1 ) {
			const prTitle = titleByPR.get( related[ 0 ] );
			const link = prLink( related[ 0 ] );
			out.push( `### ${ title } (${ link })` );
			if ( prTitle && prTitle !== title ) {
				out.push( '' );
				out.push( `_${ prTitle }_` );
			}
		} else {
			out.push( `### ${ title }` );
			if ( related.length > 1 ) {
				out.push( '' );
				out.push( `Related PRs: ${ related.map( prLink ).join( ', ' ) }` );
			}
		}
		out.push( '' );

		const important = buildImportant( section );
		if ( important ) {
			out.push( `> **Important:** ${ important }` );
			out.push( '' );
		}

		const context = typeof section.context === 'string' ? section.context.trim() : '';
		if ( context ) {
			out.push( context );
			out.push( '' );
		}
	};

	// File header — short prose preamble + the canonical "Before you start" block.
	// The release lead adds the testing-cycle preamble + tester roster + site
	// checkout list above this in the published P2 post.
	out.push( `## Jetpack ${ releaseVersion }: time to test!` );
	out.push( '' );
	out.push(
		'<!-- Release lead: paste the testing-cycle preamble + tester roster + site checkout list here. -->'
	);
	out.push( '' );
	out.push( '### Before you start' );
	out.push( '' );
	out.push( BEFORE_YOU_START );
	out.push( '' );
	out.push( '## General testing instructions' );
	out.push( '' );

	const sections = Array.isArray( guide.sections ) ? guide.sections : [];
	for ( const section of sections ) {
		renderSectionHead( section );

		const subTests = Array.isArray( section.sub_tests ) ? section.sub_tests : [];
		if ( subTests.length > 0 ) {
			for ( const st of subTests ) {
				const stTitle = st.title || '(untitled sub-test)';
				const stRelated = Array.isArray( st.related_prs ) ? st.related_prs : [];
				if ( stRelated.length === 1 ) {
					out.push( `#### ${ stTitle } (${ prLink( stRelated[ 0 ] ) })` );
				} else if ( stRelated.length > 1 ) {
					out.push( `#### ${ stTitle } (${ stRelated.map( prLink ).join( ', ' ) })` );
				} else {
					out.push( `#### ${ stTitle }` );
				}
				out.push( '' );
				renderSteps( st.steps );
			}
		} else {
			renderSteps( section.steps );
		}
	}

	// Other PRs — bracketed in an HTML comment so the release lead can prune
	// before publishing. Auto-populated with every classified PR that didn't
	// land in a section, plus any other_changes entries the AI added by name.
	const placedInSection = new Set();
	for ( const s of sections ) {
		for ( const pr of collectSectionPRs( s ) ) {
			placedInSection.add( pr );
		}
	}
	const otherFromAI = Array.isArray( guide.other_changes ) ? guide.other_changes : [];
	const otherByPR = new Map();
	for ( const entry of otherFromAI ) {
		if ( entry && entry.pr ) {
			otherByPR.set( entry.pr, entry );
		}
	}
	const autoOther = [];
	for ( const c of classifications ) {
		if ( ! placedInSection.has( c.pr ) ) {
			const ai = otherByPR.get( c.pr );
			autoOther.push( {
				pr: c.pr,
				title: c.title,
				one_line: ai?.one_line || c.changelog_text || '',
			} );
		}
	}

	if ( autoOther.length > 0 ) {
		out.push( '<!-- Release-lead notes (not for publication) -->' );
		out.push( '' );
		out.push( '### Other PRs in this release — no actionable test instructions' );
		out.push( '' );
		for ( const c of autoOther ) {
			const oneLine = c.one_line ? `: ${ c.one_line }` : '';
			out.push( `- ${ prLink( c.pr ) } — ${ c.title || '' }${ oneLine }` );
		}
		out.push( '' );
	}

	return out.join( '\n' );
}

/**
 * Append a "## Reviewer Notes" section listing each minor remark.
 *
 * @param {string} markdown     - The rendered guide.
 * @param {Array}  minorRemarks - Reviewer minor_remarks records.
 * @return {{ text: string, appended: boolean }} Updated markdown and whether anything was appended.
 */
export function appendReviewerNotes( markdown, minorRemarks ) {
	const notes = Array.isArray( minorRemarks ) ? minorRemarks : [];
	if ( notes.length === 0 ) {
		return { text: markdown, appended: false };
	}
	const lines = [ '', '## Reviewer Notes', '' ];
	lines.push(
		'Minor remarks surfaced by the automated reviewer. Advisory — apply (or ignore) before publishing.',
		''
	);
	for ( const m of notes ) {
		const prList =
			Array.isArray( m.pr_numbers ) && m.pr_numbers.length > 0
				? ' (' + m.pr_numbers.map( n => `#${ n }` ).join( ', ' ) + ')'
				: '';
		lines.push( `- **${ ( m.summary || '(no summary)' ).trim() }**${ prList }` );
		if ( m.suggested_fix ) {
			lines.push( `    - ${ m.suggested_fix }` );
		}
	}
	lines.push( '' );
	return { text: markdown + lines.join( '\n' ), appended: true };
}

/**
 * Post-AI coverage validation. Surfaces section-step inflation, over-
 * consolidation, dropped PRs, and importance-signal-not-honored cases.
 * Writes warnings to stderr; never auto-fixes. The user re-runs with explicit
 * --exclude-prs / --include-only flags to change scope.
 *
 * @param {object} guide            - Parsed AI guide JSON.
 * @param {Array}  classifications  - All in-scope classifications (merged).
 * @param {Set}    manuallyExcluded - PR numbers the user explicitly excluded.
 * @return {void}
 */
export function printPostAIValidation( guide, classifications, manuallyExcluded ) {
	const sections = Array.isArray( guide.sections ) ? guide.sections : [];
	const otherChanges = Array.isArray( guide.other_changes ) ? guide.other_changes : [];

	const placedInSection = new Set();
	for ( const s of sections ) {
		for ( const pr of s.related_prs || [] ) {
			placedInSection.add( pr );
		}
		for ( const st of s.sub_tests || [] ) {
			for ( const pr of st.related_prs || [] ) {
				placedInSection.add( pr );
			}
		}
	}
	const aiOtherPRs = new Set( otherChanges.map( c => c.pr ).filter( Boolean ) );
	const autoOtherPRs = new Set();
	for ( const c of classifications ) {
		if ( ! placedInSection.has( c.pr ) ) {
			autoOtherPRs.add( c.pr );
		}
	}

	let totalSteps = 0;
	const longSections = [];
	const overConsolidatedSections = [];
	for ( const s of sections ) {
		const steps =
			( Array.isArray( s.steps ) ? s.steps.length : 0 ) +
			( Array.isArray( s.sub_tests )
				? s.sub_tests.reduce(
						( a, st ) => a + ( Array.isArray( st.steps ) ? st.steps.length : 0 ),
						0
				  )
				: 0 );
		totalSteps += steps;
		if ( steps > 10 ) {
			longSections.push( { title: s.title, steps } );
		}
		if ( ( s.related_prs || [] ).length > 4 ) {
			overConsolidatedSections.push( {
				title: s.title,
				prCount: s.related_prs.length,
			} );
		}
	}

	const importantInOther = [];
	for ( const c of classifications ) {
		if (
			( c.signals.security || c.signals.release_priority ) &&
			autoOtherPRs.has( c.pr ) &&
			! manuallyExcluded.has( c.pr )
		) {
			importantInOther.push( c );
		}
	}

	const lines = [];
	lines.push( '' );
	lines.push( '📋 Coverage validation:' );
	lines.push( '' );
	lines.push( `Sections produced:         ${ sections.length }` );
	lines.push(
		`Total steps:               ${ totalSteps }${
			sections.length > 0
				? ` (avg ${ ( totalSteps / sections.length ).toFixed( 1 ) } per section)`
				: ''
		}`
	);
	lines.push( `PRs placed in sections:    ${ placedInSection.size }` );
	lines.push(
		`PRs auto-routed to "Other PRs": ${ autoOtherPRs.size }${
			manuallyExcluded.size > 0
				? ` (${ manuallyExcluded.size } via --exclude-prs / interactive prompt)`
				: ''
		}`
	);
	if ( aiOtherPRs.size > 0 && aiOtherPRs.size !== autoOtherPRs.size ) {
		lines.push(
			`AI explicitly tagged for "Other PRs": ${ aiOtherPRs.size } (renderer overrode any drift)`
		);
	}
	lines.push( '' );

	let warned = false;
	for ( const ls of longSections ) {
		warned = true;
		lines.push(
			`⚠️  Section "${ ls.title }" has ${ ls.steps } steps — consider splitting via sub-tests, or re-run with --exclude-prs to drop one or more related PRs.`
		);
	}
	for ( const oc of overConsolidatedSections ) {
		warned = true;
		lines.push(
			`⚠️  Section "${ oc.title }" consolidates ${ oc.prCount } PRs — high consolidation; review carefully.`
		);
	}
	for ( const c of importantInOther ) {
		warned = true;
		const signal = c.signals.security ? 'security' : 'release-priority';
		lines.push(
			`🚨 IMPORTANT PR #${ c.pr } ("${ c.title.slice(
				0,
				60
			) }") signaled ${ signal } but landed in "Other PRs". Review whether it deserves its own section.`
		);
	}
	const flags = guide.flags || {};
	const classCorrections = Array.isArray( flags.classification_corrections )
		? flags.classification_corrections
		: [];
	const coverageConcerns = Array.isArray( flags.coverage_concerns ) ? flags.coverage_concerns : [];
	if ( classCorrections.length > 0 || coverageConcerns.length > 0 ) {
		warned = true;
		lines.push( '' );
		lines.push( '🤖 AI-surfaced flags (advisory):' );
		for ( const f of classCorrections ) {
			const pr = f.pr ? `#${ f.pr } ` : '';
			lines.push(
				`   • ${ pr }${ f.issue || '(no issue)' }${ f.suggestion ? ` → ${ f.suggestion }` : '' }`
			);
		}
		for ( const f of coverageConcerns ) {
			lines.push(
				`   • ${ f.issue || '(no issue)' }${ f.suggestion ? ` → ${ f.suggestion }` : '' }`
			);
		}
	}

	if ( ! warned ) {
		lines.push( '✓ No coverage warnings.' );
	}
	lines.push( '' );

	process.stderr.write( lines.join( '\n' ) + '\n' );
}
