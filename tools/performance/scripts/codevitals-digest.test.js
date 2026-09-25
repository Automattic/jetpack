/**
 * Tests for the weekly CodeVitals digest.
 *
 * The digest must be a trustworthy alarm, so these tests pin the failure-mode
 * contract, not just the happy path: a clean week exits 0 with a green
 * heartbeat, and every degraded signal (discovery failure, unreadable series,
 * malformed points, stale metrics, misconfiguration) exits 1 and says WHAT
 * degraded. A silent skip or a false-clean digest is the exact bug class the
 * script exists to catch.
 *
 * The full flow runs in-process against a mock CodeVitals read API on an
 * ephemeral port, with an injected mock Slack WebClient and captured console
 * output, so exit codes and both streams are asserted directly with no
 * child-process races. Child processes appear only where the direct-invocation
 * contract (argv wiring + process exit code) is itself under test. Run with
 * `pnpm test:unit`. No Docker, no token, no external network.
 */

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { test } from 'node:test';
import { main } from './codevitals-digest.js';

const SCRIPT = path.join( import.meta.dirname, 'codevitals-digest.js' );

// ---- mock CodeVitals read API ----

const D = 864e5;
const NOW = Date.now();
// Injective for the short labels fixtures use: hex chars pass through (a rendered hash prefix
// like "feedbeef" stays assertable), other chars become their two-digit char code, and an "f"
// terminator lands before the zero padding so "c1" and "c10" stay distinct. A colliding label
// would trip the digest's re-run dedup and silently shrink a fixture; the same label still gives
// the same hash, so intentional duplicates collide.
const hx = s => {
	const hex = [ ...String( s ).toLowerCase() ]
		.map( c => ( /[0-9a-f]/.test( c ) ? c : c.charCodeAt( 0 ).toString( 16 ).padStart( 2, '0' ) ) )
		.join( '' );
	return ( hex + 'f' ).padEnd( 40, '0' ).slice( 0, 40 );
};
const iso = t => new Date( t ).toISOString();
// The /metrics createdAt format is a naive "YYYY-MM-DD HH:MM:SS" (UTC).
const naive = t => iso( t ).slice( 0, 19 ).replace( 'T', ' ' );
const pt = ( daysAgo, value, hash, reg, pct ) => ( {
	id: 1,
	repoId: 25,
	metricId: 0,
	branch: 'trunk',
	hash: hx( hash ),
	measuredAt: iso( NOW - daysAgo * D ),
	value,
	rawValue: value,
	isRegression: !! reg,
	...( pct != null ? { regressionPercent: pct } : {} ),
} );
// Steady series: n points ending daysEnd ago, one per 0.1d. pfx keeps hashes distinct across
// steady() runs in one series; the digest drops a repeated hash as a re-run duplicate.
const steady = ( n, daysEnd, v, pfx = 'c' ) =>
	Array.from( { length: n }, ( _, i ) => pt( daysEnd + ( n - 1 - i ) * 0.1, v, pfx + i, false ) );
// n points starting daysStart ago, stepping 0.1d newer, all at value v: steady() anchored at the
// other end.
const seq = ( n, daysStart, v, pfx = 'd' ) =>
	Array.from( { length: n }, ( _, i ) => pt( daysStart - i * 0.1, v, pfx + i, false ) );

const metricRow = ( id, name, key, createdDaysAgo = 40 ) => ( {
	id,
	repoId: 25,
	key,
	name,
	unit: 'ms',
	priority: 100,
	defaultVisible: true,
	minRegressionDelta: 0,
	createdAt: naive( NOW - createdDaysAgo * D ),
} );

// 20 steady 100s, a 115 spike flagged 5d ago, then 8 later points that either hold (sustained) or
// return to baseline (transient).
const spikeSeries = recover => [
	...steady( 20, 5.1, 100 ),
	pt( 5, 115, 'feedbeef1', true, 15.0 ),
	...seq( 8, 4.9, recover ? 100 : 114 ),
];

/**
 * Per-scenario fixture thunks. Each returns { series, metrics?, no302? }.
 * buildScenario() adds the default sibling metric series[302] unless the
 * scenario sets its own 302 or opts out with no302 (a scenario that must
 * serve a 404 for every metric).
 */
const SCENARIOS = {
	clean: () => ( { series: { 301: steady( 30, 0.5, 100 ) } } ),
	confirmed: () => ( { series: { 301: spikeSeries( false ) } } ),
	// A verdict channel must stay visible even when it suppresses: the verbatim payload test
	// below also reuses this scenario.
	reverted: () => ( { series: { 301: spikeSeries( true ) } } ),
	// Only 2 points after the flag: too few for a verdict.
	pending: () => ( {
		series: {
			301: [
				...steady( 20, 0.4, 100 ),
				pt( 0.3, 115, 'feedbeef2', true, 15.0 ),
				pt( 0.2, 116, 'e1', false ),
				pt( 0.1, 114, 'e2', false ),
			],
		},
	} ),
	// Non-numeric values around the flag make the medians NaN. The gate must REPORT, never
	// suppress.
	failopen: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ).map( p => ( { ...p, value: 'garbage', rawValue: 'garbage' } ) ),
				pt( 5, 115, 'feedbeef3', true, 15.0 ),
				...Array.from( { length: 8 }, ( _, i ) => ( {
					...pt( 4.9 - i * 0.1, 100, 'g' + i, false ),
					rawValue: 'garbage', // value (the judged field) stays numeric — these points are valid
				} ) ),
			],
		},
	} ),
	// Exactly limit-many points, ALL inside the window: the clip assertion must fire.
	truncated: () => ( {
		series: {
			301: Array.from( { length: 1000 }, ( _, i ) => pt( 13 - i * 0.01, 100, 'f' + i, false ) ),
		},
	} ),
	// Limit-many points but the oldest is OUTSIDE the window: fine.
	'full-but-covered': () => ( {
		series: {
			301: Array.from( { length: 1000 }, ( _, i ) => pt( 40 - i * 0.038, 100, 'h' + i, false ) ),
		},
	} ),
	// 303 created 2d ago with zero points: staleness exempt.
	warming: () => ( {
		metrics: [ ...baseMetrics(), metricRow( 303, 'New: FCP', 'new-fcp', 2 ) ],
		series: { 301: steady( 30, 0.5, 100 ), 303: [] },
	} ),
	// 303 created 40d ago with zero points: stale + exit 1.
	'dead-old': () => ( {
		metrics: [ ...baseMetrics(), metricRow( 303, 'Old: FCP', 'old-fcp', 40 ) ],
		series: { 301: steady( 30, 0.5, 100 ), 303: [] },
	} ),
	strflag: () => {
		const s = steady( 30, 0.5, 100 );
		s[ 10 ] = { ...s[ 10 ], isRegression: 'false' };
		return { series: { 301: s } };
	},
	// One point, no flags at all: a legit single-point response, no malformed warning.
	singleton: () => {
		const p = pt( 0.5, 100, 'solo', false );
		delete p.isRegression;
		return { series: { 301: [ p ] } };
	},
	future: () => {
		const s = steady( 30, 0.5, 100 );
		s[ 10 ] = { ...s[ 10 ], measuredAt: iso( NOW + 3 * D ) };
		return { series: { 301: s } };
	},
	one404: () => ( { series: {} } ), // 301 -> 404
	allfail: () => ( { series: {}, no302: true } ), // both -> 404
	'stale-all': () => ( { series: { 301: steady( 30, 12, 100 ), 302: steady( 30, 15, 50 ) } } ),
	'stale-one': () => ( { series: { 301: steady( 30, 12, 100 ) } } ),
	// Null values AFTER a real flag must be malformed (red), never gate-suppressed via
	// Number(null)=0.
	nullvals: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ),
				pt( 5, 115, 'feedbeef5', true, 15.0 ),
				...Array.from( { length: 8 }, ( _, i ) => ( {
					...pt( 4.9 - i * 0.1, 100, 'n' + i, false ),
					value: null,
					rawValue: 100, // finite: a rawValue fallback would suppress via a 100 post-median
				} ) ),
			],
		},
	} ),
	// A string value adjacent to the flag must never reach the from→to render.
	strvals: () => ( {
		series: {
			301: [
				...steady( 20, 5.3, 100 ),
				{ ...pt( 5.1, 100, 'inj1', false ), value: '<!channel>', rawValue: '<!channel>' },
				pt( 5, 115, 'feedbeef6', true, 15.0 ),
				...seq( 8, 4.9, 114, 's' ),
			],
		},
	} ),
	// Sustained flag OLDER than the window but inside the 2x look-back (a backfill/recovery
	// shape).
	late: () => ( {
		series: {
			301: [
				...steady( 20, 20.1, 100 ),
				pt( 20, 115, 'feedbeef7', true, 15.0 ),
				...seq( 8, 19.9, 114, 'l' ),
				...steady( 10, 0.5, 114, 'tl' ),
			],
		},
	} ),
	// The worst week the digest can render: every warning block, every verdict block, and more
	// sustained regressions than MAX_LINES. Slack rejects a message over 50 blocks outright, so
	// this is the shape that would silently lose the digest exactly when it matters most.
	blockflood: () => {
		const metrics = [];
		const series = {};
		// 45 metrics each holding a sustained spike: 45 confirmed, past the MAX_LINES cut.
		for ( let i = 0; i < 45; i++ ) {
			const id = 400 + i;
			metrics.push( metricRow( id, `Flood ${ i }: LCP`, `flood-${ i }` ) );
			series[ id ] = spikeSeries( false );
		}
		metrics.push( metricRow( 'x9', 'Bad: id', 'bad-id' ) ); // non-numeric id -> dropped
		metrics.push( metricRow( 500, 'Gone: TTFB', 'gone-ttfb' ) ); // no series -> 404 -> read failure
		metrics.push( metricRow( 501, 'Dead: TTFB', 'dead-ttfb' ) );
		series[ 501 ] = steady( 30, 12, 100 ); // stale
		metrics.push( metricRow( 502, 'Junk: TTFB', 'junk-ttfb' ) );
		const junk = steady( 30, 0.5, 100, 'j' );
		junk[ 10 ] = { ...junk[ 10 ], measuredAt: iso( NOW + 3 * D ) }; // malformed point
		series[ 502 ] = junk;
		metrics.push( metricRow( 503, 'Edge: TTFB', 'edge-ttfb' ) );
		series[ 503 ] = [
			...steady( 20, 0.4, 100, 'p' ),
			pt( 0.3, 115, 'feedbf40', true, 15.0 ),
			pt( 0.2, 116, 'pe1', false ),
			pt( 0.1, 114, 'pe2', false ),
		]; // pending
		metrics.push( metricRow( 504, 'Blip: TTFB', 'blip-ttfb' ) );
		series[ 504 ] = spikeSeries( true ); // reverted -> suppressed
		metrics.push( metricRow( 505, 'Old: TTFB', 'old-ttfb' ) );
		series[ 505 ] = [
			...steady( 20, 20.1, 100, 'q' ),
			pt( 20, 115, 'feedbf41', true, 15.0 ),
			...seq( 8, 19.9, 114, 'ql' ),
			...steady( 10, 0.5, 114, 'qt' ),
		]; // late-confirmed
		return { metrics, series };
	},
	// A regression lands, is reverted, then RE-LANDS within the pre window. The second flag's
	// baseline is contaminated with the regressed level (pre ≈ post), so only the revert-anchor
	// check (post vs the pre-flag commit) sees the regression is still live.
	relanded: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100 ),
				...seq( 5, 5.9, 200, 'r' ),
				pt( 5.4, 100, 'rrev', false ),
				pt( 5.3, 200, 'feedbeefb', true, 100.0 ),
				...seq( 8, 5.2, 200, 'rp' ),
			],
		},
	} ),
	// A flag so small that a post-vs-flagged-value reference could never suppress it (post <
	// v*0.95 needs >5.26% headroom): a clean revert must still suppress, never render as
	// sustained over a metric that never moved.
	smallflag: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ),
				pt( 5, 103, 'feedbeefe', true, 3.0 ),
				...seq( 8, 4.9, 100, 'w' ),
			],
		},
	} ),
	// Dead metric (newest real point 10d old) plus ONE point dated in the future but inside the
	// skew allowance: it must not feed the staleness clock and flip the dead-man green.
	futurepoint: () => ( {
		series: { 301: [ ...steady( 30, 10, 100 ), pt( -0.9, 100, 'z1', false ) ] },
	} ),
	// A negative regressionPercent (server sign-convention drift) must render "-5.3%", never
	// "+-5.3%".
	negpct: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ),
				pt( 5, 115, 'feedbeeff', true, -5.3 ),
				...seq( 8, 4.9, 114, 'u' ),
			],
		},
	} ),
	// A single-point response may omit isRegression, but a PRESENT non-boolean one is contract
	// drift. It must not fabricate a pending flag via truthiness.
	'singleton-strflag': () => {
		const p = pt( 0.5, 100, 'solo2', false );
		p.isRegression = 'false';
		return { series: { 301: [ p ] } };
	},
	// A duplicate row (re-measured commit b2 at the regressed level) sits in the anchor slot
	// right before the flag. Without hash dedup it becomes entry.from and a live +100% re-land is
	// suppressed as a transient: a false clean.
	dupanchor: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100 ),
				...seq( 5, 5.9, 200, 'b' ),
				pt( 5.4, 100, 'beef99', false ),
				pt( 5.35, 200, 'b2', false ), // duplicate of landing commit b2
				pt( 5.3, 200, 'feedbf03', true, 100.0 ),
				...seq( 8, 5.2, 200, 'dd' ),
			],
		},
	} ),
	// Recent-stamped re-run rows of OLD commits (c0..c2, baseline value) land at the newest end.
	// Without hash dedup they dilute the post window AND satisfy the later-commit count,
	// suppressing a live +100% re-land; with dedup the flag has only 2 genuinely later commits
	// and must stay pending.
	dupdilute: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100 ),
				...seq( 5, 5.9, 200, 'b' ),
				pt( 5.4, 100, 'beef98', false ),
				pt( 5.3, 200, 'feedbf04', true, 100.0 ),
				pt( 5.2, 200, 'dd0', false ),
				pt( 5.1, 200, 'dd1', false ),
				pt( 0.3, 100, 'c0', false ), // re-runs of base commits, stamped with run time
				pt( 0.2, 100, 'c1', false ),
				pt( 0.1, 100, 'c2', false ),
			],
		},
	} ),
	// The flag is the series' FIRST valid point: the pre-window is empty (median 0), which must
	// fail open to a report. The render must never print the fabricated "med 0→…" baseline.
	flagfirst: () => ( {
		series: { 301: [ pt( 5, 115, 'feedbf06', true, 15.0 ), ...seq( 8, 4.9, 114, 'ff' ) ] },
	} ),
	// The server computes flags on the NORMALIZED value; here it regresses 100→120 and holds
	// while rawValue stays flat at 100. Judging rawValue would suppress a server-flagged
	// sustained regression as "reverted".
	normflag: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ),
				{ ...pt( 5, 120, 'feedbf07', true, 20.0 ), rawValue: 100 },
				...Array.from( { length: 8 }, ( _, i ) => ( {
					...pt( 4.9 - i * 0.1, 120, 'ee' + i, false ),
					rawValue: 100,
				} ) ),
			],
		},
	} ),
	// A newline in a UI-edited metric name must never forge a standalone digest line.
	nlname: () => ( {
		metrics: [
			{ ...metricRow( 301, 'x', 'alpha-ttfb' ), name: 'Alpha\nFAKE :white_check_mark: all clear' },
			metricRow( 302, 'Beta: LCP', 'beta-lcp' ),
		],
		series: { 301: spikeSeries( false ) },
	} ),
	// Mrkdwn metacharacters in a UI-edited metric name must land HTML-escaped in every mrkdwn
	// render site.
	escname: () => ( {
		metrics: [
			{ ...metricRow( 301, 'x', 'alpha-ttfb' ), name: 'Alpha &<TTFB>' },
			metricRow( 302, 'Beta: LCP', 'beta-lcp' ),
		],
		series: { 301: spikeSeries( false ) },
	} ),
	// The RE-POST row (same commit, same provenanced timestamp) is the one the server flagged:
	// the flag and its percent must transfer to the kept row before the gate. A dropped flag
	// would delete a live regression behind a green all-clear.
	dupflag: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100 ),
				pt( 5.5, 100, 'dupf1', false ), // first measurement, unflagged
				pt( 5.5, 250, 'dupf1', true, 150.0 ), // re-post of the same commit, flagged
				...seq( 6, 5.0, 250, 'dq' ),
				...steady( 10, 0.5, 250, 'dz' ),
			],
		},
	} ),
	// Every recent row is a re-run of an already-measured commit: nothing new was measured, so
	// the staleness dead-man must judge the KEPT rows and fire. Re-runs must never renew it.
	dupfresh: () => ( {
		series: {
			301: [
				...steady( 12, 20, 100 ),
				pt( 2, 100, 'c3', false ), // re-runs of base commits, stamped fresh
				pt( 1, 100, 'c5', false ),
			],
		},
	} ),
	// An out-of-order row must trip the ordering guard even when it duplicates an earlier commit.
	// Dedup must not absorb the violation into a silent drop.
	duporder: () => ( { series: { 301: [ ...steady( 12, 5, 100 ), pt( 10, 100, 'c2', false ) ] } } ),
	// A non-string hash passes RegExp coercion. It must take the malformed-point path (warning +
	// exit 1), never crash the whole digest on .toLowerCase().
	arrayhash: () => ( {
		series: {
			301: [ ...steady( 12, 5, 100 ), { ...pt( 0.5, 100, 'x1', false ), hash: [ hx( 'x1' ) ] } ],
		},
	} ),
	// 12 late-confirmed regressions: the joined block must cap its entries and say how many were
	// cut, so the header count and the body always agree.
	latecrowd: () => {
		const metrics = Array.from( { length: 12 }, ( _, i ) =>
			metricRow( 401 + i, `Metric ${ 401 + i }`, `m-${ 401 + i }` )
		);
		const series = {};
		for ( let i = 0; i < 12; i++ ) {
			series[ 401 + i ] = [
				...steady( 10, 17.5, 100, 'lc' + i ),
				pt( 17, 150, 'lcf' + i, true, 50.0 ),
				...Array.from( { length: 6 }, ( _, k ) =>
					pt( 16.5 - k * 0.1, 150, 'lp' + i + 'x' + k, false )
				),
				...steady( 5, 0.5, 150, 'lt' + i ),
			];
		}
		return { metrics, series, no302: true };
	},
	// A FLAGGED re-post of the fix-landing commit carries the regressed value. The dedup must
	// transfer only its flag: written into the kept row's historical slot, the value would poison
	// the next flag's revert anchor and flip a live +100% re-land to a green all-clear.
	dupvalpoison: () => ( {
		series: {
			301: [
				...steady( 5, 6.0, 200, 'pa' ),
				pt( 5.5, 100, 'pfix', false ), // the fix lands
				pt( 5.5, 250, 'pfix', true, 150.0 ), // flagged re-post of the fix commit
				pt( 5.4, 200, 'feedbf09', true, 100.0 ), // the re-land the digest must report
				...seq( 8, 5.3, 200, 'pb' ),
			],
		},
	} ),
	// A flagged run-time-stamped re-run of an ancient commit, held by four later commits: the
	// server flagged it at the data edge, so the FLAG must be judged THERE against the kept
	// series (its value stays out). Relocated onto the 45d-old original, it would be judged
	// against windows from 45 days ago ("transient", green, exit 0), or aged out unread on the
	// commit date.
	rerunflag: () => ( {
		series: {
			301: [
				pt( 45, 100, 'oldx', false ),
				...steady( 12, 5, 100, 'ha' ),
				pt( 0.5, 130, 'oldx', true, 30.0 ), // fresh no-provenance re-run, flagged
				...seq( 4, 0.4, 130, 'hb' ),
			],
		},
	} ),
	// A flagged recovery re-run batch of old commits, all beyond the look-back, then a real held
	// +8% regression. Retained, the batch rows put systematically-high foreign values into the
	// regression's pre-window median and revert anchor, flipping the live +8% to a suppressed
	// "transient" behind a green tick. The batch values must never enter the series; its aged
	// flags drain to stderr.
	rerunbatch: () => ( {
		series: {
			301: [
				...steady( 12, 39, 100, 'rb' ),
				pt( 33, 140, 'rb0', true, 40.0 ), // flagged re-runs of already-measured commits
				pt( 32, 140, 'rb1', true, 40.0 ),
				pt( 31, 140, 'rb2', true, 40.0 ),
				pt( 14, 108, 'feedbf11', true, 8.0 ), // the real regression, held below
				...steady( 10, 0.5, 108, 'rd' ),
			],
		},
	} ),
	// A FLAGGED fresh re-run of an old commit must not renew the dead-man either: its flag is
	// judged at its own time (pending, no later kept measurements), but freshness is only earned
	// by a new commit's first measurement.
	rerunstale: () => ( {
		series: { 301: [ ...steady( 12, 20, 100 ), pt( 0.5, 130, 'c3', true, 30.0 ) ] },
	} ),
	// Tied re-post pairs LISTED low-value-first: the server orders equal measured_at rows
	// arbitrarily, so the verdict must not depend on listing order. The row-id tie-sort restores
	// insertion order (each original 110 was posted before its 104 re-post, so it carries the
	// smaller id) and the held +10% regression is reported. A tie-break that let a duplicate's
	// low value into the kept series would drag the post median under the 5% suppression line and
	// flip the held regression to green.
	tieloworder: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100, 'tb' ),
				pt( 5, 110, 'feedbf10', true, 10.0 ),
				...Array.from( { length: 5 }, ( _, i ) => [
					...( i < 3 ? [ { ...pt( 4.9 - i * 0.1, 104, 'tl' + i, false ), id: 20 + i } ] : [] ),
					{ ...pt( 4.9 - i * 0.1, 110, 'tl' + i, false ), id: 10 + i },
				] ).flat(),
				...steady( 6, 0.5, 110, 'tc' ),
			],
		},
	} ),
	// The onset flag ages out, and the regression's only surviving evidence is a flagged
	// provenance-less re-run landing MID-PLATEAU: every kept row around its judging position
	// already sits at the regressed level (each plateau commit is ~0% worse than its neighbour,
	// so none is flagged). A gate anchored only on position-local rows reads pre = post = anchor
	// = 140 and suppresses the live +40% as a transient behind the green tick. Suppression must
	// also clear the commit's OWN pre-regression baseline.
	rerunplateau: () => ( {
		series: {
			301: [
				...steady( 10, 36, 100, 'pa' ),
				pt( 35, 140, 'baddad00', true, 40.0 ), // onset — its own flag ages out unread
				...steady( 10, 6, 140, 'pb' ), // the plateau: real, individually-unflagged commits
				pt( 5, 140, 'baddad00', true, 40.0 ), // flagged run-time-stamped re-run of the onset commit
				...steady( 6, 0.5, 140, 'pc' ),
			],
		},
	} ),
	// The counterpart guard: a flagged re-run of a commit whose spike genuinely reverted clears
	// the position-local anchor AND the commit's own baseline. It must stay a suppressed
	// transient, or every routine re-run becomes an alert.
	reruntransient: () => ( {
		series: {
			301: [
				...steady( 10, 13, 100, 'qa' ),
				pt( 12, 130, 'beefcaf3', false ), // the spike commit's own row (unflagged here)
				...steady( 10, 4, 100, 'qb' ), // fully recovered
				pt( 3, 128, 'beefcaf3', true, 28.0 ), // flagged re-run, metric back at baseline around it
				...steady( 6, 0.5, 100, 'qc' ),
			],
		},
	} ),
	// The server flags at serve time, each row against the row immediately before it in the
	// response: here a catch-up re-run that reproduced the old 100 baseline and is then dropped
	// by the dedup (its value never enters the series). Every kept-series anchor around the next
	// re-run's flag (positional, own-baseline) reads the 140 plateau, so a gate blind to the
	// server's own comparison base would file the only fresh evidence of the live +40% as a
	// transient behind the green tick. Every flag below is derivable by the server's serve-time
	// rule.
	dedupbase: () => ( {
		series: {
			301: [
				...steady( 10, 36, 100, 'pa' ),
				pt( 35, 140, 'baddad00', true, 40.0 ), // onset — its own flag ages out unread
				...steady( 10, 6, 140, 'pb' ), // the plateau: real, individually-unflagged commits
				pt( 5.9, 140, 'cafe0140', false ), // newest plateau commit, first measurement
				pt( 5, 100, 'pa9', false ), // catch-up re-run of baseline commit pa9 — reproduces 100 (a drop vs the plateau, so unflagged); the dedup discards it
				pt( 4.9, 140, 'cafe0140', true, 40.0 ), // re-run the server flags +40% against the dropped 100 row above — its true comparison base
				...steady( 6, 0.5, 140, 'pc' ),
			],
		},
	} ),
	// dedupbase plus a noisy same-time re-post of the flagged commit: the server flags the re-post
	// +42.86% against the kept row's own 140 (a base the gate would clear). Worst-percent-wins
	// must not carry that base over the kept flag's 100: suppression has to clear the base of
	// EVERY flag folded into the event.
	dedupbasetie: () => ( {
		series: {
			301: [
				...steady( 10, 36, 100, 'pa' ),
				pt( 35, 140, 'baddad00', true, 40.0 ),
				...steady( 10, 6, 140, 'pb' ),
				pt( 5, 100, 'pa9', false ), // dropped catch-up re-run of the baseline commit
				pt( 4.9, 140, 'cafe0140', true, 40.0 ), // first measurement, flagged against the dropped 100
				pt( 4.9, 200, 'cafe0140', true, 42.86 ), // same-time re-post, flagged against the 140 above
				...steady( 6, 0.5, 140, 'pc' ),
			],
		},
	} ),
	// dedupbasetie with the tie-sort REVERSING the two flagged rows: the re-post (lower id, so
	// the row the dedup keeps) carries the higher percent, so the comparator skips the listed-
	// first flag whose base is the dropped 100. The base fold must not depend on the comparator.
	dedupbaseskip: () => ( {
		series: {
			301: [
				...steady( 10, 36, 100, 'pa' ),
				pt( 35, 140, 'baddad00', true, 40.0 ),
				...steady( 10, 6, 140, 'pb' ),
				pt( 5, 100, 'pa9', false ),
				{ ...pt( 4.9, 140, 'cafe0140', true, 40.0 ), id: 2 }, // listed first, flagged against the dropped 100
				{ ...pt( 4.9, 200, 'cafe0140', true, 42.86 ), id: 1 }, // listed second, flagged against the 140 above; kept after the tie-sort
				...steady( 6, 0.5, 140, 'pc' ),
			],
		},
	} ),
	// The tie-sort must never move a flagged row's served-before tie-mates into its post window:
	// the server flags the +100% against the last-served 100 in a four-commit same-second run (a
	// backfill reusing one provenanced timestamp), and the flagged row's low id sorts it FIRST in
	// the tie. Judged at the sorted slot, the three base-level tie-mates would read as "after"
	// evidence, dilute the post median, and file the held regression as a transient behind the
	// green tick. Every flag is derivable by the server's serve-time rule.
	tierelocate: () => ( {
		series: {
			301: [
				...steady( 6, 11, 100, 'ra' ),
				{ ...pt( 5, 100, 'rt1', false ), id: 20 },
				{ ...pt( 5, 100, 'rt2', false ), id: 21 },
				{ ...pt( 5, 100, 'rt3', false ), id: 22 },
				{ ...pt( 5, 200, 'cafe0200', true, 100.0 ), id: 5 }, // served last, flagged against the 100 above; the tie-sort moves it first
				...steady( 4, 4, 200, 'rc' ),
			],
		},
	} ),
	// The dedup variant of the same defect: a flagged same-time re-post folds onto its original
	// across three interposed base-level commits (the server flagged it against the last of
	// them). The transfer must not move the flag's judging position backward onto the kept row's
	// sorted slot, or the tie-mates read as "after" evidence and the held +100% files as a
	// transient.
	tietransfer: () => ( {
		series: {
			301: [
				...steady( 6, 11, 100, 'ta' ),
				{ ...pt( 5, 100, 'tt1', false ), id: 20 },
				{ ...pt( 5, 100, 'tt2', false ), id: 21 },
				{ ...pt( 5, 100, 'tt3', false ), id: 22 },
				{ ...pt( 5, 200, 'cafe0200', true, 100.0 ), id: 15 }, // flagged re-post, served fourth
				{ ...pt( 5, 200, 'cafe0200', false ), id: 10 }, // original, served last; kept by the tie-sort
				...steady( 4, 4, 200, 'tc' ),
			],
		},
	} ),
	// Control: a genuinely transient spike inside a re-ordered tie still suppresses — the
	// serve-position windows must not turn routine recoveries into alerts.
	tietransient: () => ( {
		series: {
			301: [
				...steady( 6, 11, 100, 'va' ),
				{ ...pt( 5, 130, 'cafe0130', true, 30.0 ), id: 20 }, // spike, served first in the tie
				{ ...pt( 5, 100, 'vt1', false ), id: 5 }, // recovery commits with lower ids: the sort moves them before the spike
				{ ...pt( 5, 100, 'vt2', false ), id: 6 },
				...steady( 6, 4, 100, 'vc' ),
			],
		},
	} ),
	// The flagged commit's OWN kept row must count as evidence for neither side of its flag's
	// windows: it is excluded by hash, not by serve index. A folded flag's serve index belongs
	// to the DROPPED re-post, so an index-based exclusion excludes nothing and the kept
	// original — served after the flag here, at the API's whim for two equal-time rows — lands
	// in the post window, dilutes the median below the 5% threshold, and files the held drift
	// as a transient. The opposite listing order reports: same stored rows, coin-flip verdict.
	tiecoinflip: () => ( {
		series: {
			301: [
				...steady( 6, 11, 100, 'fa' ),
				{ ...pt( 5, 130, 'cafe0130', true, 30.0 ), id: 100 }, // flagged re-post, served first in the tie
				{ ...pt( 5, 100, 'cafe0130', false ), id: 50 }, // original, served second; kept by the tie-sort
				pt( 4, 101, 'fc1', false ), // held drift just above the gate's 5% threshold
				pt( 3, 106, 'fc2', false ),
				pt( 2, 107, 'fc3', false ),
			],
		},
	} ),
	// One folded flag with conclusive held evidence must never be vetoed by a sibling folded
	// flag that sits too close to the data edge: the edge position may defer the event only
	// when NO position reports. Here the first flag has five later commits holding the +100%
	// and the second (a same-second re-post of the same commit) has two — a some()-style edge
	// veto would demote the confirmed alert to pending behind the green tick.
	foldveto: () => ( {
		series: {
			301: [
				...steady( 5, 11, 100, 'ga' ),
				{ ...pt( 5, 200, 'deed0200', true, 100.0 ), id: 10 }, // first flag: conclusive held window
				{ ...pt( 5, 200, 'gb1', false ), id: 11 },
				{ ...pt( 5, 200, 'gb2', false ), id: 12 },
				{ ...pt( 5, 100, 'gb3', false ), id: 13 }, // one-commit dip: the second flag's base
				{ ...pt( 5, 200, 'deed0200', true, 100.0 ), id: 14 }, // same-commit re-post, flagged against the dip; only two rows follow
				{ ...pt( 5, 200, 'gb4', false ), id: 15 },
				{ ...pt( 5, 200, 'gb5', false ), id: 16 },
			],
		},
	} ),
	// An off-time re-run flag is judged at its own SERVE position, not inserted after every
	// equal-time kept row: the server saw the three held 200s AFTER the flag, and a
	// timestamp-slot insertion would file them all as "before" evidence, judge the flag on the
	// wall-clock-later recovered rows alone, and suppress a regression the serve-order median
	// holds. Every flag is derivable by the server's serve-time rule.
	offtieserve: () => ( {
		series: {
			301: [
				pt( 12, 100, 'wa1', false ),
				pt( 11, 100, '0ddeed00', false ), // original measurement of the re-run commit
				pt( 10, 100, 'wa2', false ),
				pt( 9, 100, 'wa3', false ),
				pt( 8, 100, 'wa4', false ),
				{ ...pt( 5, 100, 'wb1', false ), id: 50 }, // served first in the tie: the re-run's base
				{ ...pt( 5, 200, '0ddeed00', true, 100.0 ), id: 40 }, // off-time re-run, dropped by the dedup
				{ ...pt( 5, 200, 'wh1', false ), id: 30 }, // held tie-mates the server served AFTER the flag
				{ ...pt( 5, 200, 'wh2', false ), id: 20 },
				{ ...pt( 5, 200, 'wh3', false ), id: 10 },
				pt( 4, 100, 'wr1', false ), // wall-clock-later recovery: the whole post view of a time-slot window
				pt( 3, 100, 'wr2', false ),
				pt( 2, 100, 'wr3', false ),
			],
		},
	} ),
	// Two off-time re-run flags on ONE commit must merge into one event judged at both serve
	// positions: judged separately, whichever sibling the tie-sort scans first claims the
	// commit, and here the low-id sibling sits at the data edge (two later rows) — its pending
	// verdict would mask the other sibling's conclusive held +100% behind the green tick,
	// decided purely by the tie's listing order. Every flag is derivable by the server's
	// serve-time rule.
	offsiblingmask: () => ( {
		series: {
			301: [
				pt( 12, 100, 'xa1', false ),
				pt( 11, 100, '0ffdeed0', false ), // original measurement of the re-run commit
				pt( 10, 100, 'xa2', false ),
				pt( 9, 100, 'xa3', false ),
				pt( 8, 100, 'xa4', false ),
				{ ...pt( 5, 100, 'xb1', false ), id: 60 }, // served first in the tie: sibling A's base
				{ ...pt( 5, 200, '0ffdeed0', true, 100.0 ), id: 70 }, // sibling A: held evidence follows
				{ ...pt( 5, 200, 'xh1', false ), id: 80 },
				{ ...pt( 5, 200, 'xh2', false ), id: 90 },
				{ ...pt( 5, 200, 'xh3', false ), id: 95 },
				{ ...pt( 5, 100, 'xb2', false ), id: 96 }, // one-commit dip: sibling B's base
				{ ...pt( 5, 200, '0ffdeed0', true, 100.0 ), id: 10 }, // sibling B: low id, scanned first, only two rows follow
				pt( 4, 100, 'xr1', false ),
				pt( 3, 100, 'xr2', false ),
			],
		},
	} ),
	// A commit's AGED off-time re-run flag (older than the 2×WINDOW_DAYS look-back) must stay
	// out of the sibling merge: merged in, its weeks-old held window would join the fresh
	// event's verdict — or, the merged event's time being its oldest sibling's, age out the
	// WHOLE event, fresh flag included, behind the green tick — and it would vanish from the
	// stderr aged-flags count, the only signal that the digest was down longer than the
	// look-back. The aged flag counts per flag; the fresh sibling is judged alone and
	// suppresses on the recovered series. Every flag is derivable by the serve-time rule.
	offagedsibling: () => ( {
		series: {
			301: [
				...steady( 5, 45, 100, 'ka' ),
				pt( 44, 100, 'a9edee00', false ), // original measurement of the re-run commit
				...steady( 3, 42, 100, 'kb' ),
				pt( 40.5, 200, 'a9edee00', true, 100.0 ), // AGED re-run flag, past the 30d look-back
				...steady( 4, 39, 200, 'kh' ), // the aged position's held post window
				...steady( 10, 26, 100, 'kr' ), // long since recovered
				pt( 11, 200, 'a9edee00', true, 100.0 ), // FRESH re-run flag, in-window
				...steady( 5, 2, 100, 'ks' ), // fresh position's post window: recovered
			],
		},
	} ),
	// A commit's two fresh off-time re-run flags: an OLD one (20d) whose position holds at 200,
	// and a NEW one (1.1d, the larger percent) whose position recovered. The event reports on
	// the old position's evidence, so the alert must render THAT flag — +100%, late-confirmed —
	// not the newest sibling's time and worst percent (+150%, current), which would show a
	// weeks-old hold as a fresh, larger regression. Every flag is derivable by the serve-time rule.
	offmixedage: () => ( {
		series: {
			301: [
				...steady( 5, 30, 100, 'ma' ),
				pt( 28, 100, 'a9edee01', false ), // original measurement of the re-run commit
				...steady( 3, 26, 100, 'mb' ),
				pt( 20, 200, 'a9edee01', true, 100.0 ), // OLD re-run flag: held evidence follows
				...steady( 5, 18, 200, 'mh' ),
				...steady( 5, 12, 200, 'mk' ), // plateau
				pt( 1.2, 100, 'mdip', false ), // one-commit dip: the new flag's base
				pt( 1.1, 250, 'a9edee01', true, 150.0 ), // NEW re-run flag: recovery follows
				...steady( 4, 0.3, 100, 'mr' ),
			],
		},
	} ),
	// The mirror of offmixedage: the OLD sibling's position recovered and the NEW sibling's
	// holds, so the deciding window is the fresh position and the alert must render the NEW
	// flag — +150%, current-window — never the first-listed sibling's recovered +100% filed as
	// a weeks-old late confirmation. Every flag is derivable by the serve-time rule.
	offmirrorage: () => ( {
		series: {
			301: [
				...steady( 5, 30, 100, 'na' ),
				pt( 28, 100, 'a9edee02', false ), // original measurement of the re-run commit
				...steady( 3, 26, 100, 'nb' ),
				pt( 20, 200, 'a9edee02', true, 100.0 ), // OLD re-run flag: recovery follows
				...steady( 5, 18, 100, 'nh' ),
				...steady( 5, 12, 100, 'nk' ), // long recovered
				pt( 1.2, 100, 'ndip', false ), // the new flag's serve-time base
				pt( 1.1, 250, 'a9edee02', true, 150.0 ), // NEW re-run flag: held evidence follows
				...steady( 4, 0.3, 250, 'nr' ),
			],
		},
	} ),
	// A catch-up batch re-runs one commit twice back to back, so the two off-time siblings see
	// byte-identical windows (only their own rows sit between them) and tie on post. The first
	// re-run measures the whole step (+300% against the kept 100) and the second, newer one only
	// the increment (+5% against the first). The tie must break toward the worst percent, not
	// toward the newest sibling, which would caption a series holding at 420 with +5.0%. These
	// two siblings carry different times, so serve order and recency agree here and only
	// `offsibtiet` and `offsibpend` below rule the listing order out. Every flag is derivable by
	// the serve-time rule.
	offsibtie: () => ( {
		series: {
			301: [
				...steady( 5, 12, 100, 'ua' ),
				pt( 11, 100, 'b9edee03', false ), // original measurement of the re-run commit
				...steady( 3, 10, 100, 'ub' ),
				pt( 6, 400, 'b9edee03', true, 300.0 ), // first re-run flag: the whole step
				pt( 5.9, 420, 'b9edee03', true, 5.0 ), // second re-run flag: newer, the increment only
				...steady( 5, 5, 420, 'uh' ),
				...steady( 4, 0.5, 420, 'uk' ),
			],
		},
	} ),
	// The same tie with EQUAL percents (each re-run doubles the last: +100% then +100%): only
	// recency separates the siblings, and the newer one must win so the alert renders the
	// current level and files under the current window — not the 20-day-old sibling's
	// (100→200ms) as a late confirmation. Every flag is derivable by the serve-time rule.
	offsibtiet: () => ( {
		series: {
			301: [
				...steady( 5, 30, 100, 'va' ),
				pt( 28, 100, 'c9edee04', false ), // original measurement of the re-run commit
				...steady( 3, 26, 100, 'vb' ),
				pt( 20, 200, 'c9edee04', true, 100.0 ), // older re-run flag, past the 15d window
				pt( 3, 400, 'c9edee04', true, 100.0 ), // newer re-run flag, same percent
				...steady( 5, 2.5, 400, 'vh' ),
				...steady( 4, 0.5, 400, 'vk' ),
			],
		},
	} ),
	// The tie at the data edge: both siblings' positions have only two later rows, so both
	// defer, and the pending line must caption the same way (worst percent, here the second
	// sibling's), not with whichever sibling the server listed first. Every flag is derivable
	// by the serve-time rule.
	offsibpend: () => ( {
		series: {
			301: [
				...steady( 5, 12, 100, 'wa' ),
				pt( 11, 100, 'd9edee05', false ), // original measurement of the re-run commit
				...steady( 3, 10, 100, 'wb' ),
				pt( 1.0, 106, 'd9edee05', true, 6.0 ), // first re-run flag: the small step
				pt( 0.9, 400, 'd9edee05', true, 277.4 ), // second re-run flag: the worst percent
				pt( 0.5, 400, 'wp1', false ),
				pt( 0.3, 400, 'wp2', false ),
			],
		},
	} ),
	// Two deferring positions of one commit whose post medians DIFFER (450 against 520). The
	// first re-run measures the whole step (+300% against the kept 100), the second only the
	// increment (+31.6% against the 380 served just before it). Neither position holds enough
	// later rows to judge — which is exactly why the post median must not decide between them,
	// or the thinnest reading in the digest captions a 4x step with its follow-up's increment.
	// Every flag is derivable by the serve-time rule.
	pendpost: () => ( {
		series: {
			301: [
				...steady( 5, 12, 100, 'xa' ),
				pt( 11, 100, 'e9edee06', false ), // original measurement of the re-run commit
				...steady( 3, 10, 100, 'xb' ),
				pt( 3.0, 400, 'e9edee06', true, 300.0 ), // first re-run flag: the whole step
				pt( 2.5, 380, 'xdip', false ),
				pt( 2.0, 500, 'e9edee06', true, 31.6 ), // second re-run flag: only the increment
				pt( 1.5, 520, 'xtail', false ), // two later rows for the first position, one for the second
			],
		},
	} ),
	// The flagged sample OVERSHOOTS the level the metric holds at (flag 250, holds at 200), and a
	// dropped duplicate at the plateau level sits directly before the flag, so the server's own
	// comparison base (200) clears. Only the pre-flag-commit anchor (100) blocks suppression: any
	// reference to the flagged sample's own noisy value (post < v*0.95 says "reverted" here)
	// would file the live +100% hold (200 over the 100 anchor) as a transient.
	overshootbase: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 200, 'oa' ),
				pt( 5.5, 100, 'obase', false ), // one-commit dip: the flag's kept predecessor
				pt( 5.45, 200, 'oa4', false ), // dropped duplicate of plateau commit oa4 — the flag's raw predecessor
				pt( 5.4, 250, 'deedfeed', true, 25.0 ),
				...seq( 6, 5.3, 200, 'op' ),
			],
		},
	} ),
	// A tied re-post with a NULL id: Number(null) is 0, so an id-coercing sort would rank the
	// re-post first and hand it the dedup win, adopting the duplicate's 104 into the post window
	// and flipping the held +10% to green. A run holding any non-integer id must keep its listing
	// order whole instead; the server lists each original 110 first here.
	tienullid: () => ( {
		series: {
			301: [
				...steady( 10, 6.0, 100, 'tb' ),
				pt( 5, 110, 'feedbf10', true, 10.0 ),
				...Array.from( { length: 5 }, ( _, i ) => [
					{ ...pt( 4.9 - i * 0.1, 110, 'tl' + i, false ), id: 10 + i },
					...( i < 3 ? [ { ...pt( 4.9 - i * 0.1, 104, 'tl' + i, false ), id: null } ] : [] ),
				] ).flat(),
				...steady( 6, 0.5, 110, 'tc' ),
			],
		},
	} ),
	// The writer posts the literal hash "unknown" when the workspace loses its git metadata: same
	// red/degraded outcome as malformed data, but the log must name the missing provenance, not
	// generic malformed-ness.
	unknownhash: () => ( {
		series: {
			301: [ ...steady( 12, 5, 100 ), { ...pt( 0.5, 100, 'u1', false ), hash: 'unknown' } ],
		},
	} ),
	// The commit before the flag measured 0: suppression is impossible to evaluate (a zero
	// baseline sign-breaks both ratio tests), so the gate reports. The line must not justify
	// itself with medians that sat flat, nor with the anchor.
	zeroanchor: () => ( {
		series: {
			301: [
				...steady( 9, 5.4, 100 ),
				pt( 5.3, 0, 'za1', false ),
				pt( 5.2, 100, 'feedbf08', true, 100.0 ),
				...seq( 8, 5.1, 100, 'zb' ),
				...steady( 10, 0.5, 100, 'zc' ),
			],
		},
	} ),
	// Reverted flag older than the window: a positively judged non-regression.
	latereverted: () => ( {
		series: {
			301: [
				...steady( 20, 20.1, 100 ),
				pt( 20, 115, 'feedbeef8', true, 15.0 ),
				...seq( 8, 19.9, 100, 'm' ),
				...steady( 10, 0.5, 100, 'tl' ),
			],
		},
	} ),
	// Flag beyond even the 2x look-back: out of scope, clean heartbeat.
	ancient: () => ( {
		series: {
			301: [
				...steady( 20, 35.1, 100 ),
				pt( 35, 115, 'feedbeef9', true, 15.0 ),
				...seq( 8, 34.9, 114, 'o' ),
				...steady( 10, 0.5, 114, 'tl' ),
			],
		},
	} ),
	// A /metrics row with a non-numeric id must warn in the digest + exit 1.
	nullids: () => ( {
		metrics: [ ...baseMetrics(), { ...metricRow( 0, 'Ghost: LCP', 'ghost-lcp' ), id: 'abc' } ],
		series: { 301: steady( 30, 0.5, 100 ) },
	} ),
	// createdAt in the FUTURE + zero points: stale, never permanently "warming up".
	futurecreated: () => ( {
		metrics: [ ...baseMetrics(), metricRow( 303, 'Fut: FCP', 'fut-fcp', -40 ) ],
		series: { 301: steady( 30, 0.5, 100 ), 303: [] },
	} ),
	// Non-numeric regressionPercent on a confirmed flag: render "regressed", never "+NaN%".
	nanpct: () => ( {
		series: {
			301: [
				...steady( 20, 5.1, 100 ),
				pt( 5, 115, 'feedbeefa', true, '15.0<!here>' ),
				...seq( 8, 4.9, 114, 'q' ),
			],
		},
	} ),
	// 200-char unit must be clipped to 120 in every render site.
	hugeunit: () => ( {
		metrics: [
			{ ...metricRow( 301, 'Alpha: TTFB', 'alpha-ttfb' ), unit: 'z'.repeat( 200 ) },
			metricRow( 302, 'Beta: LCP', 'beta-lcp' ),
		],
		series: { 301: spikeSeries( false ) },
	} ),
};

const baseMetrics = () => [
	metricRow( 301, 'Alpha: TTFB', 'alpha-ttfb' ),
	metricRow( 302, 'Beta: LCP', 'beta-lcp' ),
];

/**
 * Build the metric inventory and per-metric series for one named scenario.
 *
 * @param {string} scenario - Scenario name.
 * @return {object} { metrics, series, discoHtml, discoEmpty, downsampled }
 */
function buildScenario( scenario ) {
	const spec = ( SCENARIOS[ scenario ] || SCENARIOS.clean )();
	const series = spec.series;
	if ( ! ( 302 in series ) && ! spec.no302 ) {
		series[ 302 ] = steady( 30, 0.5, 50 );
	}
	return {
		metrics: spec.metrics || baseMetrics(),
		series,
		discoHtml: scenario === 'disco-html',
		discoEmpty: scenario === 'disco-empty',
		downsampled: scenario === 'downsampled',
	};
}

// Node's fetch rejects the WHATWG "bad port" list before it opens a socket, and listen(0) can
// hand back one of those ports: the mock API then fails as `fetch failed (bad port)` and reddens
// a random test. That took out a whole measurement chain once (Tester #865, 2026-08-29). Probe
// the port rather than hardcode the list, which the runtime owns and may change.
const PROBE_PATH = '/__probe';

/**
 * Start the mock read API for one scenario on an ephemeral port.
 * Repo-agnostic on purpose: it serves any /api/repos/<repo>/… path and records
 * every request, so tests can assert how CODEVITALS_REPO and CODEVITALS_BRANCH
 * land in the URLs.
 *
 * @param {string}  scenario         - Scenario name for buildScenario.
 * @param {object}  [opts]           - Options.
 * @param {boolean} [opts.discoFail] - Serve HTML from /metrics regardless of scenario.
 * @return {Promise<object>} { url, requests, close }
 */
function startMockApi( scenario, { discoFail = false } = {} ) {
	const { metrics, series, discoHtml, discoEmpty, downsampled } = buildScenario( scenario );
	const requests = [];
	const server = http.createServer( ( req, res ) => {
		const u = new URL( req.url, 'http://localhost' );
		if ( u.pathname === PROBE_PATH ) {
			res.end( 'ok' ); // deliberately not recorded: tests assert the exact request list
			return;
		}
		requests.push( u.pathname + u.search );
		if ( /^\/api\/repos\/.+\/metrics$/.test( u.pathname ) ) {
			if ( discoFail || discoHtml ) {
				res.setHeader( 'content-type', 'text/html' );
				res.end( '<!DOCTYPE html><html></html>' );
				return;
			}
			if ( discoEmpty ) {
				res.end( '[]' );
				return;
			}
			res.setHeader( 'content-type', 'application/json' );
			res.end( JSON.stringify( metrics ) );
			return;
		}
		const m = u.pathname.match( /\/perf\/evolution\/(\w+)$/ );
		if ( m ) {
			const id = m[ 1 ];
			if ( ! ( id in series ) ) {
				res.statusCode = 404;
				res.end( JSON.stringify( { error: 'Metric not found' } ) );
				return;
			}
			const limit = Number( u.searchParams.get( 'limit' ) || 400 );
			const data = series[ id ].slice( -limit );
			res.setHeader( 'content-type', 'application/json' );
			res.end(
				JSON.stringify( {
					data,
					meta: {
						totalPoints: data.length,
						displayedPoints: data.length,
						isDownsampled: downsampled,
					},
				} )
			);
			return;
		}
		res.statusCode = 404;
		res.end( '{}' );
	} );
	return new Promise( ( resolve, reject ) => {
		let attempts = 0;
		const bind = () => {
			server.listen( 0, '127.0.0.1', async () => {
				const { port } = server.address();
				const url = `http://127.0.0.1:${ port }`;
				try {
					await fetch( url + PROBE_PATH );
				} catch ( e ) {
					// Close before rejecting: a live server keeps the runner's event loop alive and
					// turns a legible failure into a hang.
					if ( ++attempts > 20 ) {
						server.close( () =>
							reject(
								new Error(
									`no usable port after 20 tries (last: ${ port }, ${
										e.cause?.message || e.message
									})`
								)
							)
						);
						return;
					}
					server.close( bind );
					return;
				}
				resolve( {
					url,
					requests,
					close: () => new Promise( r => server.close( r ) ),
				} );
			} );
		};
		bind();
	} );
}

// ---- in-process harness ----

/** Run fn with console.log/error captured; returns { result, out, err }. */
async function captureConsole( fn ) {
	const out = [];
	const err = [];
	const orig = { log: console.log, error: console.error };
	console.log = ( ...args ) => out.push( args.join( ' ' ) );
	console.error = ( ...args ) => err.push( args.join( ' ' ) );
	try {
		const result = await fn();
		return { result, out: out.join( '\n' ), err: err.join( '\n' ) };
	} finally {
		console.log = orig.log;
		console.error = orig.error;
	}
}

/** Mock Slack SDK: records constructor + postMessage calls, optionally fails. */
function makeSlackMock( { slackFail = false } = {} ) {
	const calls = [];
	class MockWebClient {
		constructor( token, options ) {
			calls.push( { type: 'client', token, options } );
			this.chat = {
				postMessage: async payload => {
					if ( slackFail ) {
						const e = new Error( 'An API error occurred: not_in_channel' );
						e.data = { error: 'not_in_channel' };
						throw e;
					}
					calls.push( { type: 'post', payload } );
					return { ok: true };
				},
			};
		}
	}
	return { calls, MockWebClient };
}

/**
 * Run the digest in-process against a scenario. The env passed to main() is a
 * complete replacement (never process.env), so nothing can leak in from the
 * developer's shell.
 *
 * @param {string} scenario       - Scenario name.
 * @param {object} [envOverrides] - Env on top of { DRY_RUN: '1', CODEVITALS_EVOLUTION_URL }.
 * @param {object} [opts]         - { discoFail, slackFail }.
 * @return {Promise<object>} { code, out, err, calls, requests }
 */
async function runDigest( scenario, envOverrides = {}, opts = {} ) {
	const api = await startMockApi( scenario, opts );
	const { calls, MockWebClient } = makeSlackMock( opts );
	try {
		const { result, out, err } = await captureConsole( () =>
			main( {
				env: { DRY_RUN: '1', CODEVITALS_EVOLUTION_URL: api.url, ...envOverrides },
				WebClientClass: MockWebClient,
			} )
		);
		return { code: result, out, err, calls, requests: api.requests };
	} finally {
		await api.close();
	}
}

// ---- the scenario matrix ----
// Each case pins exit code plus required/forbidden substrings on both streams.

const CASES = [
	// --- discovery ---
	{
		n: 'clean-discovered',
		sc: 'clean',
		exit: 0,
		out: [
			'No sustained metric regressions',
			'across 2 tracked metrics',
			'0 sustained regression(s)',
		],
		// Pins the fixture hash helper's injectivity: a colliding label would surface here as
		// accidental "duplicate row" dedup noise on a clean series.
		errNot: [ 'duplicate row' ],
	},
	{
		n: 'disco-html-fails-loud',
		sc: 'disco-html',
		exit: 1,
		out: [ 'Could not enumerate the tracked metrics', 'METRIC DISCOVERY FAILURE' ],
	},
	{ n: 'disco-empty-fails-loud', sc: 'disco-empty', exit: 1, out: [ 'METRIC DISCOVERY FAILURE' ] },
	{
		n: 'disco-html-override-cosmetic',
		sc: 'disco-html',
		env: { METRIC_IDS: '301,302' },
		exit: 0,
		out: [ 'across 2 tracked metrics' ],
		err: [ 'metrics lookup failed' ],
	},
	{
		n: 'disco-html-override-label-fallback',
		sc: 'stale-one',
		env: { METRIC_IDS: '301,302' },
		discoFail: true,
		exit: 1,
		out: [ '*Stale metric:* metric 301 — newest 12d old' ],
		err: [ 'metrics lookup failed' ],
	},
	{
		n: 'stale-one-named-with-disco',
		sc: 'stale-one',
		exit: 1,
		out: [ '*Stale metric:* Alpha: TTFB — newest 12d old' ],
	},
	{
		n: 'override-numeric-guard',
		sc: 'clean',
		env: { METRIC_IDS: '301;drop' },
		exit: 1,
		err: [ 'METRIC_IDS must be numeric ids' ],
	},
	// --- confirmation gate ---
	{
		n: 'confirmed-reported',
		sc: 'confirmed',
		exit: 0,
		out: [
			'1 sustained regression',
			'Alpha: TTFB* +15.0% (100→115ms)',
			'holding at med 100→114ms',
			'feedbeef',
		],
	},
	{
		n: 'pending-listed',
		sc: 'pending',
		exit: 0,
		out: [ 'awaiting confirmation', '1 pending', 'feedbeef' ],
		not: [ 'sustained regression*' ],
	},
	{
		// Garbage values are malformed (red), but the flag still REPORTS via the empty-pre
		// fail-open path: suppression needs positive evidence.
		n: 'failopen-reports',
		sc: 'failopen',
		exit: 1,
		out: [ '1 sustained regression', 'feedbeef', 'MALFORMED DATA SKIPPED' ],
		not: [ 'transient spike' ],
	},
	// --- value validation / gate horizon / render guards ---
	{
		// Null values are malformed (red) and never gate-suppressed via Number(null)=0; the same
		// applies to a lone null value with a finite rawValue — the server's schema says value is
		// NOT NULL, so the digest never falls back to judging the raw domain.
		n: 'nullvals-not-suppressed',
		sc: 'nullvals',
		exit: 1,
		out: [ 'MALFORMED DATA SKIPPED', 'awaiting confirmation' ],
		not: [ 'transient spike' ],
	},
	{
		n: 'strvals-no-injection',
		sc: 'strvals',
		exit: 1,
		out: [ '1 sustained regression', '(100→115', 'MALFORMED DATA SKIPPED' ],
		not: [ '<!channel>' ],
	},
	{
		// Also covers the late re-land right after a revert dip: the alert must surface as
		// late-confirmed in the message, never vanish into a stderr-only "reverted" verdict.
		n: 'late-confirmed-reported',
		sc: 'late',
		exit: 0,
		out: [
			'late-confirmed regression',
			'1 late-confirmed',
			'feedbeef7',
			'older than the 15d window',
		],
		not: [ 'sustained regression*', 'white_check_mark' ],
	},
	{
		// A late reverted flag is a positively judged non-regression: suppressed, but visible in
		// the transients context line. A silent verdict channel would also hide a wrong verdict.
		n: 'late-reverted-visible',
		sc: 'latereverted',
		exit: 0,
		out: [ 'No sustained metric regressions', '1 transient spike', 'feedbeef8', '(late)' ],
		not: [ 'late-confirmed' ],
	},
	{
		// A re-landed regression must never be judged "reverted" against its own contaminated
		// baseline (pre ≈ post at the regressed level). The revert anchor is the pre-flag commit,
		// never the flagged sample's own noisy value; when the window medians never moved, the
		// copy names the anchor comparison instead of claiming they did.
		n: 'relanded-still-confirmed',
		sc: 'relanded',
		exit: 0,
		out: [
			'1 sustained regression',
			'+100.0% (100→200ms)',
			'holds above the pre-flag 100ms',
			'feedbeefb',
		],
		not: [ 'transient spike' ],
	},
	{
		// The flagged sample's own value must never become a suppression reference: the flag
		// (250) overshoots the level the metric holds at (200), the medians sit flat at the
		// plateau, and the server's own comparison base (a dropped duplicate at 200) clears. Only
		// the pre-flag-commit anchor blocks suppression; a post < v*0.95 reference would file the
		// live +100% hold (200 over the 100 anchor) as a transient.
		n: 'overshoot-flag-value-is-never-a-suppression-reference',
		sc: 'overshootbase',
		exit: 0,
		out: [ '1 sustained regression', '+25.0%', 'holds above the pre-flag 100ms', 'deedfeed' ],
		err: [ 'dropped 1 duplicate row' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// A duplicate row for an already-measured commit in the anchor slot must not become
		// entry.from and flip a live re-land to "transient": dedup keeps each commit's first
		// measurement.
		n: 'dup-anchor-still-confirmed',
		sc: 'dupanchor',
		exit: 0,
		out: [ '1 sustained regression', 'holds above the pre-flag 100ms', 'feedbf03' ],
		err: [ 'duplicate row' ],
		not: [ 'transient spike' ],
	},
	{
		// Recent-stamped re-runs of old commits must neither dilute the post window nor satisfy
		// the later-commit count: after dedup this flag has too few later commits and stays
		// pending, never "transient".
		n: 'dup-dilution-not-suppressed',
		sc: 'dupdilute',
		exit: 0,
		out: [ 'awaiting confirmation', '1 pending', 'feedbf04' ],
		err: [ 'duplicate row' ],
		not: [ 'transient spike', 'sustained regression*' ],
	},
	{
		// The flag can ride on the RE-RUN row of an already-measured commit: dropping the
		// duplicate must transfer the flag and its percent to the kept row (marked
		// re-run-sourced), never delete a live regression behind a green all-clear. Across
		// several flagged re-posts of one commit the WORST percent wins, order-independently, and
		// stderr counts every flagged duplicate, not just the first.
		n: 'dup-flagged-row-still-reported',
		sc: 'dupflag',
		exit: 0,
		out: [
			'1 sustained regression',
			'+150.0% (100→250ms)',
			'(flag from a re-run)',
			'holding at med 100→250ms',
		],
		err: [ 'duplicate row', 'carried a regression flag — transferred to the kept row' ],
		not: [ 'No sustained metric regressions', 'transient spike' ],
	},
	{
		// ...but the flagged re-run's VALUE must never enter the kept series: it is the revert
		// anchor of the NEXT flag, and adopting it flips a live re-land to "transient" behind a
		// green all-clear.
		n: 'dup-flag-value-never-poisons-anchor',
		sc: 'dupvalpoison',
		exit: 0,
		// TWO alerts: the re-land (judged against the unpoisoned 100 anchor) AND the transferred
		// re-post flag. The metric holds at 200 against that flag's own server base of 100, so
		// suppressing it as a transient would discard live evidence (on server-real data it is
		// the ONLY flag this sequence produces).
		out: [
			'2 sustained regressions',
			'+100.0% (100→200ms)',
			'holds above the pre-flag 100ms',
			'feedbf09',
			'+150.0% (100→250ms)',
			'(flag from a re-run)',
		],
		err: [ 'carried a regression flag' ],
		not: [ 'No sustained metric regressions', 'transient spike' ],
	},
	{
		// A re-run measures nothing new: weeks of re-runs of already-measured commits must fire
		// the dead-man (a true positive: no new commit was measured), never renew it. Only a new
		// commit's first measurement is fresh.
		n: 'reruns-of-old-commits-do-not-renew-the-deadman',
		sc: 'dupfresh',
		exit: 1,
		out: [ 'Stale metric', 'newest 20d old' ],
		err: [ 'dropped 2 duplicate row' ],
		not: [ 'No sustained metric regressions in the last' ],
	},
	{
		// A flag on a fresh run-time-stamped re-run of an ancient commit is judged at its own
		// time at the data edge, where the server flagged it: never relocated onto the original's
		// 45d-old slot (transient, green) or drained as "already judged". The alert says its
		// numbers come from a re-run.
		n: 'flagged-rerun-judged-at-its-own-time',
		sc: 'rerunflag',
		exit: 0,
		out: [ '1 sustained regression', '+30.0% (100→130ms)', '(flag from a re-run)' ],
		err: [ 'dropped 1 duplicate row' ],
		errNot: [ 'look-back skipped' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// A flagged recovery re-run batch (old commits re-measured high, beyond the look-back)
		// must not leak its values into a later flag's pre-window median or revert anchor: with
		// the batch rows retained in the series, the held +8% regression reads "transient" behind
		// a green tick.
		n: 'rerun-batch-values-never-dilute-the-gate',
		sc: 'rerunbatch',
		exit: 0,
		out: [ '1 sustained regression', '+8.0% (100→108ms)', 'feedbf11' ],
		err: [ 'dropped 3 duplicate row', '3 regression flag(s) older than the 30d look-back' ],
		not: [ 'transient spike', 'No sustained metric regressions', '140ms' ],
	},
	{
		// A FLAGGED re-run must not renew the staleness dead-man any more than an unflagged one:
		// nothing new was measured, so the alarm fires (the re-run's flag itself is judged at the
		// data edge and awaits later measurements).
		n: 'flagged-rerun-does-not-renew-the-deadman',
		sc: 'rerunstale',
		exit: 1,
		out: [ 'Stale metric', 'newest 20d old' ],
		err: [ 'dropped 1 duplicate row' ],
		not: [ 'No sustained metric regressions in the last' ],
	},
	{
		// The same stored rows listed in either tie order must render the same verdict: the
		// row-id tie-sort makes the verdict independent of the server's arbitrary
		// equal-measured_at listing order. Equal-time re-posts measuring inside the pre-flag
		// noise floor must never displace the kept values either: with min-wins the post median
		// drops under the suppression line and a held +10% regression turns green.
		n: 'tied-row-listing-order-cannot-change-the-verdict',
		sc: 'tieloworder',
		exit: 0,
		out: [ '1 sustained regression', '+10.0% (100→110ms)', 'feedbf10' ],
		err: [ 'dropped 3 duplicate row' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// A flagged re-run landing mid-plateau must not be suppressed against its position-local
		// neighbours (pre = post = anchor = the plateau): the alert stands on the commit's own
		// pre-regression baseline, and the line renders THAT level so the reader sees what was
		// compared.
		n: 'plateau-rerun-flag-cannot-be-suppressed-as-transient',
		sc: 'rerunplateau',
		exit: 0,
		out: [
			'1 sustained regression',
			'+40.0% (100→140ms)',
			'(flag from a re-run)',
			'holds above the pre-flag 100ms',
			'baddad00',
		],
		err: [ 'dropped 1 duplicate row', '1 regression flag(s) older than the 30d look-back' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// ...and its counterpart: a re-run flag whose metric genuinely recovered clears both
		// anchors and stays a suppressed transient; the own-baseline requirement must not turn
		// every routine re-run into an alert. The plain transient path holds too: a cleanly
		// reverted spike is suppressed but stays visible in the context line, never silently
		// dropped.
		n: 'recovered-rerun-flag-still-suppressed-as-transient',
		sc: 'reruntransient',
		exit: 0,
		out: [ 'No sustained metric regressions', '1 transient spike', 'beefcaf3' ],
		err: [ 'dropped 1 duplicate row' ],
		not: [ 'sustained regression*' ],
	},
	{
		// The server computes flags at serve time against the row immediately before the flagged
		// one in the response, a row the dedup may have dropped (a catch-up re-run reproducing
		// the pre-regression baseline). Suppression must also clear that base, or the only fresh
		// evidence of a live regression is filed as a transient. The alert renders the server's
		// base, so from→to matches the flagged percent.
		n: 'dedup-dropped-server-base-cannot-be-suppressed-as-transient',
		sc: 'dedupbase',
		exit: 0,
		out: [
			'1 sustained regression',
			'+40.0% (100→140ms)',
			'(flag from a re-run)',
			'holds above the pre-flag 100ms',
			'cafe0140',
		],
		err: [ 'dropped 2 duplicate row', '1 regression flag(s) older than the 30d look-back' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// The folded event keeps the LOWER server base (100, not the re-post's 140), so the
		// +40% cannot be filed as a transient. Also the only case reaching the worst-percent
		// comparator with two flagged rows on one hash.
		n: 'same-time-repost-cannot-replace-the-kept-flags-server-base',
		sc: 'dedupbasetie',
		exit: 0,
		out: [ '1 sustained regression', '(100→', 'cafe0140' ],
		err: [ 'dropped 2 duplicate row', '1 carried a regression flag' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// Mirror: the kept row wins the comparator, so the listed-first flag's lower base (100)
		// must still fold in, or the +42.9% files as a transient against the plateau.
		n: 'kept-flag-winning-the-comparator-still-folds-in-the-lower-server-base',
		sc: 'dedupbaseskip',
		exit: 0,
		out: [ '1 sustained regression', '(100→200', 'cafe0140' ],
		err: [ 'dropped 2 duplicate row', '1 carried a regression flag' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// The server judged the flag against the rows around it IN THE RESPONSE; after the id
		// tie-sort moves the flagged row before its served-earlier tie-mates, those base-level
		// rows must stay on the "before" side of the gate's windows or the held +100% files as a
		// transient behind the green tick.
		n: 'the-tie-sort-must-not-move-served-before-rows-into-a-flags-post-window',
		sc: 'tierelocate',
		exit: 0,
		out: [ '1 sustained regression', '(100→200', 'cafe0200' ],
		err: [],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// Same defect through the dedup: the folded flag is judged at the re-post's own serve
		// position, never relocated onto the kept row's sorted slot.
		n: 'a-transferred-flag-is-judged-at-the-re-posts-own-serve-position',
		sc: 'tietransfer',
		exit: 0,
		out: [ '1 sustained regression', '(100→200', '(flag from a re-run)', 'cafe0200' ],
		err: [ 'dropped 1 duplicate row', '1 carried a regression flag' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// Control: serve-position judging must not turn a genuinely reverted spike inside a
		// re-ordered tie into an alert.
		n: 'reordered-tie-around-a-recovered-spike-still-suppresses',
		sc: 'tietransient',
		exit: 0,
		out: [ 'No sustained metric regressions', '1 transient spike', 'cafe0130' ],
		err: [],
		not: [ 'sustained regression*' ],
	},
	{
		// The flagged commit's own kept row is excluded from its flag's windows by HASH: a
		// folded flag's serve index is the dropped re-post's, so an index-based exclusion lets
		// the kept original land in the post window by listing order and coin-flip the verdict.
		n: 'a-folded-flags-own-kept-row-is-never-evidence-in-its-windows',
		sc: 'tiecoinflip',
		exit: 0,
		out: [ '1 sustained regression', '+30.0%', '(flag from a re-run)', 'cafe0130' ],
		err: [ 'dropped 1 duplicate row', '1 carried a regression flag' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// One reporting position forces the alert: a sibling folded flag at the data edge may
		// defer the event only when no position reports.
		n: 'an-edge-folded-flag-cannot-veto-a-siblings-conclusive-held-verdict',
		sc: 'foldveto',
		exit: 0,
		out: [ '1 sustained regression', '+100.0%', 'deed0200' ],
		err: [ 'dropped 1 duplicate row', '1 carried a regression flag' ],
		not: [ 'awaiting confirmation', 'No sustained metric regressions' ],
	},
	{
		// An off-time re-run flag is judged at its serve position: equal-time kept rows the
		// server served after it are "after" evidence, not pre-window filler.
		n: 'an-off-time-flags-served-after-tie-mates-are-post-window-evidence',
		sc: 'offtieserve',
		exit: 0,
		out: [ '1 sustained regression', '+100.0%', '(flag from a re-run)', '0ddeed00' ],
		err: [ 'dropped 1 duplicate row', '1 carried a regression flag' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// Two off-time re-run flags on one commit merge into one event judged at both serve
		// positions: a pending sibling at the data edge must never claim the commit ahead of a
		// sibling whose position holds conclusive evidence.
		n: 'an-edge-off-time-sibling-cannot-mask-the-other-siblings-held-verdict',
		sc: 'offsiblingmask',
		exit: 0,
		out: [ '1 sustained regression', '+100.0%', '(flag from a re-run)', '0ffdeed0' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ 'awaiting confirmation', 'No sustained metric regressions' ],
	},
	{
		// An aged-out off-time sibling stays out of the merge: it must not resurrect its
		// weeks-old held window through a fresh re-run's timestamp, and it still lands in the
		// per-flag aged-flags count on stderr.
		n: 'an-aged-off-time-sibling-cannot-resurrect-through-a-fresh-re-run',
		sc: 'offagedsibling',
		exit: 0,
		out: [ 'No sustained metric regressions', '1 transient spike', 'a9edee00' ],
		err: [
			'dropped 2 duplicate row',
			'2 carried a regression flag',
			'older than the 30d look-back',
		],
		not: [ 'sustained regression*' ],
	},
	{
		// A merged off-time event renders the sibling at the DECIDING position: the held old
		// flag's percent and time (late-confirmed), never the recovered new sibling's larger
		// percent under a current-window header.
		n: 'a-merged-off-time-event-renders-the-sibling-whose-position-held',
		sc: 'offmixedage',
		exit: 0,
		out: [ '1 late-confirmed', '+100.0%', '(flag from a re-run)', 'a9edee01' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '+150.0%', 'sustained regression*', 'awaiting confirmation', 'transient spike' ],
	},
	{
		// The mirror direction: the OLD sibling recovered and the NEW one holds, so the
		// deciding window is the fresh position and the alert renders the NEW flag as a
		// current sustained regression — never the first-listed sibling's recovered +100%
		// as a late confirmation.
		n: 'a-merged-off-time-event-renders-the-fresh-sibling-when-its-position-holds',
		sc: 'offmirrorage',
		exit: 0,
		out: [ '1 sustained regression', '+150.0%', '(100→250ms)', '(flag from a re-run)', 'a9edee02' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '+100.0%', 'late-confirmed', 'awaiting confirmation', 'transient spike' ],
	},
	{
		// Byte-identical tied windows carry no deciding evidence, so the tie breaks toward the
		// worst percent: that sibling captions the alert even though the newer one (the
		// increment only) would render the quieter number.
		n: 'tied-sibling-windows-break-toward-the-worst-percent',
		sc: 'offsibtie',
		exit: 0,
		out: [ '1 sustained regression', '+300.0% (100→400ms)', '(flag from a re-run)', 'b9edee03' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '+5.0%', '(100→420ms)', 'late-confirmed', 'transient spike' ],
	},
	{
		// Equal percents leave only recency to separate tied siblings: the newer one renders,
		// so the line shows the current level under the current-window header.
		n: 'equal-percent-tied-siblings-break-toward-the-newest',
		sc: 'offsibtiet',
		exit: 0,
		out: [ '1 sustained regression', '+100.0% (100→400ms)', '(flag from a re-run)', 'c9edee04' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '(100→200ms)', 'late-confirmed', 'transient spike' ],
	},
	{
		// The pending branch obeys the same tie rule: the deferring line captions the worst
		// percent, not the first-listed sibling's increment.
		n: 'tied-pending-siblings-caption-the-worst-percent',
		sc: 'offsibpend',
		exit: 0,
		out: [ 'awaiting confirmation', '1 pending', '+277.4%', 'd9edee05' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '+6.0%', 'sustained regression*', 'transient spike' ],
	},
	{
		// A deferring window's post median is just the one or two rows that made it defer, so it
		// must not outrank the percent: the pending line captions the whole step, not the
		// higher-post position's follow-up increment.
		n: 'deferring-windows-rank-on-percent-not-on-their-own-thin-median',
		sc: 'pendpost',
		exit: 0,
		out: [ 'awaiting confirmation', '1 pending', '+300.0%', 'e9edee06' ],
		err: [ 'dropped 2 duplicate row', '2 carried a regression flag' ],
		not: [ '+31.6%', 'sustained regression*', 'transient spike' ],
	},
	{
		// A tied re-post with a null id must not adopt the duplicate's value: Number(null)
		// coerces to 0, so an id-coercing comparator ranks the re-post first and it WINS the
		// dedup. A run holding any non-integer id keeps its listing order whole.
		n: 'null-id-tied-repost-cannot-adopt-the-duplicate-value',
		sc: 'tienullid',
		exit: 0,
		out: [ '1 sustained regression', '+10.0% (100→110ms)', 'feedbf10' ],
		err: [ 'dropped 3 duplicate row' ],
		not: [ 'transient spike', 'No sustained metric regressions' ],
	},
	{
		// An out-of-order row must trip the ordering guard (read-failure path) even when it
		// duplicates an earlier commit: dedup must not absorb the violation into a silent drop,
		// and a plain newest-first response takes the same path.
		n: 'out-of-order-dup-fails-loud',
		sc: 'duporder',
		exit: 1,
		out: [ 'Could not read metric 301' ],
		err: [ 'not oldest-first' ],
		errNot: [ 'duplicate row' ],
	},
	{
		// A non-string hash (e.g. an array) passes RegExp coercion: it must go down the
		// malformed-point path, never crash the digest on .toLowerCase(). A crafted string hash
		// ("<!channel> …") takes the same malformed path.
		n: 'array-hash-malformed-not-crash',
		sc: 'arrayhash',
		exit: 1,
		out: [ 'Skipped malformed data point', 'MALFORMED DATA SKIPPED' ],
		err: [ 'malformed point' ],
	},
	{
		// The writer's hash "unknown" sentinel (workspace lost git metadata) degrades the digest
		// like any malformed point, but the log names the real cause.
		n: 'unknown-hash-named-as-no-provenance',
		sc: 'unknownhash',
		exit: 1,
		out: [ 'Skipped malformed data point', 'MALFORMED DATA SKIPPED' ],
		err: [ 'no commit provenance' ],
		errNot: [ 'malformed point' ],
	},
	{
		// The joined late-confirmed block caps its entries and says how many were cut, so the
		// header count and the body agree (no silent tail-drop inside the char clamp).
		n: 'late-crowd-capped-with-count',
		sc: 'latecrowd',
		exit: 0,
		out: [ '*12 late-confirmed regressions*', 'and 4 more' ],
	},
	{
		// A zero pre-flag anchor makes suppression unevaluable, so the gate reports. With the
		// medians flat the line must carry NEITHER median copy: flat medians justify nothing, and
		// the anchor copy belongs to a usable anchor.
		n: 'zero-anchor-reports-without-flat-median-copy',
		sc: 'zeroanchor',
		exit: 0,
		out: [ '1 sustained regression', 'feedbf08' ],
		not: [ 'holding at med', 'holds above the pre-flag', 'transient spike' ],
	},
	{
		// An empty pre-window medians to 0 and must fail open to a report, without a fabricated
		// "med 0→…" baseline in the message.
		n: 'flag-at-series-start-no-zero-baseline',
		sc: 'flagfirst',
		exit: 0,
		out: [ '1 sustained regression', 'feedbf06' ],
		not: [ 'med 0→', 'holding at med', 'transient spike' ],
	},
	{
		// The gate judges the server's flag domain (normalized value): a normalized regression
		// that holds while rawValue stays flat must confirm, never revert.
		n: 'normalized-flag-judged-on-value',
		sc: 'normflag',
		exit: 0,
		out: [ '1 sustained regression', '+20.0% (100→120ms)', 'feedbf07' ],
		not: [ 'transient spike' ],
	},
	{
		// A newline in a UI-edited metric name must collapse to a space, never render as its own
		// (forged) digest line.
		n: 'newline-name-collapsed',
		sc: 'nlname',
		exit: 0,
		out: [ '1 sustained regression', 'Alpha FAKE :white_check_mark: all clear' ],
	},
	{
		// Mrkdwn metacharacters in a metric name must land HTML-escaped in the alert line: without
		// esc(), raw "&<>" could break or forge mrkdwn structure in the digest.
		n: 'metric-name-html-escaped-in-alert-line',
		sc: 'escname',
		exit: 0,
		out: [ '1 sustained regression', 'Alpha &amp;&lt;TTFB&gt;' ],
	},
	{
		// The inverse of the sustained cases: a small flag that cleanly reverts must suppress,
		// never render a sustained line over a metric sitting exactly where it started.
		n: 'smallflag-reverts-suppressed',
		sc: 'smallflag',
		exit: 0,
		out: [ 'No sustained metric regressions', '1 transient spike', '+3.0%' ],
		not: [ 'sustained regression*' ],
	},
	{
		// Silent in the MESSAGE by design (every already-alerted flag eventually ages out), but
		// the count must reach stderr: a digest outage longer than the look-back swallows
		// never-reported flags through this same path.
		n: 'beyond-lookback-ignored',
		sc: 'ancient',
		exit: 0,
		out: [ 'No sustained metric regressions' ],
		err: [ 'look-back skipped' ],
		not: [ 'late-confirmed', 'sustained regression*' ],
	},
	{
		n: 'dropped-ids-loud',
		sc: 'nullids',
		exit: 1,
		out: [ 'did not look numeric', 'id(s) dropped', 'data that could be read' ],
		err: [ 'non-numeric — dropped' ],
	},
	{
		n: 'future-created-not-warming',
		sc: 'futurecreated',
		exit: 1,
		out: [ 'Stale metric', 'DATA STALE', 'no data points' ],
	},
	{
		n: 'nan-pct-renders-regressed',
		sc: 'nanpct',
		exit: 0,
		out: [ 'regressed', '1 sustained regression' ],
		not: [ '+NaN%' ],
	},
	{
		n: 'negative-pct-renders-sign',
		sc: 'negpct',
		exit: 0,
		out: [ '1 sustained regression', '-5.3%' ],
		not: [ '+-' ],
	},
	{
		n: 'huge-unit-clipped',
		sc: 'hugeunit',
		exit: 0,
		out: [ '1 sustained regression', 'z'.repeat( 100 ) ],
		not: [ 'z'.repeat( 130 ) ],
	},
	{
		// The day knobs parse as plain decimals only: hex, exponent forms, and out-of-range
		// values are all rejected the same way.
		n: 'hex-env-rejected',
		sc: 'clean',
		env: { WINDOW_DAYS: '0x10' },
		exit: 1,
		err: [ 'plain decimal' ],
	},
	{
		n: 'huge-env-rejected',
		sc: 'clean',
		env: { STALENESS_DAYS: '99999' },
		exit: 1,
		err: [ 'plain decimal' ],
	},
	{
		n: 'whitespace-env-defaults',
		sc: 'clean',
		env: { WINDOW_DAYS: ' ' },
		exit: 0,
		out: [ 'last 15 days' ],
	},
	{
		// A live run with no usable token must fail loud: a missing token, a bare "******"
		// placeholder, and a placeholder wrapped in whitespace all take the same refusal path.
		n: 'trimmed-placeholder-token',
		sc: 'clean',
		env: { DRY_RUN: '', SLACK_TOKEN: '****** ', SLACK_CHANNEL_ID: 'C123' },
		exit: 1,
		err: [ 'refusing to skip silently' ],
	},
	// --- clip / limit ---
	{
		n: 'truncated-fails',
		sc: 'truncated',
		exit: 1,
		out: [ 'this digest is partial' ],
		err: [ 'window truncated; raise the limit' ],
	},
	{
		n: 'full-but-covered-ok',
		sc: 'full-but-covered',
		exit: 0,
		out: [ 'No sustained metric regressions' ],
	},
	{ n: 'downsampled-fails', sc: 'downsampled', exit: 1, err: [ 'downsampled (LTTB)' ] },
	// --- staleness / warm-up ---
	{
		n: 'warming-exempt',
		sc: 'warming',
		exit: 0,
		out: [ 'No sustained metric regressions' ],
		err: [ 'warming up, staleness exempt' ],
		not: [ 'Stale metric' ],
	},
	{
		n: 'dead-old-stale',
		sc: 'dead-old',
		exit: 1,
		out: [ 'Stale metric', 'Old: FCP — no data points', 'DATA STALE' ],
	},
	{ n: 'all-stale', sc: 'stale-all', exit: 1, out: [ 'No fresh data on any tracked metric' ] },
	// --- malformed-point / read-failure paths ---
	{ n: 'strflag-malformed', sc: 'strflag', exit: 1, out: [ 'MALFORMED DATA SKIPPED' ] },
	{
		n: 'singleton-exempt',
		sc: 'singleton',
		exit: 0,
		out: [ 'No sustained metric regressions' ],
		not: [ 'malformed' ],
	},
	{
		// The singleton exemption covers an ABSENT flag only: a present non-boolean one is
		// contract drift, not a fabricated pending flag.
		n: 'singleton-strflag-malformed',
		sc: 'singleton-strflag',
		exit: 1,
		out: [ 'MALFORMED DATA SKIPPED' ],
		not: [ 'pending' ],
	},
	{ n: 'future-point-malformed', sc: 'future', exit: 1, err: [ 'malformed point' ] },
	{
		// A future-dated point INSIDE the skew allowance passes validation but must not feed the
		// staleness clock: freshness is earned by real, past-dated measurements.
		n: 'future-point-not-fresh',
		sc: 'futurepoint',
		exit: 1,
		out: [ 'Stale metric', 'newest 10d old', 'DATA STALE' ],
	},
	{
		// Degraded weeks wear the grey question mark, never the green tick.
		n: 'partial-404',
		sc: 'one404',
		exit: 1,
		out: [
			'Could not read metric 301',
			'this digest is partial',
			'data that could be read (1 tracked metric)',
		],
		not: [ 'white_check_mark' ],
	},
	{
		n: 'allfail',
		sc: 'allfail',
		exit: 1,
		out: [ 'Could not read any metric data', 'DATA READ FAILURE' ],
	},
];

for ( const c of CASES ) {
	test( `matrix: ${ c.n }`, async () => {
		const r = await runDigest( c.sc, c.env || {}, { discoFail: c.discoFail } );
		const ctx = `\n--- stdout ---\n${ r.out }\n--- stderr ---\n${ r.err }`;
		assert.strictEqual( r.code, c.exit, `exit code${ ctx }` );
		for ( const s of c.out || [] ) {
			assert.ok( r.out.includes( s ), `stdout missing: ${ s }${ ctx }` );
		}
		for ( const s of c.err || [] ) {
			assert.ok( r.err.includes( s ), `stderr missing: ${ s }${ ctx }` );
		}
		for ( const s of c.not || [] ) {
			assert.ok( ! r.out.includes( s ), `stdout must NOT contain: ${ s }${ ctx }` );
		}
		for ( const s of c.errNot || [] ) {
			assert.ok( ! r.err.includes( s ), `stderr must NOT contain: ${ s }${ ctx }` );
		}
	} );
}

// ---- live post path (mock Slack client) ----

test( 'live post: posts once with bounded retries, prints "posted", emits no CI service messages', async () => {
	const r = await runDigest( 'clean', {
		DRY_RUN: '',
		SLACK_TOKEN: 'xoxb-test',
		SLACK_CHANNEL_ID: 'C123',
	} );
	assert.strictEqual( r.code, 0, r.err );
	const client = r.calls.find( x => x.type === 'client' );
	assert.strictEqual( client.token, 'xoxb-test' );
	// ONE retry + a per-attempt deadline: a 5xx/timeout is delivery-ambiguous, so every extra
	// retry risks a duplicate digest. A scheduler-side job timeout must never fire mid-retry, and
	// a blackholed connection must never park the job (the SDK's default timeout is 0 = none).
	assert.strictEqual( client.options.retryConfig.retries, 1 );
	assert.strictEqual( client.options.timeout, 30000 );
	// A 429's Retry-After sleep happens OUTSIDE both bounds above: rate-limited calls must reject
	// loudly, not park the queue past every configured deadline.
	assert.strictEqual( client.options.rejectRateLimitedCalls, true );
	// The thrown error must not carry the Bearer token on its config.
	assert.strictEqual( client.options.attachOriginalToWebAPIRequestError, false );
	const post = r.calls.find( x => x.type === 'post' );
	assert.strictEqual( post.payload.channel, 'C123' );
	assert.ok( Array.isArray( post.payload.blocks ) && post.payload.blocks.length > 0 );
	// "posted" on its own line is the marker a scheduler-side watchdog greps for.
	assert.match( r.out, /^posted$/m );
	// Scheduler service messages belong to the CI build step, never to this script.
	assert.ok( ! r.out.includes( '##teamcity' ) && ! r.err.includes( '##teamcity' ) );
} );

test( 'live post: a Slack failure names its cause and the runbook hint, and never prints "posted"', async () => {
	const r = await runDigest(
		'clean',
		{ DRY_RUN: '', SLACK_TOKEN: 'xoxb-test', SLACK_CHANNEL_ID: 'C123' },
		{ slackFail: true }
	);
	assert.strictEqual( r.code, 1 );
	assert.ok( r.err.includes( 'Slack post failed: not_in_channel' ), r.err );
	assert.ok( r.err.includes( 'INVITED to the channel' ), r.err );
	assert.ok( ! /^posted$/m.test( r.out ) );
} );

// ---- Slack auto-parse hardening ----

// esc() cannot stop a bare "@channel" or naked URL in remote metric metadata from being
// auto-parsed inside mrkdwn (those need no <> tokens): every mrkdwn object in the payload must
// therefore opt out via verbatim:true, across every block shape.
test( 'every mrkdwn object in the payload sets verbatim (no Slack auto-parsing)', async () => {
	for ( const scenario of [ 'confirmed', 'reverted', 'pending', 'stale-one' ] ) {
		const r = await runDigest( scenario );
		const payload = JSON.parse( r.out.slice( r.out.indexOf( '{' ) ) );
		const texts = [];
		for ( const b of payload.blocks ) {
			if ( b.text ) texts.push( b.text );
			for ( const el of b.elements || [] ) texts.push( el );
		}
		const mrk = texts.filter( t => t.type === 'mrkdwn' );
		assert.ok( mrk.length > 0, `${ scenario }: payload has mrkdwn objects` );
		for ( const t of mrk ) {
			assert.strictEqual( t.verbatim, true, `${ scenario }: ${ t.text.slice( 0, 60 ) }` );
		}
	}
} );

// The top-level text is the notification/screen-reader surface (Slack's accessibility contract
// reads it, not the blocks): it must name late-confirmed alerts too, opt out of mrkdwn parsing,
// and never grow link previews under the bot identity.
test( 'notification fallback names late-confirmed regressions and disables mrkdwn/unfurls', async () => {
	const late = await runDigest( 'late' );
	const payload = JSON.parse( late.out.slice( late.out.indexOf( '{' ) ) );
	assert.strictEqual( payload.mrkdwn, false );
	assert.strictEqual( payload.unfurl_links, false );
	assert.strictEqual( payload.unfurl_media, false );
	assert.ok( payload.text.includes( '1 late-confirmed: Alpha: TTFB' ), payload.text );
	// Asserted on payload.text itself, not the whole serialized output, so a block naming the
	// metric can never satisfy this in the fallback's place.
	const current = await runDigest( 'confirmed' );
	const p2 = JSON.parse( current.out.slice( current.out.indexOf( '{' ) ) );
	assert.ok( p2.text.includes( 'Alpha: TTFB +15.0%' ), p2.text );
} );

// The catch around chat.postMessage must be total: a null/primitive throw must not TypeError
// inside the catch, and a crafted multi-line message must collapse to one line so it can never
// forge the watchdog's standalone "posted" marker.
test( 'live post: hostile throw shapes stay one line and never forge the posted marker', async () => {
	for ( const thrown of [ null, new Error( 'boom\nposted' ) ] ) {
		const api = await startMockApi( 'clean', {} );
		class ThrowingClient {
			constructor() {
				this.chat = {
					postMessage: async () => {
						throw thrown;
					},
				};
			}
		}
		try {
			const { result, out, err } = await captureConsole( () =>
				main( {
					env: {
						DRY_RUN: '',
						CODEVITALS_EVOLUTION_URL: api.url,
						SLACK_TOKEN: 'xoxb-test',
						SLACK_CHANNEL_ID: 'C123',
					},
					WebClientClass: ThrowingClient,
				} )
			);
			assert.strictEqual( result, 1, `thrown ${ String( thrown ) }` );
			assert.ok( ! /^posted$/m.test( out ), out );
			assert.ok( ! /^posted$/m.test( err ), err );
			assert.ok(
				err.split( '\n' ).some( l => l.startsWith( 'Slack post failed:' ) ),
				err
			);
		} finally {
			await api.close();
		}
	}
} );

// ---- configuration surface ----

test( 'CODEVITALS_EVOLUTION_URL is required, https-only, and loopback-http-only for tests', async () => {
	// Userinfo is rejected up front: Node's fetch error for a credentialed URL CONTAINS the full
	// URL, and errMsg() would carry the password into stderr and the Slack block.
	for ( const bad of [
		undefined,
		'',
		'http://example.com',
		'codevitals.example',
		'ftp://x.test',
		'https://user:sup3rsecret@host.test',
		// The setting is documented as an ORIGIN: a query/fragment is a misconfiguration, and a
		// query is where a pasted credential would land and echo from error text.
		'https://cv.example/api?token=s3kr3t',
		'https://cv.example/api#frag',
		// Dot path segments survive the character regex but re-target every request; an
		// out-of-range port fails WHATWG parsing (and Node's error would echo the URL).
		'https://cv.example/a/../b',
		'https://cv.example/x/..',
		'https://host.test:99999',
	] ) {
		const env = { DRY_RUN: '1' };
		if ( bad !== undefined ) {
			env.CODEVITALS_EVOLUTION_URL = bad;
		}
		const { result, err } = await captureConsole( () => main( { env } ) );
		assert.strictEqual( result, 1, `value ${ JSON.stringify( bad ) } must be rejected` );
		assert.ok( err.includes( 'CODEVITALS_EVOLUTION_URL' ), err );
	}
} );

test( 'CODEVITALS_URL (chart base) rejects mrkdwn metacharacters, http, and userinfo', async () => {
	// The chart base lands raw inside a mrkdwn link: a | or <> in a NON-secret build parameter
	// could otherwise smuggle a phishing label or <!channel> into the digest.
	for ( const bad of [
		'https://evil.example|phish><!channel>',
		'http://x.test',
		'https://user:pw@host.test',
		'https://charts.example/base?sig=s3kr3t',
		'https://charts.example/base#frag',
		// A traversal segment would silently re-target every rendered chart link.
		'https://evil.example.com/phish/../..',
		'https://charts.example:99999',
	] ) {
		const r = await runDigest( 'clean', { CODEVITALS_URL: bad } );
		assert.strictEqual( r.code, 1, `value ${ JSON.stringify( bad ) } must be rejected` );
		assert.ok( r.err.includes( 'CODEVITALS_URL' ), r.err );
	}
} );

test( 'repo, branch, and chart base are env-driven and land encoded in every URL', async () => {
	const r = await runDigest( 'confirmed', {
		CODEVITALS_REPO: 'Acme-Co/widgets.js',
		CODEVITALS_BRANCH: 'main',
		CODEVITALS_URL: 'https://vitals.example.com/',
	} );
	assert.strictEqual( r.code, 0, r.err );
	assert.ok(
		r.requests.includes( '/api/repos/Acme-Co/widgets.js/metrics' ),
		r.requests.join( '\n' )
	);
	assert.ok(
		r.requests.includes(
			'/api/repos/Acme-Co/widgets.js/perf/evolution/301?branch=main&limit=1000'
		),
		r.requests.join( '\n' )
	);
	assert.ok( r.out.includes( 'Widgets.js CodeVitals weekly digest' ) );
	assert.ok( r.out.includes( 'https://github.com/Acme-Co/widgets.js/commit/' ) );
	assert.ok(
		r.out.includes( 'https://vitals.example.com/public/Acme-Co/widgets.js/metrics?metric=' )
	);
	// The dashboard link shares the chart base: an override that re-targets only the charts
	// leaves the header link pointing at the public host.
	assert.ok(
		r.out.includes(
			'https://vitals.example.com/public/Acme-Co/widgets.js/metrics|Open the Widgets.js CodeVitals dashboard'
		),
		r.out
	);
} );

// The repo value builds every commit link and the read path: reject shapes that could escape the
// /api/repos/ prefix (traversal), smuggle mrkdwn/URL structure, or overflow the plain_text
// header, all reachable through a NON-secret build parameter.
test( 'CODEVITALS_REPO rejects traversal, spaces, and non-owner/name shapes', async () => {
	for ( const bad of [
		'Acme Co/widgets', // space — would need encoding and can smuggle structure
		'../../evil', // traversal off the /api/repos/ prefix
		'Automattic/../evil',
		'Automattic/jetpack/extra', // not owner/name
		'single-segment',
		'a'.repeat( 70 ) + '/repo', // overflows the owner bound
		'a/...', // all-dots segments are traversal-shaped, not a repo name
		'.../x',
	] ) {
		const r = await runDigest( 'clean', { CODEVITALS_REPO: bad } );
		assert.strictEqual( r.code, 1, `value ${ JSON.stringify( bad ) } must be rejected` );
		assert.ok( r.err.includes( 'CODEVITALS_REPO' ), r.err );
	}
} );

test( 'defaults: Automattic/jetpack on trunk with the public chart base', async () => {
	const r = await runDigest( 'confirmed' );
	assert.strictEqual( r.code, 0, r.err );
	assert.ok(
		r.requests.includes( '/api/repos/Automattic/jetpack/metrics' ),
		r.requests.join( '\n' )
	);
	assert.ok(
		r.requests.includes(
			'/api/repos/Automattic/jetpack/perf/evolution/301?branch=trunk&limit=1000'
		),
		r.requests.join( '\n' )
	);
	assert.ok( r.out.includes( 'Jetpack CodeVitals weekly digest' ) );
	assert.ok( r.out.includes( 'https://codevitals.run/public/Automattic/jetpack/metrics?metric=' ) );
} );

// A header block is plain_text only, so the dashboard link rides in a context block under it.
// Asserted on a clean week as well as a regressing one: the clean digest carries no commit or
// chart links, so this is the only way out of the message and the easiest one to lose.
test( 'the dashboard link sits under the header, clean week included', async () => {
	for ( const scenario of [ 'clean', 'confirmed' ] ) {
		const r = await runDigest( scenario );
		const payload = JSON.parse( r.out.slice( r.out.indexOf( '{' ) ) );
		assert.strictEqual( payload.blocks[ 0 ].type, 'header', scenario );
		const link = payload.blocks[ 1 ]?.elements?.[ 0 ];
		assert.strictEqual( link?.type, 'mrkdwn', scenario );
		assert.strictEqual(
			link.text,
			'📈 <https://codevitals.run/public/Automattic/jetpack/metrics|Open the Jetpack CodeVitals dashboard>',
			scenario
		);
	}
} );

// Slack rejects a >50-block message outright, so the worst week is the one that loses the whole
// digest. MAX_LINES is hand-audited against the wrapper blocks around it; this pins that
// arithmetic by rendering every wrapper at once. Asserted as an exact count rather than a
// ceiling, so that BOTH a new wrapper block and a raised MAX_LINES have to come back through
// this test and re-count, not just the ones that happen to cross 50.
test( 'the worst week stays inside the 50-block Slack ceiling', async () => {
	const r = await runDigest( 'blockflood' );
	assert.strictEqual( r.code, 1, r.err ); // degraded signal: read failure, dropped id, malformed, stale
	const payload = JSON.parse( r.out.slice( r.out.indexOf( '{' ) ) );
	const texts = payload.blocks.map( b =>
		b.text ? b.text.text : b.elements.map( e => e.text ).join( ' ' )
	);
	// Every wrapper the budget accounts for must actually be in this render, or the count below
	// passes while silently exercising fewer of them than the audit claims.
	for ( const needle of [
		'CodeVitals — weekly digest', // header
		'Open the Jetpack CodeVitals dashboard',
		'Could not read metric 500',
		'did not look numeric',
		'Skipped malformed data point',
		'*Stale metric',
		'sustained regressions* in the last',
		'more — see the metric charts',
		'late-confirmed regression',
		'awaiting confirmation',
		'suppressed (flag did not hold',
	] ) {
		assert.ok(
			texts.some( t => t.includes( needle ) ),
			`${ needle } missing from:\n${ texts.join( '\n' ) }`
		);
	}
	// 35 regression lines + these 11 wrappers = 46, four blocks below Slack's hard 50. The
	// headroom is deliberate: it is the margin a future wrapper block can be added into without
	// the digest silently becoming unpostable in exactly the week it matters most.
	assert.strictEqual( payload.blocks.length, 46, texts.join( '\n' ) );
	assert.ok( payload.blocks.length <= 50, 'Slack rejects a message over 50 blocks' );
} );

// ---- direct invocation (child processes on purpose: the exit-code contract itself) ----

// A hung child must fail this test, never hang the whole repo-wide CI test job.
test(
	'direct invocation runs main() and propagates the exit code',
	{ timeout: 60000 },
	async () => {
		// Misconfigured: the missing read-API origin must exit 1 before any network.
		const bad = spawnSync( process.execPath, [ SCRIPT ], {
			env: { ...process.env, CODEVITALS_EVOLUTION_URL: '', DRY_RUN: '1' },
			encoding: 'utf8',
		} );
		assert.strictEqual( bad.status, 1, bad.stderr );
		assert.ok( bad.stderr.includes( 'CODEVITALS_EVOLUTION_URL' ), bad.stderr );

		// Clean run against the mock: exit 0 with the green heartbeat. The child must run via
		// async spawn — spawnSync would block this process's event loop, and with it the
		// in-process mock server the child needs to reach.
		const api = await startMockApi( 'clean' );
		try {
			const ok = await new Promise( resolve => {
				const child = spawn( process.execPath, [ SCRIPT ], {
					env: {
						...process.env,
						CODEVITALS_EVOLUTION_URL: api.url,
						DRY_RUN: '1',
						CODEVITALS_REPO: '',
						CODEVITALS_BRANCH: '',
						CODEVITALS_URL: '',
						METRIC_IDS: '',
						WINDOW_DAYS: '',
						STALENESS_DAYS: '',
						SLACK_TOKEN: '',
						SLACK_CHANNEL_ID: '',
					},
				} );
				let stdout = '';
				let stderr = '';
				child.stdout.on( 'data', d => ( stdout += d ) );
				child.stderr.on( 'data', d => ( stderr += d ) );
				child.on( 'close', status => resolve( { status, stdout, stderr } ) );
				// A spawn failure emits 'error' and may never emit 'close': surface it as a
				// failed run instead of leaving the promise pending forever.
				child.on( 'error', e => resolve( { status: -1, stdout, stderr: String( e ) } ) );
			} );
			assert.strictEqual( ok.status, 0, ok.stderr );
			assert.ok( ok.stdout.includes( 'No sustained metric regressions' ), ok.stdout );
		} finally {
			await api.close();
		}
	}
);
