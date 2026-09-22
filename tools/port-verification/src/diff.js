/**
 * Pure comparison logic for JETPACK-2685 steps 2 and 3. No browser here: everything
 * takes and returns plain data, so it can run against fixtures without Playwright.
 */

import {
	DEFAULT_IGNORED_HOSTS,
	DEFAULT_IGNORED_QUERY_PARAMS,
	DEFAULT_TOLERANCE_PX,
} from './selectors.js';

/**
 * Rects are stored unrounded so a sub-pixel tolerance means something. Whole numbers still
 * print as whole numbers.
 *
 * @param {number} value
 * @return {string}
 */
function px( value ) {
	return `${ Number.isInteger( value ) ? value : value.toFixed( 1 ) }px`;
}

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
			lines.push( `${ field }: ${ px( b ) } -> ${ px( a ) } (Δ${ delta.toFixed( 1 ) }px)` );
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
				lines.push( `${ prop }: ${ px( b ) } -> ${ px( a ) } (Δ${ delta.toFixed( 1 ) }px)` );
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
 * Diff step 2's geometry snapshots, one entry per target captured on either side.
 *
 * A target hidden on either side skips the rect and style diff and reports
 * `'hidden-changed'` instead; report.js decides whether that target is allowed to do that.
 *
 * @param {object} before                - `{ [targetKey]: { label, hidden?, rect?, style? } }`.
 * @param {object} after                 - Same shape, from the flag-on capture.
 * @param {object} [options]
 * @param {number} [options.tolerancePx] - See `DEFAULT_TOLERANCE_PX`.
 * @return {Array<object>} `{ key, label, status: 'ok'|'changed'|'missing'|'hidden-changed', details }`, one per target present on either side.
 */
/**
 * `querySelectorAll` found more than one element, so each side compared its own first match
 * and the row may be measuring two different elements.
 *
 * @param {object} before
 * @param {object} after
 * @return {string[]}
 */
function ambiguousSelector( before, after ) {
	const b = before.matchCount ?? 1;
	const a = after.matchCount ?? 1;
	if ( b > 1 || a > 1 ) {
		return [ `selector matched ${ b } element(s) -> ${ a }; only the first is compared` ];
	}
	return [];
}

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
			...ambiguousSelector( b, a ),
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
		// Host included: the same path on two hosts is not the same request, and a key that
		// drops it cannot say which host a status change belongs to.
		return `${ request.method } ${ parsed.host }${ parsed.pathname }${ parsed.search }`;
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
 * Drop traffic from hosts whose URLs are per-event by design, so they cannot flood both
 * "only with flag off" and "only with flag on" with the same events under new keys.
 *
 * @param {object[]} requests
 * @param {object}   [options]
 * @param {string[]} [options.ignoreHosts] - See `DEFAULT_IGNORED_HOSTS`.
 * @return {object[]}
 */
function dropIgnoredHosts( requests, options = {} ) {
	const ignoreHosts = options.ignoreHosts ?? DEFAULT_IGNORED_HOSTS;
	if ( ignoreHosts.length === 0 ) {
		return requests;
	}
	return requests.filter( request => {
		try {
			return ! ignoreHosts.includes( new URL( request.url ).host );
		} catch {
			return true;
		}
	} );
}

/**
 * Group requests by normalized key, keeping every occurrence rather than the last one:
 * a path fetched twice in one load can carry two different statuses, and collapsing them
 * hides exactly the 404 step 3 exists to find.
 *
 * @param {object[]} requests
 * @param {object}   [options] - Passed to `normalizeRequestKey()`.
 * @return {Map<string, object[]>}
 */
function groupByKey( requests, options ) {
	const groups = new Map();
	for ( const request of requests ) {
		const key = normalizeRequestKey( request, options );
		const group = groups.get( key );
		if ( group ) {
			group.push( request );
		} else {
			groups.set( key, [ request ] );
		}
	}
	return groups;
}

/**
 * Distinct, not per-occurrence: a differing occurrence count would otherwise always read as
 * a status change and hide the count difference behind it.
 *
 * @param {object[]} group - One key's requests.
 * @return {number[]} The status codes it saw, ascending.
 */
function statusesOf( group ) {
	return [ ...new Set( group.map( r => r.status ) ) ].sort( ( x, y ) => x - y );
}

/**
 * Diff step 3's network captures: which requests only fired with the flag off, which only
 * fired with it on, which fired both times with a different set of status codes, and which
 * fired a different number of times.
 *
 * @param {Array<object>} before    - `[{ url, method, status, resourceType }]`.
 * @param {Array<object>} after     - Same shape, from the flag-on capture.
 * @param {object}        [options]
 * @return {{onlyBefore: object[], onlyAfter: object[], statusChanged: object[], countChanged: object[], beforeTotal: number, afterTotal: number}}
 */
export function diffNetwork( before = [], after = [], options = {} ) {
	const keptBefore = dropIgnoredHosts( before, options );
	const keptAfter = dropIgnoredHosts( after, options );
	const beforeGroups = groupByKey( keptBefore, options );
	const afterGroups = groupByKey( keptAfter, options );

	const onlyBefore = [];
	const onlyAfter = [];
	const statusChanged = [];
	const countChanged = [];

	for ( const [ key, b ] of beforeGroups ) {
		const a = afterGroups.get( key );
		if ( ! a ) {
			onlyBefore.push( { ...b[ 0 ], count: b.length } );
			continue;
		}
		const beforeStatuses = statusesOf( b );
		const afterStatuses = statusesOf( a );
		if ( beforeStatuses.join( ',' ) !== afterStatuses.join( ',' ) ) {
			statusChanged.push( { key, beforeStatuses, afterStatuses } );
		} else if ( b.length !== a.length ) {
			countChanged.push( { key, beforeCount: b.length, afterCount: a.length } );
		}
	}

	for ( const [ key, a ] of afterGroups ) {
		if ( ! beforeGroups.has( key ) ) {
			onlyAfter.push( { ...a[ 0 ], count: a.length } );
		}
	}

	return {
		onlyBefore,
		onlyAfter,
		statusChanged,
		countChanged,
		beforeTotal: keptBefore.length,
		afterTotal: keptAfter.length,
	};
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
