/**
 * Prioritize stage — picks 3–7 "headline" PRs per release (mirroring the
 * empirical 4–9 H3 sections per published P2) and routes the long tail to
 * "Other PRs". Slots between scope HITL Checkpoint 1 and the plan/reviewer
 * loop. Without this stage the tool overshoots the P2 word target by 3–14×
 * because the plan generator treats every classified PR as a section
 * candidate.
 *
 * Per-PR output: `tier ∈ {1, 2, 3}`.
 * - Tier 1 — headline section (or named sub-test under a clustered section)
 * - Tier 2 — sub-test under a Tier 1 section, or bundled "Other tester-facing fixes"
 * - Tier 3 — withheld from plan input; renderer auto-routes to "Other PRs"
 *
 * Decisions surface to the human via a single bulk-approval screen with a
 * permissive adjustment grammar (`promote 48799 to 1`, `demote sandbox to 3`,
 * `target 4`). Non-interactive mode applies the AI proposal as-is.
 */

import { DEFAULT_TARGET_SECTIONS } from './constants.mjs';

/**
 * Deterministic Tier-3 floor — these PRs never warrant a section, no AI input
 * needed. Mirrors the criteria the reflection identified as "always routed to
 * Other PRs by the human editor": dep bumps, composer-only, reverts,
 * package-only, and absent/vague instructions without security or release
 * priority signals.
 *
 * @param {object} classification - Classification record.
 * @return {boolean} True if the PR should be pinned to Tier 3.
 */
export function isDeterministicTier3( classification ) {
	const s = classification.signals || {};
	if ( s.dependency_bump || s.composer_only || s.revert || s.package_only ) {
		return true;
	}
	const q = classification.testing_instructions_quality;
	if ( ( q === 'absent' || q === 'vague' ) && ! s.security && ! s.release_priority ) {
		return true;
	}
	return false;
}

/**
 * Human-readable reason for a deterministic Tier 3 pin. Picks the first signal
 * that triggered the floor — caller is responsible for guaranteeing the PR
 * actually matched `isDeterministicTier3`.
 *
 * @param {object} classification - Classification record.
 * @return {string} Single-sentence reason shown in the HITL screen + sidecar.
 */
function deterministicTier3Reason( classification ) {
	const s = classification.signals || {};
	if ( s.dependency_bump ) {
		return 'dependency bump (deterministic floor)';
	}
	if ( s.composer_only ) {
		return 'composer-only changes (deterministic floor)';
	}
	if ( s.revert ) {
		return 'revert (deterministic floor)';
	}
	if ( s.package_only ) {
		return 'package-only changes (deterministic floor)';
	}
	return 'vague/absent testing instructions without security or priority signal (deterministic floor)';
}

/**
 * Build the prioritize-AI prompt. Returns a tier per non-floor PR plus a
 * one-sentence reason. Floor PRs are excluded from the input — the renderer
 * sets them to Tier 3 deterministically.
 *
 * @param {Array}  inputForAI     - PR records to score (already filtered of floor PRs).
 * @param {string} releaseLabel   - Human-readable release version.
 * @param {number} targetSections - Desired Tier 1 cluster count.
 * @return {string} Prompt text.
 */
export function buildPrioritizationPrompt( inputForAI, releaseLabel, targetSections ) {
	return `You are picking the testing priorities for the Jetpack release ${ releaseLabel } P2 post. The release lead publishes the P2 with about ${ targetSections } headline sections (the empirical range across 11 historical releases is 4–9). Everything else goes under "Other PRs" or gets dropped from the published body.

Your job: assign a tier 1, 2, or 3 to each PR below, with a one-sentence reason that cites the signals you used.

Tier rules:

- **Tier 1 (headline)** — picks the ~${ targetSections } feature areas that anchor the body. Each Tier 1 PR (or cluster sharing a \`consolidation_hint\`) gets its own H3 section. Criteria: user-facing surface AND structured/partial testing_instructions AND at least one of {new-feature framing in changelog_text, security signal, release_priority signal, consolidation cluster of ≥2 PRs}. Headline sections drive what testers spend their time on; pick the surfaces most likely to surface bugs.
- **Tier 2 (covered)** — user-facing fixes or polish that deserve mention but not their own section. Allowed: sub-test under a Tier 1 section (when the PR's consolidation_hint matches a Tier 1 cluster), or bundled into a single "Other tester-facing fixes" H3.
- **Tier 3 (other_changes)** — everything else: internal refactors, large API surfaces with no UI, sandbox-only changes most testers can't exercise, surfaces with their own dedicated CFT post.

Use \`has_own_cft\` as a strong hint that the PR should be Tier 2 (link out, don't inline). Use \`cluster_size\` as a strong hint to consolidate (a 3-PR cluster typically becomes one Tier 1 section, not three).

Return ONLY a single JSON object matching this schema. No Markdown, no code fences, no preamble:

{
  "tiers": [
    { "pr": <int>, "tier": 1 | 2 | 3, "reason": "<one sentence citing the signals you used>" }
  ]
}

Constraints:
- Every PR in the input MUST appear exactly once in \`tiers\`.
- Aim for ~${ targetSections } Tier 1 PRs (after clustering, ${ targetSections } sections). It's OK to land one or two below or above; don't force a number.
- \`reason\` is shown verbatim to the release lead — be specific and short.

Here are the in-scope PRs (deterministic Tier-3 floor already removed):

${ JSON.stringify( inputForAI, null, 2 ) }

Output the JSON object directly to stdout. Begin your response with the literal character "{" and end it with "}".`;
}

/**
 * Tolerant JSON parse of the prioritize-AI response. Returns null on failure.
 *
 * @param {string} raw - Raw model output.
 * @return {object|null} Parsed object with a `tiers` array, or null.
 */
export function parsePrioritizationJson( raw ) {
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
		if ( ! parsed || typeof parsed !== 'object' || ! Array.isArray( parsed.tiers ) ) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

/**
 * Cheap derived signals layered on top of the existing classification record.
 * `has_own_cft` is true when the PR body or testing_instructions mention a
 * Call-for-Testing post (suggests Tier 2 — link out, don't inline).
 * `cluster_size` counts in-scope PRs sharing the same `consolidation_hint`.
 *
 * @param {Array}               classifications - In-scope classifications.
 * @param {Map<number, object>} prDetailsByPR   - PR details (for body scan).
 * @return {Map<number, { has_own_cft: boolean, cluster_size: number }>} PR → derived signals.
 */
export function deriveExtraSignals( classifications, prDetailsByPR ) {
	const clusterCount = new Map();
	for ( const c of classifications ) {
		if ( c.consolidation_hint ) {
			clusterCount.set(
				c.consolidation_hint,
				( clusterCount.get( c.consolidation_hint ) || 0 ) + 1
			);
		}
	}
	const cftRegex = /\b(?:call for testing|see CFT|jetpacktests\.wordpress\.com)\b/i;
	const out = new Map();
	for ( const c of classifications ) {
		const pr = prDetailsByPR?.get( c.pr ) || {};
		const text = `${ pr.body || '' }\n${ c.testing_instructions || '' }`;
		out.set( c.pr, {
			has_own_cft: cftRegex.test( text ),
			cluster_size: c.consolidation_hint ? clusterCount.get( c.consolidation_hint ) || 1 : 1,
		} );
	}
	return out;
}

/**
 * Propose tiers for the in-scope classifications. Pins the deterministic
 * Tier 3 floor first; sends only the remaining PRs to the AI. Honors
 * `headlinePrs` / `demotePrs` overrides verbatim. Falls back to a heuristic
 * tier-by-signals proposal when the AI runner fails.
 *
 * @param {Array}    classifications - In-scope classifications (post scope-HITL).
 * @param {Map}      prDetailsByPR   - PR detail records.
 * @param {string}   releaseLabel    - Release label.
 * @param {Function} runner          - AI runner.
 * @param {object}   options         - { targetSections, headlinePrs, demotePrs }.
 * @return {Promise<{ tiers: Map<number, number>, reasons: Map<number, string>, aiUsed: boolean }>} Final tier + reason maps plus whether the AI was consulted.
 */
export async function proposeTiers(
	classifications,
	prDetailsByPR,
	releaseLabel,
	runner,
	options = {}
) {
	const targetSections = options.targetSections || DEFAULT_TARGET_SECTIONS;
	const headlinePrs = options.headlinePrs instanceof Set ? options.headlinePrs : new Set();
	const demotePrs = options.demotePrs instanceof Set ? options.demotePrs : new Set();

	const tiers = new Map();
	const reasons = new Map();

	// Pass 1: deterministic floor + explicit user overrides.
	const remaining = [];
	for ( const c of classifications ) {
		if ( demotePrs.has( c.pr ) ) {
			tiers.set( c.pr, 3 );
			reasons.set( c.pr, 'forced to Tier 3 by --demote-prs' );
			continue;
		}
		if ( headlinePrs.has( c.pr ) ) {
			tiers.set( c.pr, 1 );
			reasons.set( c.pr, 'forced to Tier 1 by --headline-prs' );
			continue;
		}
		if ( isDeterministicTier3( c ) ) {
			tiers.set( c.pr, 3 );
			reasons.set( c.pr, deterministicTier3Reason( c ) );
			continue;
		}
		remaining.push( c );
	}

	if ( remaining.length === 0 ) {
		return { tiers, reasons, aiUsed: false };
	}

	// Derive the cluster/CFT signals only now that we know we'll need them.
	const extras = deriveExtraSignals( classifications, prDetailsByPR );

	// Pass 2: AI proposal for the remaining PRs.
	const inputForAI = remaining.map( c => {
		const extra = extras.get( c.pr ) || { has_own_cft: false, cluster_size: 1 };
		return {
			pr: c.pr,
			title: c.title,
			changelog_text: c.changelog_text,
			testing_instructions_quality: c.testing_instructions_quality,
			signals: c.signals,
			engineer_environment: c.engineer_environment,
			external_accounts: c.external_accounts,
			consolidation_hint: c.consolidation_hint,
			has_own_cft: extra.has_own_cft,
			cluster_size: extra.cluster_size,
		};
	} );

	const prompt = buildPrioritizationPrompt( inputForAI, releaseLabel, targetSections );

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
			parsed = parsePrioritizationJson( raw );
			if ( ! parsed && attempt === 1 ) {
				console.warn( '\n⚠️  Prioritization response not valid JSON; retrying once.\n' );
			}
		} catch ( error ) {
			lastError = error;
			break;
		}
	}

	if ( ! parsed ) {
		console.warn(
			`\n⚠️  Prioritization AI failed: ${
				lastError ? lastError.message : 'unknown error'
			}. Falling back to signal-based heuristic.\n`
		);
		applyHeuristicTiers( remaining, extras, tiers, reasons, targetSections );
		return { tiers, reasons, aiUsed: false };
	}

	// Merge AI tiers (clamped to 1-3) for PRs that didn't get the floor.
	const remainingIds = new Set( remaining.map( c => c.pr ) );
	for ( const entry of parsed.tiers ) {
		if ( ! Number.isInteger( entry?.pr ) || ! remainingIds.has( entry.pr ) ) {
			continue;
		}
		let t = parseInt( entry.tier, 10 );
		if ( ! Number.isInteger( t ) || t < 1 || t > 3 ) {
			t = 2;
		}
		tiers.set( entry.pr, t );
		reasons.set( entry.pr, ( entry.reason || '' ).trim() );
	}

	// Any PR the AI omitted falls back to the heuristic.
	const unranked = remaining.filter( c => ! tiers.has( c.pr ) );
	if ( unranked.length > 0 ) {
		applyHeuristicTiers( unranked, extras, tiers, reasons, targetSections );
	}

	return { tiers, reasons, aiUsed: true };
}

/**
 * Signal-based fallback used when the AI runner fails or omits PRs. Awards
 * Tier 1 to user-facing structured PRs with new-feature framing or a security
 * signal; Tier 2 to user-facing PRs with at least partial instructions; Tier 3
 * otherwise. Mutates `tiers` and `reasons` in place.
 *
 * @param {Array}               prs            - Classifications to rank.
 * @param {Map<number, object>} extras         - Output of deriveExtraSignals.
 * @param {Map<number, number>} tiers          - In/out map of pr → tier.
 * @param {Map<number, string>} reasons        - In/out map of pr → reason.
 * @param {number}              targetSections - Soft cap on Tier 1 count.
 * @return {void}
 */
function applyHeuristicTiers( prs, extras, tiers, reasons, targetSections ) {
	const newFeatureRegex = /\b(add|new|introduc(?:e|ing|ed))\b/i;
	const scored = prs.map( c => {
		const s = c.signals || {};
		const t = c.changelog_text || '';
		const q = c.testing_instructions_quality;
		let score = 0;
		if ( s.user_facing_paths ) score += 2;
		if ( q === 'structured' ) score += 2;
		if ( q === 'partial' ) score += 1;
		if ( newFeatureRegex.test( t ) ) score += 2;
		if ( s.security ) score += 3;
		if ( s.release_priority ) score += 3;
		const extra = extras.get( c.pr ) || { has_own_cft: false, cluster_size: 1 };
		if ( extra.cluster_size > 1 ) score += 1;
		if ( extra.has_own_cft ) score -= 1;
		return { c, score };
	} );
	scored.sort( ( a, b ) => b.score - a.score );

	let tier1Slots = Math.max( 1, targetSections * 2 ); // generous, AI consolidation will cluster
	for ( const { c, score } of scored ) {
		const s = c.signals || {};
		let tier;
		let reason;
		if ( score >= 4 && tier1Slots > 0 && s.user_facing_paths ) {
			tier = 1;
			reason = `heuristic Tier 1 (score=${ score }; user-facing + strong signals)`;
			tier1Slots--;
		} else if ( s.user_facing_paths || c.testing_instructions_quality === 'structured' ) {
			tier = 2;
			reason = `heuristic Tier 2 (score=${ score })`;
		} else {
			tier = 3;
			reason = `heuristic Tier 3 (score=${ score }; no user-facing signal)`;
		}
		tiers.set( c.pr, tier );
		reasons.set( c.pr, reason );
	}
}

/**
 * Render the bulk-approval screen the release lead sees. Groups Tier 1 by
 * consolidation cluster so the cluster→section relationship is visible.
 *
 * @param {Map<number, number>} tiers           - PR → tier.
 * @param {Map<number, string>} reasons         - PR → reason.
 * @param {Array}               classifications - Full in-scope list (for titles + signals).
 * @param {object}              options         - { targetSections }.
 * @return {string} Multi-line summary for stderr.
 */
export function formatTierSummary( tiers, reasons, classifications, options = {} ) {
	const target = options.targetSections || DEFAULT_TARGET_SECTIONS;

	const tierOf = pr => tiers.get( pr );
	const t1 = classifications.filter( c => tierOf( c.pr ) === 1 );
	const t2 = classifications.filter( c => tierOf( c.pr ) === 2 );
	const t3 = classifications.filter( c => tierOf( c.pr ) === 3 );

	const lines = [];
	lines.push( '' );
	lines.push( `📋 Prioritization (target: ${ target } sections, adjustable with "target <n>")` );
	lines.push( '' );

	// Tier 1 — group by consolidation hint to show cluster→section mapping.
	const t1ByCluster = new Map();
	const t1NoCluster = [];
	for ( const c of t1 ) {
		const key = c.consolidation_hint || null;
		if ( key ) {
			if ( ! t1ByCluster.has( key ) ) t1ByCluster.set( key, [] );
			t1ByCluster.get( key ).push( c );
		} else {
			t1NoCluster.push( c );
		}
	}
	const clusterCount = t1ByCluster.size + t1NoCluster.length;
	lines.push( `▶ Tier 1 — headline (${ t1.length } PR(s) in ${ clusterCount } cluster(s)):` );
	for ( const [ hint, items ] of t1ByCluster ) {
		const label = items.length > 1 ? `${ hint } (cluster, ${ items.length } PRs):` : `${ hint }:`;
		lines.push( `   ${ label }` );
		for ( const c of items ) {
			lines.push( formatTierLine( c, reasons.get( c.pr ) ) );
		}
	}
	for ( const c of t1NoCluster ) {
		lines.push( `   ${ c.title.split( ':' )[ 0 ].trim() || 'standalone' }:` );
		lines.push( formatTierLine( c, reasons.get( c.pr ) ) );
	}
	lines.push( '' );

	// Tier 2 — flat list, one line per PR.
	lines.push( `▶ Tier 2 — covered as sub-tests / bundled (${ t2.length } PR(s)):` );
	const t2Visible = t2.slice( 0, 12 );
	for ( const c of t2Visible ) {
		lines.push( formatTierLine( c, reasons.get( c.pr ) ) );
	}
	if ( t2.length > t2Visible.length ) {
		lines.push( `   … ${ t2.length - t2Visible.length } more (full list in sidecar JSON)` );
	}
	lines.push( '' );

	// Tier 3 — compact (just PR + title, no reason).
	lines.push( `▶ Tier 3 — routed to "Other PRs" (${ t3.length } PR(s)):` );
	const t3Visible = t3.slice( 0, 8 );
	for ( const c of t3Visible ) {
		lines.push( `   #${ c.pr } ${ truncate( c.title, 72 ) }` );
	}
	if ( t3.length > t3Visible.length ) {
		lines.push( `   … ${ t3.length - t3Visible.length } more (full list in sidecar JSON)` );
	}
	lines.push( '' );

	// Help text.
	lines.push( 'Adjust? Examples:' );
	lines.push( '   promote 48473 to 1        — move a single PR up' );
	lines.push( '   demote 48606 to 3         — move a single PR down' );
	lines.push( '   demote sandbox to 3       — bulk: route all sandbox-only PRs to Tier 3' );
	lines.push( '   demote refactor to 3      — bulk: route all refactor-only / package-only PRs' );
	lines.push(
		'   target 4                  — change target section count (re-rank with new target)'
	);
	lines.push( '   Enter (empty)             — accept and continue' );
	lines.push( '' );

	return lines.join( '\n' );
}

/**
 * Format one PR's line under a tier heading: indented PR number + title +
 * truncated reason in parens.
 *
 * @param {object} c      - Classification record (uses pr + title).
 * @param {string} reason - Reason string from the propose-tiers step.
 * @return {string} Single line for the HITL summary.
 */
function formatTierLine( c, reason ) {
	const title = truncate( c.title, 60 );
	const reasonStr = reason ? `   (${ truncate( reason, 70 ) })` : '';
	return `     #${ c.pr } ${ title }${ reasonStr }`;
}

/**
 * Collapse whitespace and cap a string at `n` characters, ending with an
 * ellipsis when truncated. Used for the HITL screen's one-line previews.
 *
 * @param {string} s - Source string (coerced from anything).
 * @param {number} n - Maximum length including ellipsis.
 * @return {string} Single-line, length-capped string.
 */
function truncate( s, n ) {
	const str = String( s || '' )
		.replace( /\s+/g, ' ' )
		.trim();
	return str.length > n ? str.slice( 0, n - 1 ) + '…' : str;
}

/**
 * Permissive grammar for HITL adjustments. Returns the updated state plus a
 * boolean indicating whether a re-rank is needed (currently only "target N"
 * triggers a re-rank — single-PR promote/demote is applied in place).
 *
 * Recognised forms: `promote <pr> to <1|2|3>`, `demote <pr> to <1|2|3>`,
 * `promote <signal> to <1|2|3>` / `demote <signal> to <1|2|3>` (signal ∈
 * {sandbox, refactor, package, vague, dep}), and `target <n>` to update
 * targetSections and trigger a re-rank.
 *
 * @param {string}              line            - Raw user input line.
 * @param {Map<number, number>} currentTiers    - Current tier map.
 * @param {Array}               classifications - Full in-scope list (for bulk grammar).
 * @param {object}              currentOptions  - Current options snapshot.
 * @return {{ updatedTiers: Map, updatedOptions: object, needsReRank: boolean, message: string }} New tier + options state and an advisory message for stderr.
 */
export function parseAdjustment( line, currentTiers, classifications, currentOptions = {} ) {
	const updatedTiers = new Map( currentTiers );
	const updatedOptions = { ...currentOptions };
	const trimmed = ( line || '' ).trim().toLowerCase();

	if ( ! trimmed ) {
		return { updatedTiers, updatedOptions, needsReRank: false, message: '' };
	}

	// target <n>
	const targetMatch = trimmed.match( /^target\s+(\d+)$/ );
	if ( targetMatch ) {
		const n = parseInt( targetMatch[ 1 ], 10 );
		if ( Number.isInteger( n ) && n >= 1 && n <= 20 ) {
			updatedOptions.targetSections = n;
			return {
				updatedTiers,
				updatedOptions,
				needsReRank: true,
				message: `target set to ${ n }; re-ranking…`,
			};
		}
		return { updatedTiers, updatedOptions, needsReRank: false, message: 'target must be 1-20' };
	}

	// (promote|demote) <pr|signal> to <n>
	const moveMatch = trimmed.match( /^(promote|demote)\s+(\S+)\s+to\s+(\d)$/ );
	if ( moveMatch ) {
		const [ , , subject, tierStr ] = moveMatch;
		const tier = parseInt( tierStr, 10 );
		if ( ! Number.isInteger( tier ) || tier < 1 || tier > 3 ) {
			return {
				updatedTiers,
				updatedOptions,
				needsReRank: false,
				message: 'tier must be 1, 2, or 3',
			};
		}

		const asInt = parseInt( subject.replace( /^#/, '' ), 10 );
		if ( Number.isInteger( asInt ) ) {
			if ( ! updatedTiers.has( asInt ) ) {
				return {
					updatedTiers,
					updatedOptions,
					needsReRank: false,
					message: `#${ asInt } is not in scope`,
				};
			}
			updatedTiers.set( asInt, tier );
			return {
				updatedTiers,
				updatedOptions,
				needsReRank: false,
				message: `#${ asInt } → Tier ${ tier }`,
			};
		}

		// Bulk by signal.
		const signalSelector = signalSelectorFor( subject );
		if ( ! signalSelector ) {
			return {
				updatedTiers,
				updatedOptions,
				needsReRank: false,
				message: `unknown selector "${ subject }" — try a PR number or one of: sandbox, refactor, package, vague, dep`,
			};
		}
		let changed = 0;
		for ( const c of classifications ) {
			if ( signalSelector( c ) ) {
				updatedTiers.set( c.pr, tier );
				changed++;
			}
		}
		return {
			updatedTiers,
			updatedOptions,
			needsReRank: false,
			message: `${ changed } PR(s) matching "${ subject }" → Tier ${ tier }`,
		};
	}

	return {
		updatedTiers,
		updatedOptions,
		needsReRank: false,
		message: 'unrecognised input — see examples above',
	};
}

/**
 * Map a bulk-adjustment selector name (e.g. "sandbox", "refactor") to a
 * predicate over classification records. Returns null for unknown selectors;
 * the caller surfaces that as a help message.
 *
 * @param {string} name - Selector keyword from the user's adjustment line.
 * @return {Function|null} `(classification) => boolean` predicate, or null.
 */
function signalSelectorFor( name ) {
	switch ( name ) {
		case 'sandbox':
			return c => !! c.engineer_environment;
		case 'refactor':
			return c =>
				/^(refactor|chore|rename|cleanup|move|reorganize)/i.test( c.title || '' ) &&
				! ( c.signals && c.signals.user_facing_paths );
		case 'package':
			return c => c.signals && c.signals.package_only;
		case 'vague':
			return c =>
				c.testing_instructions_quality === 'vague' || c.testing_instructions_quality === 'absent';
		case 'dep':
			return c => c.signals && ( c.signals.dependency_bump || c.signals.composer_only );
		default:
			return null;
	}
}

/**
 * Run the prioritization stage end-to-end: propose tiers (deterministic floor
 * + AI + heuristic fallback), then (when stdin is a TTY and not
 * `--non-interactive`) show the summary and accept adjustments until the user
 * presses Enter on an empty line. Returns the final state for the pipeline.
 *
 * The pipeline derives `inScopeForPlan = tier 1+2` and withholds Tier 3 from
 * the plan generator's input; the renderer auto-fills the Other PRs block
 * from anything not in `sections[].related_prs`.
 *
 * @param {Array}    classifications - In-scope classifications (post scope-HITL).
 * @param {Map}      prDetailsByPR   - PR detail records.
 * @param {string}   releaseLabel    - Release label.
 * @param {Function} runner          - AI runner.
 * @param {object}   options         - { targetSections, headlinePrs, demotePrs, nonInteractive }.
 * @return {Promise<{ finalTiers: Map<number,number>, proposed: Array, finalOptions: object, userAdjustments: Array<string>, aiUsed: boolean }>} Final tier map, AI's original proposal (for audit), final options after any `target N` adjustments, the user's adjustment lines, and whether the AI was consulted.
 */
export async function runPrioritizationStage(
	classifications,
	prDetailsByPR,
	releaseLabel,
	runner,
	options = {}
) {
	let currentOptions = {
		targetSections: options.targetSections || DEFAULT_TARGET_SECTIONS,
		headlinePrs: options.headlinePrs instanceof Set ? options.headlinePrs : new Set(),
		demotePrs: options.demotePrs instanceof Set ? options.demotePrs : new Set(),
	};
	const nonInteractive = !! options.nonInteractive;

	process.stderr.write( '\n🎯 Prioritization — picking headline PRs…\n' );
	let { tiers, reasons, aiUsed } = await proposeTiers(
		classifications,
		prDetailsByPR,
		releaseLabel,
		runner,
		currentOptions
	);

	// Snapshot of the AI's (or heuristic's) proposal — captured before HITL.
	const proposed = classifications.map( c => ( {
		pr: c.pr,
		tier: tiers.get( c.pr ),
		reason: reasons.get( c.pr ) || '',
	} ) );

	if ( nonInteractive || ! process.stdin.isTTY ) {
		process.stderr.write( `✓ Applied prioritization without HITL: ${ summarize( tiers ) }\n` );
		return {
			finalTiers: tiers,
			proposed,
			finalOptions: currentOptions,
			userAdjustments: [],
			aiUsed,
		};
	}

	const readline = await import( 'readline' );
	const rl = readline.createInterface( { input: process.stdin, output: process.stderr } );
	const ask = q => new Promise( resolve => rl.question( q, resolve ) );

	const userAdjustments = [];
	let needsReRank = false;

	while ( true ) {
		if ( needsReRank ) {
			const reranked = await proposeTiers(
				classifications,
				prDetailsByPR,
				releaseLabel,
				runner,
				currentOptions
			);
			tiers = reranked.tiers;
			reasons = reranked.reasons;
			aiUsed = aiUsed || reranked.aiUsed;
			needsReRank = false;
		}

		process.stderr.write( formatTierSummary( tiers, reasons, classifications, currentOptions ) );
		const reply = await ask( '> ' );
		const trimmed = ( reply || '' ).trim();
		if ( ! trimmed ) {
			break;
		}

		const result = parseAdjustment( trimmed, tiers, classifications, currentOptions );
		if ( result.message ) {
			process.stderr.write( `   ${ result.message }\n` );
		}
		tiers = result.updatedTiers;
		currentOptions = result.updatedOptions;
		userAdjustments.push( trimmed );
		needsReRank = result.needsReRank;
	}

	rl.close();
	return { finalTiers: tiers, proposed, finalOptions: currentOptions, userAdjustments, aiUsed };
}

/**
 * One-line tier histogram for stderr logging when prioritization runs without
 * an HITL prompt (e.g. --non-interactive).
 *
 * @param {Map<number, number>} tiers - PR → tier map.
 * @return {string} "<N> Tier 1, <N> Tier 2, <N> Tier 3".
 */
function summarize( tiers ) {
	let t1 = 0,
		t2 = 0,
		t3 = 0;
	for ( const v of tiers.values() ) {
		if ( v === 1 ) t1++;
		else if ( v === 2 ) t2++;
		else if ( v === 3 ) t3++;
	}
	return `${ t1 } Tier 1, ${ t2 } Tier 2, ${ t3 } Tier 3`;
}
