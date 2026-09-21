/**
 * Turns a diff result (from diff.js) into the Markdown block a reviewer pastes into a
 * port PR. No browser here either -- plain data in, a string out.
 */

import { redactUrl } from './diff.js';
import { DEFAULT_GEOMETRY_TARGETS } from './selectors.js';

const STATUS_LABEL = {
	ok: 'OK',
	changed: 'CHANGED',
	missing: 'MISSING',
};

/**
 * @param {object}   geometryDiff         - One entry from `diffGeometry()`.
 * @param {string}   geometryDiff.key     - Target key (e.g. `wpbodyContent`).
 * @param {string}   geometryDiff.label   - Human-readable target name.
 * @param {string}   geometryDiff.status  - `'ok'` | `'changed'` | `'missing'` | `'hidden-changed'`.
 * @param {?object}  geometryDiff.before  - The flag-off capture's entry for this target, or null.
 * @param {string[]} geometryDiff.details - Lines describing what changed.
 * @param {object}   targets              - Selector config, for `required` and `allowHidden`.
 * @return {string} A single Markdown table row.
 */
function geometryRow( { key, label, status, before, details }, targets ) {
	const required = targets[ key ]?.required ?? false;

	if ( status === 'hidden-changed' ) {
		const allowed = targets[ key ]?.allowHidden ?? false;
		const effectiveStatus = allowed ? 'OK (hidden by design)' : 'CHANGED';
		return `| ${ label } | ${ effectiveStatus } | ${ details.join( '<br>' ) } |`;
	}

	const effectiveStatus =
		status === 'missing' && ! required ? 'ok (not present, optional)' : STATUS_LABEL[ status ];
	let detailText = '—';
	if ( status === 'missing' ) {
		const side = ! before ? 'before (flag off)' : 'after (flag on)';
		detailText = `not found in ${ side }${ required ? ' -- required target' : '' }`;
	} else if ( details.length ) {
		detailText = details.join( '<br>' );
	}
	return `| ${ label } | ${ effectiveStatus } | ${ detailText } |`;
}

/**
 * Targets that produced no diff entry at all, because their selector matched in neither
 * capture. Without a row the report reads the same as a passing check -- most often when
 * --control-selector was left off, so step 2's box model was never measured.
 *
 * @param {object[]} geometry - From `diffGeometry()`.
 * @param {object}   targets  - Selector config.
 * @return {Array<{key: string, row: string, required: boolean}>}
 */
function unmeasuredTargets( geometry, targets ) {
	const measured = new Set( geometry.map( g => g.key ) );
	return Object.entries( targets )
		.filter( ( [ key ] ) => ! measured.has( key ) )
		.map( ( [ key, target ] ) => {
			const required = target.required ?? false;
			const reason = target.selector
				? 'selector matched in neither capture'
				: 'no selector given (--control-selector)';
			const status = required ? 'NOT MEASURED' : 'skipped (optional)';
			return { key, required, row: `| ${ target.label } | ${ status } | ${ reason } |` };
		} );
}

/**
 * @param {object[]} requests
 * @param {object}   [options] - Passed to `redactUrl()`, so displayed URLs match the ignore list used for matching.
 * @return {string} One Markdown bullet list line per request, or a single "none" line.
 */
function requestList( requests, options ) {
	if ( requests.length === 0 ) {
		return '  - none';
	}
	return requests
		.map( r => {
			const repeats = r.count > 1 ? ` (fired ${ r.count }x)` : '';
			return `  - \`${ r.method } ${ redactUrl( r.url, options ) }\` -> ${ r.status }${ repeats }`;
		} )
		.join( '\n' );
}

/**
 * @param {{key: string, beforeStatuses: number[], afterStatuses: number[]}[]} changes - From `diffNetwork().statusChanged`.
 * @return {string} One Markdown bullet list line per changed request, or a single "none" line.
 */
function statusChangeList( changes ) {
	if ( changes.length === 0 ) {
		return '  - none';
	}
	return changes
		.map(
			c =>
				`  - \`${ c.key }\`: ${ c.beforeStatuses.join( ', ' ) } -> ${ c.afterStatuses.join( ', ' ) }`
		)
		.join( '\n' );
}

/**
 * @param {{key: string, beforeCount: number, afterCount: number}[]} changes - From `diffNetwork().countChanged`.
 * @return {string} One Markdown bullet list line per request, or a single "none" line.
 */
function countChangeList( changes ) {
	if ( changes.length === 0 ) {
		return '  - none';
	}
	return changes
		.map( c => `  - \`${ c.key }\`: fired ${ c.beforeCount }x -> ${ c.afterCount }x` )
		.join( '\n' );
}

/**
 * @param {{geometry: object[], network: object}} diffResult              - From `diffSnapshots()`.
 * @param {object}                                meta                    - Run context to print in the header.
 * @param {string}                                meta.url                - Page URL that was captured.
 * @param {string}                                [meta.flag]             - Feature flag name.
 * @param {string}                                [meta.beforeCapturedAt] - ISO timestamp of the flag-off capture.
 * @param {string}                                [meta.afterCapturedAt]  - ISO timestamp of the flag-on capture.
 * @param {object}                                [targets]               - Selector config; defaults to `DEFAULT_GEOMETRY_TARGETS`.
 * @param {object}                                [options]               - Passed to `redactUrl()` for the network section; also accepted by `diffSnapshots()`.
 * @return {string} Markdown, ready to paste into a PR description.
 */
export function formatReport(
	diffResult,
	meta = {},
	targets = DEFAULT_GEOMETRY_TARGETS,
	options = {}
) {
	const { geometry, network } = diffResult;
	const unmeasured = unmeasuredTargets( geometry, targets );
	const geometryFindings =
		geometry.filter( g => {
			if ( g.status === 'changed' ) {
				return true;
			}
			if ( g.status === 'missing' ) {
				return targets[ g.key ]?.required ?? false;
			}
			if ( g.status === 'hidden-changed' ) {
				return ! ( targets[ g.key ]?.allowHidden ?? false );
			}
			return false;
		} ).length + unmeasured.filter( u => u.required ).length;
	const networkFindings =
		network.onlyBefore.length +
		network.onlyAfter.length +
		network.statusChanged.length +
		network.countChanged.length;

	const lines = [
		'## Port verification -- steps 2 & 3 (JETPACK-2685)',
		'',
		`**Page:** \`${ meta.url ?? 'unknown' }\``,
		meta.flag ? `**Flag:** \`${ meta.flag }\`` : null,
		`**Before (flag off):** captured ${ meta.beforeCapturedAt ?? 'unknown' }`,
		`**After (flag on):** captured ${ meta.afterCapturedAt ?? 'unknown' }`,
		'',
		'### Step 2 -- computed styles and geometry',
		'',
		'| Element | Status | Details |',
		'| --- | --- | --- |',
		...geometry.map( g => geometryRow( g, targets ) ),
		...unmeasured.map( u => u.row ),
		'',
		'### Step 3 -- network panel',
		'',
		`- Only with flag off (${ network.onlyBefore.length }):`,
		requestList( network.onlyBefore, options ),
		`- Only with flag on (${ network.onlyAfter.length }):`,
		requestList( network.onlyAfter, options ),
		`- Status code changed (${ network.statusChanged.length }):`,
		statusChangeList( network.statusChanged ),
		`- Request count changed (${ network.countChanged.length }):`,
		countChangeList( network.countChanged ),
		'',
		'### Summary',
		'',
		`${ geometryFindings } geometry finding(s), ${ networkFindings } network finding(s).`,
		"The only difference JETPACK-2573 accepts is a uniform 8px inset from boot's stage gutter on the page root. Anything else above needs a look before merging.",
	].filter( line => line !== null );

	return lines.join( '\n' );
}
