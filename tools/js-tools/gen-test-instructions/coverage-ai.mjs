/**
 * Coverage AI stage — one batched call that confirms or corrects the deterministic
 * `classifyPR` records using richer PR metadata (reviews, comments, commits).
 *
 * The deterministic classifier is fast, free, and predictable, but blind to
 * anything that's not a literal keyword match: a reviewer comment that says
 * "this needs a Stripe account" never makes it into `external_accounts`; a
 * `Forms:` PR whose actual surface is the front-end shortcode never gets the
 * `user_facing_paths` signal. This stage layers an AI pass on top — it
 * returns ONLY the PRs whose classification needs correction, with the
 * specific fields to override. The pipeline merges those overrides back into
 * the deterministic record and records each diff in the sidecar.
 *
 * One batched call is intentional: the model can see cross-PR patterns
 * (consolidation hints that lie, sibling PRs in the same feature area) that
 * per-PR calls would miss.
 */

import {
	TESTING_INSTRUCTIONS_QUALITY_VALUES,
	SIGNAL_KEYS,
	EXTERNAL_ACCOUNT_KEYWORDS,
	ENGINEER_KEYWORDS,
} from './classify.mjs';

const ENGINEER_LABEL_VOCAB = ENGINEER_KEYWORDS.map( k => k.label );
const EXTERNAL_ACCOUNT_VOCAB = EXTERNAL_ACCOUNT_KEYWORDS.map( k => k.account );

/**
 * Build the coverage-AI prompt. Returns one JSON object listing only the PRs
 * the model wants to correct, plus a one-sentence rationale per override.
 *
 * @param {Array}               classifications - All deterministic classification records.
 * @param {Map<number, object>} prDetailsByPR   - PR detail records keyed by PR number.
 * @param {string}              releaseLabel    - Human-readable release version.
 * @return {string} Prompt text.
 */
export function buildCoverageAIPrompt( classifications, prDetailsByPR, releaseLabel ) {
	// Tight per-PR projection — keep tokens bounded.
	const inputs = classifications.map( c => {
		const pr = prDetailsByPR.get( c.pr ) || {};
		return {
			pr: c.pr,
			title: c.title,
			deterministic: {
				testing_instructions_quality: c.testing_instructions_quality,
				engineer_environment: c.engineer_environment,
				external_accounts: c.external_accounts,
				signals: c.signals,
				consolidation_hint: c.consolidation_hint,
			},
			body_excerpt: clip( pr.body || '', 2000 ),
			testing_instructions: clip( c.testing_instructions || '', 1500 ),
			review_texts: ( pr.reviewTexts || [] ).slice( 0, 8 ),
			comment_texts: ( pr.commentTexts || [] ).slice( 0, 8 ),
			commit_subjects: ( pr.commitSubjects || [] ).slice( 0, 20 ),
			files_changed: ( pr.files || [] ).slice( 0, 25 ),
			labels: c.labels,
			diff_stats: c.diff_stats,
		};
	} );

	return `You are a coverage-quality reviewer for Jetpack release ${ releaseLabel }. A deterministic keyword-based classifier has already produced one record per PR. Your job: read each PR's metadata (title, body excerpt, testing instructions, review/issue/discussion comments, commit subjects, file paths, labels) and surface ONLY the PRs whose classification is wrong or incomplete.

Return ONLY a single JSON object matching this schema. No Markdown, no code fences, no preamble:

{
  "ai_classifications": [
    {
      "pr": <int>,
      "overrides": {
        "testing_instructions_quality"?: "structured" | "partial" | "vague" | "absent",
        "engineer_environment"?: <one of: ${ JSON.stringify( ENGINEER_LABEL_VOCAB ) } or null>,
        "external_accounts"?: [<subset of ${ JSON.stringify( EXTERNAL_ACCOUNT_VOCAB ) }>],
        "consolidation_hint"?: <string or null>,
        "signals"?: {
          "security"?: <bool>,
          "release_priority"?: <bool>,
          "user_facing_paths"?: <bool>,
          "package_only"?: <bool>,
          "dependency_bump"?: <bool>,
          "composer_only"?: <bool>,
          "revert"?: <bool>,
          "large_diff"?: <bool>
        }
      },
      "rationale": "<≤200 chars; cite the specific signal that triggered the correction>"
    }
  ]
}

Rules:

1. **Omit unchanged PRs.** If the deterministic classification is correct, do NOT include the PR in your output. Brevity matters — you should typically correct fewer than 30% of PRs.

2. **Use the controlled vocabulary.** \`testing_instructions_quality\` must be one of ${ JSON.stringify(
		TESTING_INSTRUCTIONS_QUALITY_VALUES
	) }. \`engineer_environment\` must be one of ${ JSON.stringify(
		ENGINEER_LABEL_VOCAB
	) } or null. Items in \`external_accounts\` must come from ${ JSON.stringify(
		EXTERNAL_ACCOUNT_VOCAB
	) }. Never invent a new label or account name — if the PR needs one we don't have a vocabulary for, raise it via \`rationale\` but pick the closest existing value (or null/[]).

3. **Signals are independent booleans.** Each key in \`signals\` is true/false. Include only the keys you want to flip; missing keys mean "keep the deterministic value". Valid keys: ${ JSON.stringify(
		SIGNAL_KEYS
	) }.

4. **Look at evidence beyond the testing-instructions block.** Reviewer comments often surface env or account requirements the author forgot to write down. Commit subjects can reveal that a "Forms:" PR is actually a sync/backup change in disguise. File paths can promote a PR to \`user_facing_paths\` when the testing instructions read internal.

5. **Be conservative about \`testing_instructions_quality\`.** Promote 'partial' → 'structured' only when you can identify ≥2 numbered actionable steps. Demote 'structured' → 'partial' when the steps are decorative ("verify everything works as expected"). Never invent quality where there is none.

6. **One-sentence rationale.** Cite the SPECIFIC signal (e.g. "Reviewer asked author to test with Stripe", "Three commits change projects/packages/forms/src/blocks/"). No prose.

7. **Don't second-guess the consolidation_hint unless it's actively wrong.** If the title prefix is "Forms:" and the PR actually touches Forms, leave it alone. Override only when the title prefix lies about scope.

8. **Skip empty corrections.** Don't emit a PR record with an empty \`overrides\` object.

The deterministic classifier has these characteristics that you're allowed to correct:
- It only matches keyword lists, so it misses paraphrases ("the editor on wp.com" → engineer_environment).
- It looks only at testing_instructions text for env/accounts; it ignores review comments and body prose.
- It promotes ≥2 numbered steps to 'structured' regardless of whether those steps are actionable.
- It computes signals like \`security\` and \`release_priority\` from labels only — body text mentions don't count.

Here is the input — one record per PR:

${ JSON.stringify( inputs, null, 2 ) }

Output the JSON object directly to stdout. Begin your response with the literal character "{" and end it with "}".`;
}

/**
 * Cap a string to `max` chars, ellipsizing if needed.
 *
 * @param {string} s   - Source string.
 * @param {number} max - Maximum character length.
 * @return {string} Possibly-ellipsized string.
 */
function clip( s, max ) {
	if ( typeof s !== 'string' ) {
		return '';
	}
	if ( s.length <= max ) {
		return s;
	}
	return s.slice( 0, max - 1 ) + '…';
}

/**
 * Parse the coverage-AI response. Tolerates code fences and surrounding prose.
 *
 * @param {string} raw - Raw runner output.
 * @return {Array<{pr:number, overrides:object, rationale:string}>|null} Parsed override entries, or null on failure.
 */
export function parseCoverageAIJson( raw ) {
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
		if ( ! Array.isArray( parsed.ai_classifications ) ) {
			return null;
		}
		// Soft-validate each override entry; drop malformed ones.
		const cleaned = parsed.ai_classifications.filter( entry => {
			if ( ! entry || typeof entry !== 'object' ) {
				return false;
			}
			if ( typeof entry.pr !== 'number' ) {
				return false;
			}
			if ( ! entry.overrides || typeof entry.overrides !== 'object' ) {
				return false;
			}
			return Object.keys( entry.overrides ).length > 0;
		} );
		return cleaned;
	} catch {
		return null;
	}
}

/**
 * Run the coverage-AI stage with a single JSON-parse retry. Returns the
 * parsed array (possibly empty if the model said "no changes needed") or
 * null when the call fails outright — the orchestrator falls back to the
 * deterministic classification only when null is returned.
 *
 * @param {Array}    classifications - Deterministic classification records.
 * @param {Map}      prDetailsByPR   - PR detail records keyed by PR number.
 * @param {string}   releaseLabel    - Release version label.
 * @param {Function} runner          - Runner function (claude/codex).
 * @return {Promise<Array|null>} Parsed override entries, or null on failure.
 */
export async function runCoverageAI( classifications, prDetailsByPR, releaseLabel, runner ) {
	const prompt = buildCoverageAIPrompt( classifications, prDetailsByPR, releaseLabel );

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
			parsed = parseCoverageAIJson( raw );
			if ( ! parsed ) {
				lastError = new Error( 'Coverage-AI response was not valid JSON' );
				if ( attempt === 1 ) {
					console.warn( '\n⚠️  Coverage-AI response not valid JSON; retrying once.\n' );
				}
			}
		} catch ( error ) {
			lastError = error;
			break;
		}
	}

	if ( ! parsed ) {
		console.warn(
			`\n⚠️  Coverage-AI failed: ${
				lastError ? lastError.message : 'unknown error'
			}. Falling back to deterministic classification only.\n`
		);
		return null;
	}
	return parsed;
}

/**
 * Apply AI overrides on top of deterministic classifications. AI wins on conflict.
 *
 * @param {Array}      deterministic - Output of classifyPR for every in-scope PR.
 * @param {Array|null} aiOverrides   - Output of runCoverageAI (null = fallback to deterministic).
 * @return {{ merged: Array, diffs: Array }} Merged classifications and per-field diffs.
 */
export function mergeClassifications( deterministic, aiOverrides ) {
	const diffs = [];
	if ( ! Array.isArray( aiOverrides ) || aiOverrides.length === 0 ) {
		return { merged: deterministic.map( c => ( { ...c } ) ), diffs };
	}

	const overridesByPR = new Map();
	for ( const entry of aiOverrides ) {
		overridesByPR.set( entry.pr, entry );
	}

	const merged = deterministic.map( c => {
		const entry = overridesByPR.get( c.pr );
		if ( ! entry ) {
			return { ...c };
		}
		const out = { ...c };
		const { overrides = {}, rationale = '' } = entry;
		const aiOverridesRecord = {};
		for ( const key of Object.keys( overrides ) ) {
			const aiValue = overrides[ key ];
			const detValue = c[ key ];
			if ( key === 'signals' && aiValue && typeof aiValue === 'object' ) {
				// Signal overrides are key-by-key.
				const mergedSignals = { ...c.signals };
				const signalDiffs = {};
				for ( const sigKey of Object.keys( aiValue ) ) {
					if ( mergedSignals[ sigKey ] !== aiValue[ sigKey ] ) {
						signalDiffs[ sigKey ] = { from: mergedSignals[ sigKey ], to: aiValue[ sigKey ] };
						mergedSignals[ sigKey ] = aiValue[ sigKey ];
					}
				}
				if ( Object.keys( signalDiffs ).length > 0 ) {
					out.signals = mergedSignals;
					aiOverridesRecord.signals = aiValue;
					for ( const sigKey of Object.keys( signalDiffs ) ) {
						diffs.push( {
							pr: c.pr,
							field: `signals.${ sigKey }`,
							deterministic: signalDiffs[ sigKey ].from,
							ai: signalDiffs[ sigKey ].to,
							rationale,
						} );
					}
				}
				continue;
			}
			if ( ! deepEqual( detValue, aiValue ) ) {
				diffs.push( {
					pr: c.pr,
					field: key,
					deterministic: detValue,
					ai: aiValue,
					rationale,
				} );
				out[ key ] = aiValue;
				aiOverridesRecord[ key ] = aiValue;
			}
		}
		if ( Object.keys( aiOverridesRecord ).length > 0 ) {
			out.ai_overrides = aiOverridesRecord;
			out.ai_rationale = rationale;
		}
		return out;
	} );

	return { merged, diffs };
}

/**
 * Loose equality for the field values we care about: scalars by identity,
 * arrays by sorted element-wise comparison. Other types are not handled
 * because the classification schema doesn't produce them.
 *
 * @param {*} a - Left-hand value.
 * @param {*} b - Right-hand value.
 * @return {boolean} True when both values represent the same classification.
 */
function deepEqual( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( Array.isArray( a ) && Array.isArray( b ) ) {
		if ( a.length !== b.length ) {
			return false;
		}
		const sortedA = [ ...a ].sort();
		const sortedB = [ ...b ].sort();
		for ( let i = 0; i < sortedA.length; i++ ) {
			if ( sortedA[ i ] !== sortedB[ i ] ) {
				return false;
			}
		}
		return true;
	}
	return false;
}

/**
 * Pretty-print the classification diffs to stderr. The release lead sees this
 * before the plan generator runs so they understand what shifted scope.
 *
 * @param {Array} diffs - Output of mergeClassifications().diffs
 * @return {void}
 */
export function printClassificationDiffs( diffs ) {
	if ( ! Array.isArray( diffs ) || diffs.length === 0 ) {
		process.stderr.write(
			'\n🤖 Coverage-AI: no corrections to the deterministic classification.\n\n'
		);
		return;
	}
	const lines = [];
	lines.push( '' );
	lines.push(
		`🤖 Coverage-AI applied ${ diffs.length } correction(s) to the deterministic classification:`
	);
	for ( const d of diffs ) {
		const from = JSON.stringify( d.deterministic );
		const to = JSON.stringify( d.ai );
		const rationale = d.rationale ? `  — ${ d.rationale }` : '';
		lines.push( `  • #${ d.pr } ${ d.field }: ${ from } → ${ to }${ rationale }` );
	}
	lines.push( '' );
	process.stderr.write( lines.join( '\n' ) + '\n' );
}
