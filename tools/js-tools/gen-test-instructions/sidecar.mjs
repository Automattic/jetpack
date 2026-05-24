/**
 * Coverage sidecar writer.
 *
 * The sidecar JSON is the audit trail for a single run. It captures everything
 * the release lead needs to reconstruct what the tool did and why: deterministic
 * + AI classifications (with diffs), the reviewer loop's history, any HITL
 * decisions and their answers, and per-PR placement in the rendered guide.
 *
 * Single-shot mode writes a subset of these fields; loop mode adds the
 * iteration/reviewer/diff metadata on top.
 */

import fs from 'fs';

/**
 * Write the coverage sidecar JSON.
 *
 * @param {string}  outputPath                     - Destination JSON path.
 * @param {object}  payload                        - See README in repo for field reference.
 * @param {string}  payload.pipeline               - 'single' or 'loop'.
 * @param {number}  [payload.iterations]           - Number of plan iterations actually run (loop mode).
 * @param {Array}   payload.classifications        - Merged classification records (one per in-scope PR).
 * @param {Array}   [payload.classificationDiffs]  - Per-PR diffs between deterministic and AI classifications.
 * @param {Array}   [payload.reviewerHistory]      - Reviewer findings per iteration.
 * @param {Array}   [payload.decisionsPending]     - Decisions surfaced but not answered (non-interactive mode).
 * @param {Array}   [payload.decisionAnswers]      - Answers the human gave to decisions (interactive mode).
 * @param {boolean} [payload.minorRemarksAppended] - Whether `## Reviewer Notes` was appended to the markdown.
 * @param {object}  payload.guide                  - Parsed AI guide JSON (used to compute placement).
 * @param {Set}     payload.userExcluded           - PR numbers excluded by the user (CLI or interactive).
 * @return {void}
 */
export function writeCoverageSidecar( outputPath, payload ) {
	const {
		pipeline,
		iterations,
		classifications,
		classificationDiffs = [],
		reviewerHistory = [],
		decisionsPending = [],
		decisionAnswers = [],
		minorRemarksAppended = false,
		guide,
		userExcluded,
	} = payload;

	const sections = Array.isArray( guide?.sections ) ? guide.sections : [];
	const otherChanges = Array.isArray( guide?.other_changes ) ? guide.other_changes : [];

	const placement = new Map();
	for ( const s of sections ) {
		for ( const pr of s.related_prs || [] ) {
			placement.set( pr, { kind: 'section', title: s.title } );
		}
		for ( const st of s.sub_tests || [] ) {
			for ( const pr of st.related_prs || [] ) {
				placement.set( pr, { kind: 'sub_test', section: s.title, sub_test: st.title } );
			}
		}
	}
	for ( const c of otherChanges ) {
		if ( c.pr ) {
			placement.set( c.pr, { kind: 'other_changes' } );
		}
	}

	const body = {
		generated_at: new Date().toISOString(),
		pipeline,
		...( typeof iterations === 'number' ? { iterations } : {} ),
		classifications: classifications.map( c => ( {
			...c,
			placement: placement.get( c.pr ) || { kind: 'other_changes_auto' },
			excluded_by_user: userExcluded.has( c.pr ),
		} ) ),
	};

	if ( pipeline === 'loop' ) {
		body.classification_diffs = classificationDiffs;
		body.reviewer_history = reviewerHistory;
		body.decisions_pending = decisionsPending;
		body.decision_answers = decisionAnswers;
		body.minor_remarks_appended = minorRemarksAppended;
	}

	fs.writeFileSync( outputPath, JSON.stringify( body, null, 2 ) );
}
