/**
 * Pure comparison logic for JETPACK-2685 steps 2 and 3. No browser here: everything
 * takes and returns plain data, so it can run against fixtures without Playwright.
 */

import { DEFAULT_IGNORED_QUERY_PARAMS, DEFAULT_TOLERANCE_PX } from './selectors.js';

/**
 * Compare one geometry target's `rect` (numeric px fields) between before and after.
 *
 * @param {object} before      - `{ [field]: number }`, or undefined if the target was missing.
 * @param {object} after       - Same shape, from the other capture.
 * @param {number} tolerancePx - Deltas at or below this are ignored.
 * @return {string[]} One human-readable line per field that moved beyond tolerance.
 */
function diffRect( before, after, tolerancePx ) {
	if ( ! before || ! after ) {
		return [];
	}
	const lines = [];
	for ( const field of Object.keys( { ...before, ...after } ) ) {
		const b = before[ field ];
		const a = after[ field ];
		if ( typeof b !== 'number' || typeof a !== 'number' ) {
			continue;
		}
		const delta = Math.abs( a - b );
		if ( delta > tolerancePx ) {
			lines.push( `${ field }: ${ b }px -> ${ a }px (Δ${ delta.toFixed( 1 ) }px)` );
		}
	}
	return lines;
}

/**
 * Compare one geometry target's `style` map (computed style / box-model values) between
 * before and after. Numeric values (e.g. paddingTop in px) use `tolerancePx`; anything
 * else (e.g. fontFamily, boxSizing) is compared as an exact string.
 *
 * @param {object} before      - `{ [prop]: number|string }`, or undefined.
 * @param {object} after       - Same shape, from the other capture.
 * @param {number} tolerancePx - Numeric-field tolerance.
 * @return {string[]} One line per prop that differs.
 */
function diffStyle( before, after, tolerancePx ) {
	if ( ! before || ! after ) {
		return [];
	}
	const lines = [];
	for ( const prop of Object.keys( { ...before, ...after } ) ) {
		const b = before[ prop ];
		const a = after[ prop ];
		if ( typeof b === 'number' && typeof a === 'number' ) {
			const delta = Math.abs( a - b );
			if ( delta > tolerancePx ) {
				lines.push( `${ prop }: ${ b }px -> ${ a }px (Δ${ delta.toFixed( 1 ) }px)` );
			}
			continue;
		}
		if ( b !== a ) {
			lines.push( `${ prop }: ${ JSON.stringify( b ) } -> ${ JSON.stringify( a ) }` );
		}
	}
	return lines;
}

/**
 * Diff step 2's geometry snapshots: one entry per configured target (root, header,
 * footer, #wpbody-content, control).
 *
 * A target hidden on either side (`display: none` / `visibility: hidden`) skips the rect
 * and style diff entirely -- `getBoundingClientRect()` on a hidden element is all zeros,
 * which would otherwise read as a bogus geometry shift. A visibility change is reported as
 * its own `'hidden-changed'` status instead; the caller decides whether that particular
 * target is allowed to do that (see report.js: `allowHidden`, for #wpfooter).
 *
 * @param {object} before                - `{ [targetKey]: { label, hidden?, rect?, style? } }`.
 * @param {object} after                 - Same shape, from the flag-on capture.
 * @param {object} [options]
 * @param {number} [options.tolerancePx] - See `DEFAULT_TOLERANCE_PX`.
 * @return {Array<object>} `{ key, label, status: 'ok'|'changed'|'missing'|'hidden-changed', details }`, one per target present on either side.
 */
export function diffGeometry( before = {}, after = {}, options = {} ) {
	const tolerancePx = options.tolerancePx ?? DEFAULT_TOLERANCE_PX;
	const keys = new Set( [ ...Object.keys( before ), ...Object.keys( after ) ] );
	const results = [];

	for ( const key of keys ) {
		const b = before[ key ];
		const a = after[ key ];
		const label = ( b || a )?.label ?? key;

		if ( ! b || ! a ) {
			// Present on one side only. Expected for boot-only markup when the flag is off;
			// the caller decides severity per target (see report.js: `required` targets fail).
			results.push( {
				key,
				label,
				status: 'missing',
				before: b ?? null,
				after: a ?? null,
				details: [],
			} );
			continue;
		}

		if ( b.hidden || a.hidden ) {
			if ( Boolean( b.hidden ) === Boolean( a.hidden ) ) {
				results.push( { key, label, status: 'ok', details: [] } );
			} else {
				const visibility = b.hidden ? 'hidden -> visible' : 'visible -> hidden';
				results.push( {
					key,
					label,
					status: 'hidden-changed',
					details: [ `visibility: ${ visibility }` ],
				} );
			}
			continue;
		}

		const details = [
			...diffRect( b.rect, a.rect, tolerancePx ),
			...diffStyle( b.style, a.style, tolerancePx ),
		];
		results.push( { key, label, status: details.length ? 'changed' : 'ok', details } );
	}

	return results;
}

/**
 * @param {URL}      parsedUrl
 * @param {string[]} ignoreQueryParams
 * @return {URL} The same `URL`, mutated in place with those params removed.
 */
function stripQueryParams( parsedUrl, ignoreQueryParams ) {
	for ( const param of ignoreQueryParams ) {
		parsedUrl.searchParams.delete( param );
	}
	return parsedUrl;
}

/**
 * Build the network-diff key for one captured request: method + path, with volatile
 * query params (nonces, cache busters) stripped so two genuinely-identical requests
 * from separate page loads still match.
 *
 * @param {{url: string, method: string}} request
 * @param {object}                        [options]
 * @param {string[]}                      [options.ignoreQueryParams] - See `DEFAULT_IGNORED_QUERY_PARAMS`.
 * @return {string} The normalized key.
 */
export function normalizeRequestKey( request, options = {} ) {
	const ignoreQueryParams = options.ignoreQueryParams ?? DEFAULT_IGNORED_QUERY_PARAMS;
	try {
		const parsed = stripQueryParams( new URL( request.url ), ignoreQueryParams );
		parsed.searchParams.sort();
		return `${ request.method } ${ parsed.pathname }${ parsed.search }`;
	} catch {
		// Not an absolute URL (e.g. already a bare path in a fixture). Compare as-is.
		return `${ request.method } ${ request.url }`;
	}
}

/**
 * Strip the same ignored query params from a URL for display. Report output is pasted into
 * a public PR (this is a public repo), and a `_wpnonce` value is still a nonce even after
 * it stopped mattering for matching -- see `normalizeRequestKey`.
 *
 * @param {string}   url
 * @param {object}   [options]
 * @param {string[]} [options.ignoreQueryParams] - See `DEFAULT_IGNORED_QUERY_PARAMS`.
 * @return {string} The URL with those params removed, or the input unchanged if it does not parse.
 */
export function redactUrl( url, options = {} ) {
	const ignoreQueryParams = options.ignoreQueryParams ?? DEFAULT_IGNORED_QUERY_PARAMS;
	try {
		return stripQueryParams( new URL( url ), ignoreQueryParams ).toString();
	} catch {
		return url;
	}
}

/**
 * Diff step 3's network captures: which requests only fired with the flag off, which
 * only fired with it on, and which fired both times but with a different status code.
 *
 * @param {Array<object>} before    - `[{ url, method, status, resourceType }]`.
 * @param {Array<object>} after     - Same shape, from the flag-on capture.
 * @param {object}        [options]
 * @return {{onlyBefore: object[], onlyAfter: object[], statusChanged: object[]}}
 */
export function diffNetwork( before = [], after = [], options = {} ) {
	const beforeMap = new Map( before.map( r => [ normalizeRequestKey( r, options ), r ] ) );
	const afterMap = new Map( after.map( r => [ normalizeRequestKey( r, options ), r ] ) );

	const onlyBefore = [];
	const statusChanged = [];
	for ( const [ key, b ] of beforeMap ) {
		const a = afterMap.get( key );
		if ( ! a ) {
			onlyBefore.push( b );
		} else if ( a.status !== b.status ) {
			statusChanged.push( { key, before: b, after: a } );
		}
	}

	const onlyAfter = [ ...afterMap.entries() ]
		.filter( ( [ key ] ) => ! beforeMap.has( key ) )
		.map( ( [ , r ] ) => r );

	return { onlyBefore, onlyAfter, statusChanged };
}

/**
 * Run both step-2 and step-3 diffs over a pair of captured snapshots.
 *
 * @param {object} before    - `{ geometry, network }`, as written by `capture.js` (flag off).
 * @param {object} after     - Same shape (flag on).
 * @param {object} [options]
 * @return {{geometry: object[], network: object}}
 */
export function diffSnapshots( before, after, options = {} ) {
	return {
		geometry: diffGeometry( before.geometry, after.geometry, options ),
		network: diffNetwork( before.network, after.network, options ),
	};
}
