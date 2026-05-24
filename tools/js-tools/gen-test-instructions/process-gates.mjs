/**
 * Deterministic publishability gates for the generated testing guide.
 *
 * These checks cover failure modes that v2 comparisons showed AI review can
 * notice but not always reliably apply: accepted section splits that do not
 * reshape output, fabricated commands that survive a "remove" decision, and
 * named baseline coverage silently demoted to the "Other PRs" tail.
 */

import fs from 'fs';

const OTHER_PLACEMENTS = new Set( [ 'other_changes', 'other_changes_auto' ] );

/**
 * Load baseline placement evidence from a sidecar JSON and/or prior markdown.
 * The sidecar is authoritative; markdown fills gaps when a sidecar is not
 * available or lacks a PR's named placement.
 *
 * @param {object} options                  - Baseline inputs.
 * @param {string} options.coverageJsonPath - Optional sidecar JSON path.
 * @param {string} options.markdownPath     - Optional baseline markdown path.
 * @return {Array<object>} Baseline classification-like records with placement.
 */
export function loadBaselineEvidence( { coverageJsonPath = null, markdownPath = null } = {} ) {
	const byPR = new Map();

	if ( coverageJsonPath ) {
		const parsed = JSON.parse( fs.readFileSync( coverageJsonPath, 'utf8' ) );
		for ( const c of parsed.classifications || [] ) {
			if ( Number.isInteger( c.pr ) ) {
				byPR.set( c.pr, c );
			}
		}
	}

	if ( markdownPath ) {
		for ( const c of parseBaselineMarkdown( fs.readFileSync( markdownPath, 'utf8' ) ) ) {
			const existing = byPR.get( c.pr );
			if ( ! existing || OTHER_PLACEMENTS.has( existing.placement?.kind ) ) {
				byPR.set( c.pr, { ...existing, ...c } );
			}
		}
	}

	return [ ...byPR.values() ];
}

/**
 * Attach rendered-guide placement to classification records.
 *
 * @param {Array}  classifications - Classification records.
 * @param {object} guide           - Parsed guide JSON.
 * @param {Set}    userExcluded    - PRs excluded by the user.
 * @return {Array<object>} Cloned classifications with placement metadata.
 */
export function annotateClassificationsWithPlacement(
	classifications,
	guide,
	userExcluded = new Set()
) {
	const placement = buildPlacementMap( guide );
	return classifications.map( c => ( {
		...c,
		placement: placement.get( c.pr ) || { kind: 'other_changes_auto' },
		excluded_by_user: userExcluded.has( c.pr ),
	} ) );
}

/**
 * Validate that accepted reviewer decisions had visible effects in the guide.
 *
 * @param {Array}  decisionAnswers - HITL answers fed back to the planner.
 * @param {object} guide           - Parsed guide JSON.
 * @return {Array<object>} Failures that should block publishability.
 */
export function validateDecisionEffects( decisionAnswers, guide ) {
	const answers = Array.isArray( decisionAnswers ) ? decisionAnswers : [];
	const sectionTitles = new Set( ( guide.sections || [] ).map( s => normalizeTitle( s.title ) ) );
	const subTestTitles = new Set();
	const guideText = flattenGuideText( guide );
	for ( const section of guide.sections || [] ) {
		for ( const st of section.sub_tests || [] ) {
			subTestTitles.add( normalizeTitle( st.title ) );
		}
	}

	const failures = [];
	for ( const answer of answers ) {
		const text = answer.answer || '';
		const lower = text.toLowerCase();
		const explicitFailures = validateExpectedEffects(
			Array.isArray( answer.expected_effects ) ? answer.expected_effects : [],
			{ guide, sectionTitles, subTestTitles, guideText }
		);
		for ( const failure of explicitFailures ) {
			failures.push( {
				pr_numbers: answer.pr_numbers || [],
				summary: failure,
				answer: text,
			} );
		}

		if ( /\bsplit into two sections\b/i.test( text ) ) {
			const missing = quotedTitles( text ).filter(
				title => ! sectionTitles.has( normalizeTitle( title ) )
			);
			if ( missing.length > 0 ) {
				failures.push( {
					pr_numbers: answer.pr_numbers || [],
					summary: `Accepted decision expected section "${ missing.join(
						'" and "'
					) }", but the regenerated guide does not contain it.`,
					answer: text,
				} );
			}
		}

		if ( /\bown sub-test titled\b/i.test( text ) ) {
			for ( const title of quotedTitles( text ) ) {
				if ( ! subTestTitles.has( normalizeTitle( title ) ) ) {
					failures.push( {
						pr_numbers: answer.pr_numbers || [],
						summary: `Accepted decision expected sub-test "${ title }", but the regenerated guide does not contain it.`,
						answer: text,
					} );
				}
			}
		}

		if (
			lower.includes( 'remove fabricated' ) &&
			/\bwp\s+ability\s+(?:list|run)\b/i.test( guideText )
		) {
			failures.push( {
				pr_numbers: answer.pr_numbers || [],
				summary:
					'Accepted decision asked to remove fabricated command text, but a fabricated `wp ability` command is still present.',
				answer: text,
			} );
		}

		const dropMatch = text.match( /\bdrop\s+#?(\d+)\s+from\b/i );
		if ( dropMatch ) {
			const pr = parseInt( dropMatch[ 1 ], 10 );
			const placed = buildPlacementMap( guide ).get( pr );
			if ( placed && placed.kind !== 'other_changes' ) {
				failures.push( {
					pr_numbers: answer.pr_numbers || [],
					summary: `Accepted decision asked to drop #${ pr } from its related PRs, but it is still placed in the guide body.`,
					answer: text,
				} );
			}
		}
	}
	return failures;
}

/**
 * Validate explicit expected effects from reviewer decisions.
 *
 * @param {Array}  effects - Expected effect records.
 * @param {object} context - Guide lookup context.
 * @return {Array<string>} Failure summaries.
 */
function validateExpectedEffects( effects, context ) {
	const failures = [];
	for ( const effect of effects ) {
		const kind = effect?.kind;
		const value = effect?.value;
		if ( ! kind || value === undefined || value === null ) {
			continue;
		}
		if ( kind === 'section_exists' && ! context.sectionTitles.has( normalizeTitle( value ) ) ) {
			failures.push( `Expected section "${ value }" is missing from the regenerated guide.` );
		} else if (
			kind === 'sub_test_exists' &&
			! context.subTestTitles.has( normalizeTitle( value ) )
		) {
			failures.push( `Expected sub-test "${ value }" is missing from the regenerated guide.` );
		} else if (
			kind === 'text_absent' &&
			context.guideText.toLowerCase().includes( String( value ).toLowerCase() )
		) {
			failures.push( `Expected text "${ value }" should have been removed but is still present.` );
		} else if ( kind === 'pr_not_in_body' ) {
			const pr = parseInt( value, 10 );
			const placement = buildPlacementMap( context.guide ).get( pr );
			if ( placement && placement.kind !== 'other_changes' ) {
				failures.push(
					`Expected #${ pr } to be absent from the guide body, but it is still placed.`
				);
			}
		}
	}
	return failures;
}

/**
 * Compare current placement to a previous generated guide. A PR that used to
 * have named section/sub-test coverage and now only appears in "Other PRs" is
 * a narrative-loss risk unless explicitly accepted in release context.
 *
 * @param {Array}  currentClassifications  - Current records with placement.
 * @param {Array}  baselineClassifications - Baseline records with placement.
 * @param {object} options                 - Optional behavior flags.
 * @param {object} options.releaseContext  - Release context with accepted demotions.
 * @return {Array<object>} Narrative-loss warnings.
 */
export function findNarrativeLosses(
	currentClassifications,
	baselineClassifications,
	{ releaseContext = null } = {}
) {
	const accepted = new Set( ( releaseContext?.accepted_demotions || [] ).map( Number ) );
	const baselineByPR = new Map();
	for ( const c of baselineClassifications || [] ) {
		if ( Number.isInteger( c.pr ) ) {
			baselineByPR.set( c.pr, c );
		}
	}

	const losses = [];
	for ( const current of currentClassifications || [] ) {
		if ( current.excluded_by_user || accepted.has( current.pr ) ) {
			continue;
		}
		const baseline = baselineByPR.get( current.pr );
		if ( ! baseline ) {
			continue;
		}
		const before = baseline.placement || {};
		const after = current.placement || {};
		if ( ! isNamedPlacement( before ) || ! OTHER_PLACEMENTS.has( after.kind ) ) {
			continue;
		}
		const title = before.sub_test || before.title || before.section || 'named coverage';
		losses.push( {
			pr: current.pr,
			title: current.title || baseline.title || '',
			summary: `#${ current.pr } previously had named coverage in "${ title }" but now lands in Other PRs.`,
			before,
			after,
		} );
	}
	return losses;
}

/**
 * Print process-gate failures/warnings.
 *
 * @param {object} gates - Gate arrays.
 * @return {void}
 */
export function printProcessGateReport( gates ) {
	const unresolved = gates.unresolvedReviewGates || [];
	const effects = gates.decisionEffectFailures || [];
	const losses = gates.narrativeLosses || [];
	const total = unresolved.length + effects.length + losses.length;
	if ( total === 0 ) {
		process.stderr.write( '\n🧷 Process gates: publishable\n\n' );
		return;
	}

	const lines = [ '', '🧷 Process gates: manual review required', '' ];
	for ( const gate of unresolved ) {
		const prs = formatPRs( gate.pr_numbers );
		lines.push( `- Unresolved decision${ prs }: ${ gate.summary || '(no summary)' }` );
		if ( gate.reason ) {
			lines.push( `  Reason: ${ gate.reason }` );
		}
	}
	for ( const failure of effects ) {
		const prs = formatPRs( failure.pr_numbers );
		lines.push( `- Decision effect failed${ prs }: ${ failure.summary }` );
	}
	for ( const loss of losses ) {
		lines.push( `- Narrative loss: ${ loss.summary }` );
	}
	lines.push( '' );
	process.stderr.write( lines.join( '\n' ) + '\n' );
}

/**
 * Extract PR placement from rendered markdown headings.
 *
 * @param {string} markdown - Baseline markdown.
 * @return {Array<object>} Baseline records.
 */
function parseBaselineMarkdown( markdown ) {
	const records = [];
	let currentSection = null;
	let currentSubTest = null;
	for ( const line of String( markdown || '' ).split( '\n' ) ) {
		const h4 = line.match( /^####\s+(.+)/ );
		const h3 = line.match( /^###\s+(.+)/ );
		if ( h4 ) {
			currentSubTest = cleanHeading( h4[ 1 ] );
		} else if ( h3 ) {
			currentSection = cleanHeading( h3[ 1 ] );
			currentSubTest = null;
		}

		for ( const match of line.matchAll( /\[#(\d+)\]/g ) ) {
			const pr = parseInt( match[ 1 ], 10 );
			records.push( {
				pr,
				placement: currentSubTest
					? { kind: 'sub_test', section: currentSection, sub_test: currentSubTest }
					: { kind: 'section', title: currentSection },
			} );
		}
	}
	return records;
}

/**
 * Build PR placement lookup from guide JSON.
 *
 * @param {object} guide - Parsed guide JSON.
 * @return {Map<number, object>} Placement by PR.
 */
function buildPlacementMap( guide ) {
	const placement = new Map();
	for ( const s of guide?.sections || [] ) {
		for ( const pr of s.related_prs || [] ) {
			placement.set( pr, { kind: 'section', title: s.title } );
		}
		for ( const st of s.sub_tests || [] ) {
			for ( const pr of st.related_prs || [] ) {
				placement.set( pr, { kind: 'sub_test', section: s.title, sub_test: st.title } );
			}
		}
	}
	for ( const c of guide?.other_changes || [] ) {
		if ( c.pr ) {
			placement.set( c.pr, { kind: 'other_changes' } );
		}
	}
	return placement;
}

/**
 * Check whether a placement represents named body coverage.
 *
 * @param {object} placement - Placement record.
 * @return {boolean} Whether placement is section/sub-test coverage.
 */
function isNamedPlacement( placement ) {
	return placement?.kind === 'section' || placement?.kind === 'sub_test';
}

/**
 * Flatten guide text for forbidden-survivor checks.
 *
 * @param {object} guide - Parsed guide JSON.
 * @return {string} Concatenated guide text.
 */
function flattenGuideText( guide ) {
	const chunks = [];
	for ( const section of guide?.sections || [] ) {
		chunks.push( section.title, section.important, section.context );
		for ( const step of section.steps || [] ) {
			chunks.push( step );
		}
		for ( const st of section.sub_tests || [] ) {
			chunks.push( st.title, st.important );
			for ( const step of st.steps || [] ) {
				chunks.push( step );
			}
		}
	}
	return chunks.filter( Boolean ).join( '\n' );
}

/**
 * Extract single-quoted titles from reviewer answer text.
 *
 * @param {string} text - Reviewer answer text.
 * @return {Array<string>} Quoted title strings.
 */
function quotedTitles( text ) {
	return [ ...String( text || '' ).matchAll( /'([^']+)'/g ) ].map( match => match[ 1 ] );
}

/**
 * Normalize a heading title for comparisons.
 *
 * @param {string} title - Title text.
 * @return {string} Normalized title.
 */
function normalizeTitle( title ) {
	return String( title || '' )
		.trim()
		.toLowerCase();
}

/**
 * Strip PR-link suffixes from markdown headings.
 *
 * @param {string} heading - Raw heading text.
 * @return {string} Clean heading.
 */
function cleanHeading( heading ) {
	return String( heading || '' )
		.replace( /\s+\(\[#\d+][^)]+\)\s*$/g, '' )
		.trim();
}

/**
 * Format PR numbers for process-gate messages.
 *
 * @param {Array<number>} prs - PR numbers.
 * @return {string} Formatted suffix.
 */
function formatPRs( prs ) {
	return Array.isArray( prs ) && prs.length > 0
		? ` (${ prs.map( pr => `#${ pr }` ).join( ', ' ) })`
		: '';
}
