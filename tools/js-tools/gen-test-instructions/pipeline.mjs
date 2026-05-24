/**
 * Pipeline orchestrators.
 *
 * runLoopPipeline is the default flow: deterministic classify → coverage-AI
 * → plan → reviewer → loop → HITL → render. runSingleShotPipeline is the
 * legacy one-pass flow kept as an escape hatch under --pipeline=single.
 *
 * Both return `{ markdown, decisionsPending }`. When `decisionsPending` is
 * non-empty AND we ran with `nonInteractive`, the entrypoint exits with
 * EXIT_CODE_DECISIONS_PENDING so CI can distinguish "needs a human" from
 * "tool crashed".
 */

import { classifyPR, printPreAICoverageReport } from './classify.mjs';
import { DEFAULT_MAX_REVIEWER_ITERATIONS } from './constants.mjs';
import { runCoverageAI, mergeClassifications, printClassificationDiffs } from './coverage-ai.mjs';
import { promptUserForExclusions, promptForDecisions, DecisionsPendingError } from './hitl.mjs';
import {
	buildConsolidationPrompt,
	runPlanWithRetry,
	renderGuide,
	printPostAIValidation,
	appendReviewerNotes,
} from './plan.mjs';
import { generateRawTestInstructions } from './raw.mjs';
import { runReviewer, printReviewerFindings } from './reviewer.mjs';
import { getRunner } from './runners.mjs';
import { writeCoverageSidecar } from './sidecar.mjs';

/**
 * Build the {prNumber → first matching changelog entry} map. Used to thread
 * each PR's one-line changelog text into the classification record (and from
 * there to the AI prompts + Other PRs fallback).
 *
 * @param {Array} entries - Changelog entries.
 * @return {Map<string, object>} Map keyed by PR number string.
 */
function buildEntryByPR( entries ) {
	const entryByPR = new Map();
	for ( const entry of entries ) {
		if ( entry.prNumber && ! entryByPR.has( entry.prNumber ) ) {
			entryByPR.set( entry.prNumber, entry );
		}
	}
	return entryByPR;
}

/**
 * Resolve --exclude-prs / --include-only / interactive prompt into one Set.
 *
 * @param {Array}  classifications - All classification records.
 * @param {object} options         - Options object.
 * @return {Promise<Set<number>>} PR numbers to exclude from the AI pass.
 */
async function resolveUserExclusions( classifications, options ) {
	const { excludePrs = new Set(), includeOnly = null, nonInteractive = false } = options;
	const excluded = new Set();
	if ( includeOnly && includeOnly.size > 0 ) {
		for ( const c of classifications ) {
			if ( ! includeOnly.has( c.pr ) ) {
				excluded.add( c.pr );
			}
		}
	}
	for ( const n of excludePrs ) {
		excluded.add( n );
	}
	if ( ! nonInteractive && process.stdin.isTTY ) {
		const interactive = await promptUserForExclusions( classifications );
		for ( const n of interactive ) {
			excluded.add( n );
		}
	}
	return excluded;
}

/**
 * Legacy single-shot pipeline: classify → coverage report → optional HITL
 * scope → one consolidation call → render. Preserved for back-compat and
 * for users who want the deterministic-only behavior.
 *
 * @param {Array}  entries        - Changelog entries.
 * @param {Array}  prDetails      - PR detail records.
 * @param {string} releaseVersion - Release label.
 * @param {string} ai             - AI provider ('claude' or 'codex').
 * @param {object} options        - Pipeline options.
 * @return {Promise<{ markdown: string, decisionsPending: Array }>} Rendered markdown and any decisions the human still needs to resolve.
 */
export async function runSingleShotPipeline(
	entries,
	prDetails,
	releaseVersion,
	ai,
	options = {}
) {
	const { coverageJsonPath = null, runner: runnerOverride = null } = options;
	const labelForRelease = releaseVersion || 'upcoming release';
	const runner = runnerOverride || getRunner( ai );

	const entryByPR = buildEntryByPR( entries );
	const classifications = prDetails.map( pr =>
		classifyPR( pr, entryByPR.get( pr.number.toString() ) )
	);

	printPreAICoverageReport( classifications );

	const userExcluded = await resolveUserExclusions( classifications, options );
	const inScope = classifications.filter( c => ! userExcluded.has( c.pr ) );
	const dropped = classifications.length - inScope.length;
	process.stderr.write(
		`✓ ${ inScope.length } PRs going to the AI pass; ${ dropped } will land in "Other PRs".\n`
	);

	const prompt = buildConsolidationPrompt( inScope, labelForRelease );
	const guide = await runPlanWithRetry( runner, prompt );

	if ( ! guide ) {
		console.warn( '\n⚠️  AI consolidation failed; falling back to raw output.\n' );
		return {
			markdown: generateRawTestInstructions( entries, prDetails ),
			decisionsPending: [],
		};
	}

	const markdown = renderGuide( guide, labelForRelease, classifications );
	printPostAIValidation( guide, classifications, userExcluded );

	if ( coverageJsonPath ) {
		writeCoverageSidecar( coverageJsonPath, {
			pipeline: 'single',
			classifications,
			guide,
			userExcluded,
		} );
		process.stderr.write( `✓ Coverage sidecar written: ${ coverageJsonPath }\n` );
	}

	return { markdown, decisionsPending: [] };
}

/**
 * Loop pipeline (default): deterministic classify → coverage-AI → plan →
 * reviewer (looped) → HITL on decisions → render.
 *
 * Stage-by-stage failure handling. Coverage-AI failure: keep deterministic
 * classifications, warn, continue. Plan generator failure on every iteration:
 * fall back to raw output. Reviewer failure: accept current plan with no
 * findings and exit the loop. Decisions pending plus non-interactive: write
 * the sidecar and surface them to the entrypoint for exit code 3.
 *
 * @param {Array}  entries        - Changelog entries.
 * @param {Array}  prDetails      - PR detail records (with reviews/comments/commits).
 * @param {string} releaseVersion - Release label.
 * @param {string} ai             - AI provider ('claude' or 'codex').
 * @param {object} options        - Pipeline options.
 * @return {Promise<{ markdown: string, decisionsPending: Array }>} Rendered markdown and any decisions the human still needs to resolve.
 */
export async function runLoopPipeline( entries, prDetails, releaseVersion, ai, options = {} ) {
	const {
		coverageJsonPath = null,
		skipCoverageAi = false,
		skipReviewer = false,
		maxReviewerIterations = DEFAULT_MAX_REVIEWER_ITERATIONS,
		nonInteractive = false,
		runner: runnerOverride = null,
	} = options;

	const labelForRelease = releaseVersion || 'upcoming release';
	const runner = runnerOverride || getRunner( ai );
	const prDetailsByPR = new Map( prDetails.map( pr => [ pr.number, pr ] ) );

	const entryByPR = buildEntryByPR( entries );
	const deterministicClassifications = prDetails.map( pr =>
		classifyPR( pr, entryByPR.get( pr.number.toString() ) )
	);

	// Stage 1: Coverage AI (optional)
	let mergedClassifications = deterministicClassifications.map( c => ( { ...c } ) );
	let classificationDiffs = [];
	if ( ! skipCoverageAi ) {
		process.stderr.write( '\n🤖 Coverage-AI pass — refining deterministic classification…\n' );
		const aiOverrides = await runCoverageAI(
			deterministicClassifications,
			prDetailsByPR,
			labelForRelease,
			runner
		);
		const result = mergeClassifications( deterministicClassifications, aiOverrides );
		mergedClassifications = result.merged;
		classificationDiffs = result.diffs;
		printClassificationDiffs( classificationDiffs );
	}

	// Stage 2: Coverage report (now uses merged classifications)
	printPreAICoverageReport( mergedClassifications );

	// Stage 3: Scope HITL
	const userExcluded = await resolveUserExclusions( mergedClassifications, options );
	const inScope = mergedClassifications.filter( c => ! userExcluded.has( c.pr ) );
	const dropped = mergedClassifications.length - inScope.length;
	process.stderr.write(
		`✓ ${ inScope.length } PRs going to the AI pass; ${ dropped } will land in "Other PRs".\n`
	);

	// Stage 4: Plan + Reviewer loop
	const reviewerHistory = [];
	let guide = null;
	let reviewerFindings = null;
	let iteration = 0;
	const cap = Math.max( 1, maxReviewerIterations );

	for ( iteration = 1; iteration <= cap; iteration++ ) {
		process.stderr.write(
			`\n📐 Plan generator — iteration ${ iteration }${
				reviewerFindings ? ' (incorporating reviewer feedback)' : ''
			}…\n`
		);
		const prompt = buildConsolidationPrompt( inScope, labelForRelease, {
			reviewerFindings,
			decisionAnswers: [],
			iteration,
		} );
		const nextGuide = await runPlanWithRetry( runner, prompt );
		if ( ! nextGuide ) {
			if ( guide ) {
				console.warn(
					'\n⚠️  Plan generator failed this iteration; keeping the previous valid plan and exiting the loop.\n'
				);
				break;
			}
			console.warn(
				'\n⚠️  Plan generator failed on the first iteration; falling back to raw output.\n'
			);
			return {
				markdown: generateRawTestInstructions( entries, prDetails ),
				decisionsPending: [],
			};
		}
		guide = nextGuide;

		if ( skipReviewer ) {
			break;
		}

		process.stderr.write( '\n🔎 Reviewer pass…\n' );
		const findings = await runReviewer(
			guide,
			mergedClassifications,
			prDetailsByPR,
			labelForRelease,
			runner
		);
		reviewerHistory.push( { iteration, ...findings } );
		printReviewerFindings( findings, iteration );

		if ( findings.blockers.length === 0 ) {
			reviewerFindings = findings;
			break;
		}
		reviewerFindings = findings;
	}

	// Clamp the iteration counter to the cap when the for-loop ran to completion
	// (post-increment leaves it at cap+1 otherwise).
	if ( iteration > cap ) {
		iteration = cap;
	}

	// Cap reached with blockers still outstanding → demote them to decisions.
	if ( reviewerFindings && reviewerFindings.blockers && reviewerFindings.blockers.length > 0 ) {
		process.stderr.write(
			`\n⚠️  Reviewer still reports ${ reviewerFindings.blockers.length } blocker(s) after ${ cap } iteration(s); demoting to decisions for human review.\n`
		);
		const demoted = reviewerFindings.blockers.map( b => ( {
			pr_numbers: b.pr_numbers || [],
			summary: `[unresolved blocker after ${ cap } iterations] ${ b.summary || '' }`.trim(),
			options: [ 'Apply the suggested fix manually', 'Accept the plan as-is' ],
			suggested_fix: b.suggested_fix || '',
			demoted_from_blocker: true,
		} ) );
		reviewerFindings.decisions = [ ...( reviewerFindings.decisions || [] ), ...demoted ];
		reviewerFindings.blockers = [];
	}

	// Stage 5: HITL on decisions
	let decisionAnswers = [];
	let decisionsPending = [];
	if ( reviewerFindings && reviewerFindings.decisions && reviewerFindings.decisions.length > 0 ) {
		try {
			decisionAnswers = await promptForDecisions( reviewerFindings.decisions, {
				nonInteractive,
			} );
		} catch ( err ) {
			if ( err instanceof DecisionsPendingError ) {
				decisionsPending = err.decisions;
				process.stderr.write(
					`\n⏸️  ${ decisionsPending.length } decision(s) require human input — surfaced via sidecar JSON.\n`
				);
			} else {
				throw err;
			}
		}

		// If the human answered any decisions, regenerate one more time with their input.
		if ( decisionAnswers.length > 0 ) {
			iteration += 1;
			process.stderr.write(
				`\n📐 Plan generator — iteration ${ iteration } (applying human decisions)…\n`
			);
			const prompt = buildConsolidationPrompt( inScope, labelForRelease, {
				reviewerFindings,
				decisionAnswers,
				iteration,
			} );
			const finalGuide = await runPlanWithRetry( runner, prompt );
			if ( finalGuide ) {
				guide = finalGuide;
			} else {
				console.warn(
					'\n⚠️  Plan generator failed when applying decisions; keeping the previous plan.\n'
				);
			}
		}
	}

	// Stage 6: Render + minor remarks appendix
	let markdown = renderGuide( guide, labelForRelease, mergedClassifications );
	const minorRemarks = reviewerFindings?.minor_remarks || [];
	const appendResult = appendReviewerNotes( markdown, minorRemarks );
	markdown = appendResult.text;

	// Stage 7: Post-AI validation
	printPostAIValidation( guide, mergedClassifications, userExcluded );

	// Stage 8: Sidecar
	if ( coverageJsonPath ) {
		writeCoverageSidecar( coverageJsonPath, {
			pipeline: 'loop',
			iterations: iteration,
			classifications: mergedClassifications,
			classificationDiffs,
			reviewerHistory,
			decisionsPending,
			decisionAnswers,
			minorRemarksAppended: appendResult.appended,
			guide,
			userExcluded,
		} );
		process.stderr.write( `✓ Coverage sidecar written: ${ coverageJsonPath }\n` );
	}

	return { markdown, decisionsPending };
}
