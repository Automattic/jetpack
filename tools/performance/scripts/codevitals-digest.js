/**
 * Weekly CodeVitals regression digest.
 *
 * Reads a repository's metric inventory and per-metric evolution series from a
 * CodeVitals-compatible read API, judges each regression flag through a
 * confirmation gate, and posts one Slack Block Kit digest: sustained
 * regressions, late confirmations, pending flags, suppressed transient spikes,
 * and pipeline-health warnings.
 *
 * Runs headless on a weekly CI schedule. DRY_RUN=1 prints the exact Slack
 * payload and never posts. Any degraded signal exits non-zero even when the
 * digest posts, so the scheduler sees the problem, not a false-clean
 * heartbeat. Operating notes, gate thresholds, and environment variables:
 * "Weekly Slack digest" in ../README.md.
 */
import { WebClient } from '@slack/web-api';
import { isDirectInvocation } from './post-to-codevitals.js';
import { median } from './stats.js';

// Day-count knobs parse strict decimal only: Number() also accepts hex ("0x10" is 16) and
// exponents, and a finite 1e300 passes a finiteness guard yet silently disables the window or the
// dead-man.
const dayEnv = ( env, name, dflt ) => {
	const raw = ( env[ name ] ?? '' ).trim();
	if ( raw === '' ) {
		return dflt;
	}
	return /^\d+(\.\d+)?$/.test( raw ) ? Number( raw ) : NaN;
};
// Metric names and units are user-edited in the CodeVitals UI: unescaped they can ping <!channel>
// or break mrkdwn links, and an embedded newline could forge a standalone digest line (a fake
// all-clear). Collapse control characters, then escape. errMsg below shares oneLine, so a crafted
// multi-line error can never forge a standalone marker line either.
const oneLine = s => String( s ).replace( /[\r\n\t\v\f\u2028\u2029]+/g, ' ' );
const esc = s =>
	oneLine( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
// String() first: a non-string name/unit (an object from a drifted /metrics contract) has a lying
// .length and would dodge the cap or crash .slice().
const clip = raw => {
	const s = String( raw );
	return s.length > 120 ? s.slice( 0, 119 ) + '…' : s; // keeps any single section far below Slack's 3000-char cap
};
// verbatim:true stops Slack auto-parsing inside mrkdwn: esc() cannot stop a bare "@channel" or a
// naked URL in a metric name from becoming a live mention or link, because those need no <>
// tokens. Explicit <url|label> links still render. Every mrkdwn sink uses these builders, so the
// rule cannot drift.
const mrkdwn = text => ( { type: 'mrkdwn', text, verbatim: true } );
const section = text => ( { type: 'section', text: mrkdwn( text ) } );
// stats.js median returns 0 for an empty array. Both consumers guard it: the gate's `pre > 0`
// sends an empty window down the same fail-open report path as a NaN (an empty window must report
// the flag, never suppress it), and the render's `pre > 0` keeps a fabricated "med 0→…" baseline
// out of the message.
const fmt = v => ( Number.isInteger( v ) ? String( v ) : Number( v ).toFixed( 1 ) );
const pctStr = p => {
	const n = Number( p );
	return Number.isFinite( n ) ? `${ n >= 0 ? '+' : '' }${ n.toFixed( 1 ) }%` : null;
}; // a non-numeric regressionPercent must never render as literal "+NaN%", and a negative one never as "+-5.3%"
// Both URL knobs get this structural check on top of their character regexes: the value must
// WHATWG-parse (an out-of-range port would otherwise leak the full configured URL through Node's
// error text) and must carry no literal "." or ".." path segment. new URL() NORMALIZES dot
// segments away, so the RAW string is tested; a traversal segment would silently re-target every
// rendered chart and commit link. The HOST is deliberately not allow-listed: which deployment
// serves the data is trusted CI configuration (see the README), not this script's decision.
const urlUnusable = u => {
	try {
		void new URL( u ); // parse for the throw only — unparseable input is unusable
		return /\/\.{1,2}(\/|$)/.test( u );
	} catch {
		return true;
	}
};
// /metrics createdAt is a NAIVE "YYYY-MM-DD HH:MM:SS" (UTC). Bare Date.parse shifts it by the
// agent's timezone (4h skew under TZ=America/New_York): normalize.
const parseCreated = s =>
	Date.parse(
		String( s || '' )
			.trim()
			.replace( ' ', 'T' ) + ( /[zZ]|[+-]\d\d:?\d\d$/.test( String( s || '' ).trim() ) ? '' : 'Z' )
	);

/**
 * Build and (unless DRY_RUN) post the digest.
 *
 * All configuration is read from `env` and all output goes through the console,
 * so tests can run the full flow in-process with a mock read API and an
 * injected Slack client, and assert the exit-code contract directly.
 *
 * @param {object}   [opts]                - Dependency injection for tests.
 * @param {object}   [opts.env]            - Environment map (default process.env).
 * @param {Function} [opts.WebClientClass] - Slack WebClient constructor (default the real SDK).
 * @return {Promise<number>} Process exit code (0 clean, 1 degraded/failed).
 */
async function main( { env = process.env, WebClientClass = WebClient } = {} ) {
	// The read API origin is required and validated: a deleted or renamed setting, or an http://
	// downgrade, must fail loudly here. Plain http is allowed for loopback only, so tests can
	// serve a local mock. Userinfo and mrkdwn metacharacters are rejected like the chart base
	// below: Node's fetch refuses credential-bearing URLs with an error that CONTAINS the full
	// URL, and errMsg() would carry it, password included, into stderr and the Slack failure
	// block.
	const API = ( env.CODEVITALS_EVOLUTION_URL || '' ).trim().replace( /\/+$/, '' );
	if (
		( ! /^https:\/\/[^\s<>|@?#]+$/.test( API ) &&
			! /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test( API ) ) ||
		urlUnusable( API )
	) {
		console.error(
			'CODEVITALS_EVOLUTION_URL must be set to the https origin of the CodeVitals read API — parseable, without <, >, |, ?, #, userinfo or "."/".." path segments (plain http is allowed for loopback testing only)'
		);
		return 1;
	}
	// METRIC_IDS is an OVERRIDE, not the primary contract: left empty, the id set is
	// auto-discovered from /metrics. An explicit allow-list goes stale as metrics are added or
	// recreated under new ids, and a stale list is a false-clean heartbeat, the exact failure
	// this digest exists to catch. Set it only to test or to emergency-mute an id.
	const METRIC_IDS_OVERRIDE = [
		...new Set(
			( env.METRIC_IDS || '' )
				.split( ',' )
				.map( s => s.trim() )
				.filter( Boolean )
		),
	];
	if (
		METRIC_IDS_OVERRIDE.length > 0 &&
		! METRIC_IDS_OVERRIDE.every( id => /^[0-9]+$/.test( id ) )
	) {
		console.error( `METRIC_IDS must be numeric ids, got: ${ METRIC_IDS_OVERRIDE.join( ', ' ) }` );
		return 1;
	}
	// WINDOW_DAYS default: measuredAt is COMMIT time and measurement runs as a weekly batch, so
	// at digest time the fresh batch is days old and the previous one over a week old. 15 covers
	// both batches plus one week of catch-up after a red or skipped digest; the overlap repeats a
	// regression across two digests (same hash), which beats losing it.
	const WINDOW_DAYS = dayEnv( env, 'WINDOW_DAYS', 15 );
	// STALENESS_DAYS default: a dead-man switch for a weekly Monday digest over a weekend
	// measurement batch. The newest healthy point is ~2-3d old and one missed batch leaves it
	// ~9-10d, so 8 fires on the FIRST miss without false-alarming on a batch that slips a day.
	const STALENESS_DAYS = dayEnv( env, 'STALENESS_DAYS', 8 );
	// dayEnv already rejects hex, exponent, and sign forms. The range guard rejects
	// window-disabling magnitudes BOTH ways: a sub-day window (0.5) turns a weekly digest over a
	// weekly measurement batch into a permanent green heartbeat, and 10 years is beyond any sane
	// look-back.
	if (
		! Number.isFinite( WINDOW_DAYS ) ||
		! ( WINDOW_DAYS >= 1 ) ||
		WINDOW_DAYS > 3650 ||
		! Number.isFinite( STALENESS_DAYS ) ||
		! ( STALENESS_DAYS >= 0 ) ||
		STALENESS_DAYS > 3650
	) {
		console.error(
			'WINDOW_DAYS must be a plain decimal in [1, 3650] and STALENESS_DAYS a plain decimal in [0, 3650]'
		);
		return 1;
	}

	const CHART_BASE =
		( env.CODEVITALS_URL || '' ).trim().replace( /\/+$/, '' ) || 'https://codevitals.run';
	// The chart base lands in mrkdwn links, so unlike the read origin it must also be free of
	// mrkdwn metacharacters: a | (closes a link label) or <> (opens a token) in this NON-secret
	// build parameter could smuggle a phishing label or a <!channel> broadcast into the digest,
	// and userinfo would leak into links. urlUnusable() adds the same parse and dot-segment
	// rejection the read origin gets, so a traversal like https://host/x/../.. cannot re-target
	// the chart links. The host itself stays deployment configuration (see urlUnusable).
	if ( ! /^https:\/\/[^\s<>|@?#]+$/.test( CHART_BASE ) || urlUnusable( CHART_BASE ) ) {
		console.error(
			'CODEVITALS_URL (the chart-link base) must be a parseable https URL without spaces, <, >, |, ?, #, userinfo or "."/".." path segments'
		);
		return 1;
	}
	const REPO = ( env.CODEVITALS_REPO || '' ).trim() || 'Automattic/jetpack';
	// The repo value lands in every commit link, the header, and the read-API URL path. The
	// owner/name shape check blocks path traversal (any all-dots segment, "..." included) and
	// header-overflowing values arriving through a NON-secret build parameter: in a CI scheduler,
	// far more people can override a plain parameter than can read secrets. It does NOT vet the
	// repo itself: any well-formed owner/name is trusted deployment configuration.
	if (
		! /^[A-Za-z0-9._-]{1,64}\/[A-Za-z0-9._-]{1,100}$/.test( REPO ) ||
		/(^|\/)\.+(\/|$)/.test( REPO )
	) {
		console.error(
			'CODEVITALS_REPO must be an owner/name pair using letters, digits, ".", "_" or "-" (e.g. Automattic/jetpack)'
		);
		return 1;
	}
	// Repo segments land in URL paths: encode them (defense in depth behind the shape check),
	// never double-encode.
	const repoPath = REPO.split( '/' ).map( encodeURIComponent ).join( '/' );
	const repoName = REPO.split( '/' ).pop() || REPO;
	const repoTitle = repoName.charAt( 0 ).toUpperCase() + repoName.slice( 1 );
	const BRANCH = ( env.CODEVITALS_BRANCH || '' ).trim() || 'trunk';
	// Token and channel are trimmed like DRY_RUN (a pasted trailing space must take the loud
	// misconfig path, not a bare invalid_auth/channel_not_found). A CI secret placeholder (any
	// all-asterisk value) counts as unset.
	const rawToken = ( env.SLACK_TOKEN || '' ).trim();
	const TOKEN = /^\*+$/.test( rawToken ) ? '' : rawToken;
	const CHANNEL = ( env.SLACK_CHANNEL_ID || '' ).trim();
	const DRY_RUN = /^(1|true|yes)$/i.test( ( env.DRY_RUN || '' ).trim() ); // trimmed: a pasted "true " must still never post live
	const MAX_LINES = 35; // Slack rejects >50 blocks/message; 35 lines + the 11 wrapper blocks around them = 46, leaving 4 blocks of headroom (pinned by the 'worst week' test)
	// LIMIT is a newest-N slice. Numeric limits NEVER set meta.isDownsampled (the server computes
	// it from the slice length, so it is structurally false here) and silently drop the OLDEST
	// points, the window edge. 1000 is ~5x the observed 15-day volume; the coverage assertion
	// below is the real clip defense. Never limit=all: it LTTB-downsamples above 400 points and
	// can drop a regression.
	const LIMIT = 1000;

	let exitCode = 0;
	const now = Date.now();
	const windowMs = WINDOW_DAYS * 864e5;
	// Flags are JUDGED over a 2x look-back but reported as "late" beyond the window: a backfilled
	// batch whose commits predate the window, or a pending flag orphaned by a skipped batch, must
	// not fall out unjudged.
	const detectMs = 2 * windowMs;
	const SKEW_MS = 864e5; // clock-skew allowance; a further-future measuredAt is malformed data, and one such point would pin the staleness clock into the future
	const commitLink = h => `<https://github.com/${ repoPath }/commit/${ h }|${ h.slice( 0, 8 ) }>`;
	// The repo's public metrics page — the anonymous CodeVitals route (`/repos/:owner/:repo` is
	// the authenticated one, useless in a channel link).
	const dashboardUrl = `${ CHART_BASE }/public/${ repoPath }/metrics`;
	const chartUrl = k => `${ dashboardUrl }?metric=${ encodeURIComponent( k ) }`;
	const get = url => fetch( url, { redirect: 'error', signal: AbortSignal.timeout( 30000 ) } ); // a hung API must fail the build, not park the agent — and a redirect off the validated origin (e.g. an https→http downgrade) must fail loud, never be followed silently
	// undici buries the useful failure reason in error.cause ("unexpected redirect" from a
	// misconfigured origin: www.codevitals.run 301s the API). Without it every network failure
	// reads as a bare "fetch failed", indistinguishable from DNS or TLS.
	const errMsg = e =>
		oneLine( e?.cause?.message ? `${ e.message } (${ e.cause.message })` : e.message );

	// ---- metric inventory: id discovery + name/key/unit labels ----
	// With no METRIC_IDS override this lookup is LOAD-BEARING (it enumerates what we watch), so
	// its failure is a loud digest-level failure, never a silent shrink to nothing. With an
	// override it degrades to cosmetic (labels fall back to ids).
	let metaById = new Map();
	let discoveryError = '';
	try {
		// /metrics returns the FULL inventory as one flat array, no pagination (verified live: no
		// total/has_more/Link fields).
		const metaResp = await get( `${ API }/api/repos/${ repoPath }/metrics` );
		if ( ! metaResp.ok ) throw new Error( `HTTP ${ metaResp.status }` );
		const rows = await metaResp.json();
		if ( ! Array.isArray( rows ) )
			throw new Error(
				'non-array /metrics response (a misconfigured CODEVITALS_EVOLUTION_URL serves the SPA HTML here)'
			);
		metaById = new Map( rows.map( m => [ String( m.id ), m ] ) );
	} catch ( e ) {
		discoveryError = errMsg( e );
		console.error( `metrics lookup failed: ${ discoveryError }` );
	}
	const label = id => {
		const m = metaById.get( String( id ) ) || {};
		return esc( clip( m.name || m.key || `metric ${ id }` ) );
	};

	let metricIds;
	let droppedIds = 0;
	if ( METRIC_IDS_OVERRIDE.length > 0 ) {
		metricIds = METRIC_IDS_OVERRIDE;
		if ( discoveryError ) console.error( '(names fall back to ids)' );
	} else if ( ! discoveryError ) {
		// Ids land in a URL path: a non-numeric id from a drifted contract must not pass through.
		metricIds = [ ...metaById.keys() ]
			.filter( id => /^[0-9]+$/.test( id ) )
			.sort( ( a, b ) => Number( a ) - Number( b ) );
		droppedIds = metaById.size - metricIds.length;
		// A dropped id is a metric that silently left the watch list, the exact false-clean
		// failure auto-discovery exists to prevent: it must warn in the message and redden the
		// build, not just whisper to stderr.
		if ( droppedIds > 0 )
			console.error(
				`${ droppedIds } discovered metric id(s) were non-numeric — dropped (API contract drift?)`
			);
	}
	const discoveryFailed = ! metricIds || metricIds.length === 0;

	const confirmed = []; // in-window regressions that held after the flagged commit
	const confirmedLate = []; // regressions older than the window whose confirmation only completed now (backfill/recovery)
	const pending = []; // regressions at the data edge — too few later points to judge yet
	const reverted = []; // regression flags (in-window OR late) that reverted within the next commits — transient spikes, suppressed but always visible in the context line: a silent verdict channel would also hide a wrong verdict
	const failedIds = []; // metrics whose evolution data could not be read this run
	const badPoints = new Map(); // id -> count of malformed points (null point, unparseable/far-future measuredAt, non-finite value)
	const newestByMetric = new Map(); // id -> newest valid measuredAt ms (0 = no valid points)
	const warmingUp = []; // ids younger than STALENESS_DAYS — exempt from the dead-man (a brand-new metric with no data is not a stalled one)
	let agedOutFlags = 0; // flags older than even the 2x look-back — designed silent exit (see below), but the count must not vanish entirely

	for ( const id of discoveryFailed ? [] : metricIds ) {
		let data;
		try {
			const resp = await get(
				`${ API }/api/repos/${ repoPath }/perf/evolution/${ id }?branch=${ encodeURIComponent(
					BRANCH
				) }&limit=${ LIMIT }`
			);
			if ( ! resp.ok ) throw new Error( `HTTP ${ resp.status }` ); // 404 = stale/recreated metric id
			const body = await resp.json();
			if ( body?.meta?.isDownsampled )
				throw new Error(
					'response downsampled (LTTB) — points may be missing; keep the limit numeric, never all'
				);
			data = body.data;
			if ( ! Array.isArray( data ) )
				throw new Error( 'no data[] in response (API contract drift?)' );
			// Silent-clip defense: a full slice whose oldest point is still inside the window
			// means the window's oldest points were dropped upstream with NO downsample flag (and
			// the server's detector stamps its slice-boundary point isRegression:false).
			if ( data.length >= LIMIT ) {
				const oldestT = Date.parse( data[ 0 ]?.measuredAt );
				if ( ! Number.isFinite( oldestT ) || oldestT > now - windowMs ) {
					throw new Error(
						`hit limit=${ LIMIT } with the oldest point still inside the ${ WINDOW_DAYS }d window — window truncated; raise the limit`
					);
				}
				// Late look-back truncation degrades gracefully (stderr only): the primary window
				// is intact, only late confirmations may be incomplete.
				if ( oldestT > now - detectMs )
					console.error(
						`evolution ${ id }: slice covers the ${ WINDOW_DAYS }d window but not the full ${
							2 * WINDOW_DAYS
						}d late look-back — late confirmations may be incomplete`
					);
			}
		} catch ( e ) {
			console.error( `evolution ${ id } -> ${ errMsg( e ) }` );
			failedIds.push( id );
			continue;
		}
		// The server computes isRegression at SERVE time: its detector runs on this exact
		// response, oldest-first, and flags each row against the row immediately before it. The
		// write path stores no flag (verified against the gitaudit server source, routes/perf.js
		// + db/queries.js; the per-metric noise floor only makes flagging stricter). Capture each
		// flagged row's comparison base NOW, before any local reordering: the base row may be a
		// duplicate the dedup below drops (a catch-up re-run reproducing the old baseline), and
		// the gate must still know the value the flag was computed against. Every row also keeps
		// its serve position (sIdx): a flag's evidence is what the server saw before/after it in
		// THIS response, so the gate's windows are built in serve order (see the events loop).
		for ( let i = 0; i < data.length; i++ ) {
			if ( ! data[ i ] ) continue;
			data[ i ].sIdx = i;
			if ( i > 0 && data[ i ].isRegression === true )
				data[ i ].serverFrom = data[ i - 1 ] ? data[ i - 1 ].value : undefined;
		}
		// The server orders rows by measured_at with NO tie-breaker: equal-time rows arrive in
		// arbitrary order, and with re-posts (same commit, same provenanced timestamp) that order
		// silently decides which value the dedup below keeps. Row `id` is server insertion order
		// (an original precedes its re-posts, and a batch lands in the order the poster measured
		// it): sort each equal-measured_at run by id, so the same stored rows always keep the
		// same row and fold the same percent and base. (The gate judges every flag at its serve
		// position — sIdx above — so evidence order follows the response, the same order the
		// server computed the flags in.) Only identical timestamps are reordered, so the
		// oldest-first guard below still catches a server-side ordering flip. A run holding ANY non-integer id keeps its
		// arrival order whole: sorting only the comparable rows is intransitive (the result
		// depends on the arrangement, the very defect this pass removes), and coercing the id
		// (Number(null) is 0) would sort a null-id re-post FIRST to win the dedup below, adopting
		// the duplicate's value.
		for ( let i = 1, s = 0; i <= data.length; i++ ) {
			if (
				i === data.length ||
				! data[ i ] ||
				! data[ s ] ||
				data[ i ].measuredAt !== data[ s ].measuredAt
			) {
				if ( i - s > 1 ) {
					const run = data.slice( s, i );
					if ( run.every( r => Number.isInteger( r?.id ) ) )
						run.sort( ( a, b ) => a.id - b.id ).forEach( ( r, k ) => ( data[ s + k ] = r ) );
				}
				s = i;
			}
		}
		// Validate every point first; the confirmation medians below must see the full valid
		// series.
		const pts = [];
		// Re-run measurement builds APPEND a second row for an already-measured commit
		// (write-side dedup is opt-in and off; the server has no uniqueness constraint), and a
		// re-run without git provenance is stamped with run time, landing an old commit's value
		// at the newest end. The gate below identifies commits positionally (pre/post windows,
		// the later-commit count, the pre-flag anchor), so duplicate rows corrupt every verdict:
		// keep each commit's FIRST row (after the id tie-sort above, the original measurement) in
		// its historical slot, its VALUE untouched. NO duplicate's value ever enters the series;
		// any rule that lets one in (adopting it, min-wins, max-wins, or keeping the row as its
		// own entry) is fail-open somewhere in the window. But the server flags ROWS, not
		// commits, so a flag riding on a duplicate must never vanish unread:
		//  - SAME measured_at as its original (a provenanced re-post): the flag and its percent
		//    transfer onto the kept row; the gate still judges the event at each folded flag's
		//    own serve position (fIdxs). Across several such rows the LARGEST percent wins
		//    (order-independent); the flagged value is carried separately (flagV) for display
		//    only.
		//  - DIFFERENT time (a run-time-stamped re-run): the flag is judged at its own serve
		//    position against the kept series (offFlags below); the re-run row never renews the
		//    staleness clock. Relocated onto the original's slot instead, it would be judged
		//    against windows weeks old: a "transient" verdict on a live regression, exit 0.
		// The dedup only sees the fetched slice, so a duplicate whose original fell off the slice
		// edge goes unrecognized. Routine re-runs stay stderr-only.
		const keptByHash = new Map();
		const offFlags = [];
		let dupRows = 0;
		let dupFlagged = 0;
		// The staleness clock counts KEPT rows only: a duplicate measures nothing new, so a
		// pipeline that re-posts an already-measured commit for weeks IS stalled, and counting
		// raw rows would let re-runs renew the dead-man forever (a false clean). The ordering
		// guard, by contrast, runs on RAW rows: a duplicate-hash row must not absorb an ordering
		// violation into a silent drop. Only past-dated points feed the clock: a FUTURE-dated
		// point inside the skew allowance would read as age ~0 and buy a stalled pipeline extra
		// green cycles. Freshness must be earned by a real, past-dated measurement.
		let newest = 0;
		let prevT = -Infinity;
		let orderBroken = false;
		for ( const p of data ) {
			const t = p ? Date.parse( p.measuredAt ) : NaN;
			// Judge on `value`: the server computes isRegression/regressionPercent on the
			// NORMALIZED value, so the gate must live in the same numeric domain. The raw domain
			// is no fallback: the schema declares value NOT NULL, so a missing or null value is
			// contract-broken data that must fail loud, never silently switch the gate to
			// rawValue (where a server-flagged regression could read as flat).
			const v = p ? p.value : NaN;
			const badHash = ! p || typeof p.hash !== 'string' || ! /^[0-9a-f]{40}$/i.test( p.hash ); // the hash lands in a Slack link — a crafted one could inject <!channel> or a hostile URL — and a non-string (e.g. an array) would pass RegExp coercion only to crash the dedup below
			// A legit single-point response may OMIT the flag, but a present flag must be a real
			// boolean on any series: a singleton with isRegression:"false" is contract drift and
			// would otherwise fabricate a pending flag via truthiness.
			const badFlag =
				p &&
				typeof p.isRegression !== 'boolean' &&
				! ( data.length === 1 && p.isRegression === undefined );
			const badVal = typeof v !== 'number' || ! Number.isFinite( v ); // Number(null)=0 fails CLOSED through the gate (post median 0 => "reverted"), suppressing a real regression; and a string value would land unescaped in the from→to render
			if ( ! Number.isFinite( t ) || t > now + SKEW_MS || badHash || badFlag || badVal ) {
				// A skipped point may be a regression: warning + red build, never a silent vanish
				// into a clean heartbeat.
				const n = ( badPoints.get( id ) || 0 ) + 1;
				badPoints.set( id, n );
				// The writer posts the literal hash "unknown" when a measurement workspace has no
				// git metadata: same degraded outcome (skipped + red), but the log names the real
				// cause, missing provenance.
				if ( n <= 5 )
					console.error(
						p && p.hash === 'unknown'
							? `metric ${ id }: point has no commit provenance (hash "unknown" — the measurement workspace lost its git metadata) — skipped`
							: `metric ${ id }: malformed point (measuredAt ${ JSON.stringify(
									p && p.measuredAt
							  ) }, hash ${ JSON.stringify( p && p.hash ) }, isRegression ${ JSON.stringify(
									p && p.isRegression
							  ) }, value ${ JSON.stringify( p && p.value ) }) — skipped`
					);
				else if ( n === 6 )
					console.error(
						`metric ${ id }: further malformed points suppressed from the log (full count still reported in the digest)`
					);
				continue;
			}
			// The gate's prev/next windows assume oldest-first ordering (verified against the
			// live server). A silent server-side ordering flip would invert pre/post and misjudge
			// every flag: treat it as unreadable data, not a guess.
			if ( t < prevT ) {
				orderBroken = true;
				break;
			}
			prevT = t;
			const h = p.hash.toLowerCase();
			const kept = keptByHash.get( h );
			if ( kept ) {
				dupRows++;
				if ( p.isRegression === true ) {
					dupFlagged++;
					if ( t === kept.t ) {
						const pct = Number( p.regressionPercent );
						// Both flags fold into one event, so suppression must clear EVERY flag
						// folded in, whichever percent wins below. Record each folded flag's own
						// serve position (the gate judges the event at all of them) and keep the
						// lower base (a percent is not comparable across bases, and a re-post
						// flagged against the kept row itself carries the plateau as its base).
						kept.fIdxs = (
							kept.fIdxs ?? ( kept.p.isRegression === true ? [ kept.p.sIdx ] : [] )
						).concat( p.sIdx );
						const serverFrom =
							kept.p.isRegression === true
								? Math.min( Number( kept.p.serverFrom ), Number( p.serverFrom ) )
								: p.serverFrom;
						// ! ( keptPct >= pct ), not ( pct > keptPct ): a non-finite kept percent
						// must lose to a finite one, never survive by failing both comparisons.
						if (
							kept.p.isRegression !== true ||
							( Number.isFinite( pct ) && ! ( Number( kept.p.regressionPercent ) >= pct ) )
						) {
							kept.p = {
								...kept.p,
								isRegression: true,
								regressionPercent: p.regressionPercent,
								serverFrom,
							};
							kept.flagV = v;
						} else kept.p.serverFrom = serverFrom;
					} else {
						// Judged at its own serve position below; the value stays out of the series.
						offFlags.push( { t, p, v } );
					}
				}
				continue;
			}
			const rec = { t, p, v };
			if ( t <= now ) newest = Math.max( newest, t );
			keptByHash.set( h, rec );
			pts.push( rec );
		}
		if ( orderBroken ) {
			console.error( `evolution ${ id } -> data not oldest-first (server ordering changed?)` );
			failedIds.push( id );
			continue;
		}
		if ( dupRows > 0 )
			console.error(
				`metric ${ id }: dropped ${ dupRows } duplicate row(s) for already-measured commit(s) — re-run builds append rows (write-side dedup is off); keeping each commit's first measurement${
					dupFlagged > 0
						? `; ${ dupFlagged } carried a regression flag — transferred to the kept row (same-time re-post) or judged at its own serve position (later re-run), never as a series value`
						: ''
				}`
			);
		newestByMetric.set( id, newest );
		// The kept rows in SERVE order: the id tie-sort above may have moved equal-time rows,
		// and every flag's windows below are built around its position in the response.
		const byServe = [ ...pts ].sort( ( a, b ) => a.p.sIdx - b.p.sIdx );
		// Flag events to judge: a kept row's own (possibly transferred) flag, or an off-time
		// re-run flag riding on a dropped row. Every flag is judged at its serve position(s)
		// below; `self` only decides whose numbers the entry displays and which anchors apply.
		// Own flags are judged first, and only REPORTING verdicts (pending/confirmed) claim a
		// commit against later re-run flags. A reverted own flag deliberately does not: it must
		// leave the door open for an independent later flag on the same commit, or a live
		// re-landed regression renders as the green tick.
		// A commit can carry SEVERAL off-time re-run flags (a batch re-posting an old commit
		// more than once). They merge into ONE event judged at every sibling's serve position
		// under the lowest base (the strictest server anchor) — or the first sibling judged
		// would claim the commit (reportedHashes below) while another with conclusive held
		// evidence went unread: a pending verdict behind the green tick, decided by the tie's
		// arbitrary listing order. The entry renders the sibling at the DECIDING position: the
		// merge's worst percent or newest time can belong to a sibling whose own position
		// recovered, and would render a weeks-old hold as a fresh, larger regression.
		const offByHash = new Map();
		for ( const f of offFlags ) {
			// An aged-out sibling stays OUT of the merge: merged in, any fresh re-run would
			// resurrect evidence from beyond the look-back — a window weeks stale rendered as a
			// current alert, and a break of the bounded-lifetime rule (aged flags exit, judged
			// by past digests). It still counts toward the stderr aged-flags line, per FLAG —
			// that count is the only signal that the digest was down longer than the look-back.
			if ( now - f.t > detectMs ) {
				agedOutFlags++;
				continue;
			}
			const h = f.p.hash.toLowerCase();
			const g = offByHash.get( h );
			if ( ! g ) {
				offByHash.set( h, { ...f, sibs: [ f ] } );
				continue;
			}
			g.sibs.push( f );
			g.p = { ...g.p, serverFrom: Math.min( Number( g.p.serverFrom ), Number( f.p.serverFrom ) ) };
		}
		const events = [];
		for ( const r of pts ) if ( r.p.isRegression ) events.push( { self: true, ...r } );
		for ( const g of offByHash.values() )
			events.push( { self: false, ...g, fIdxs: g.sibs.map( f => f.p.sIdx ) } );
		const reportedHashes = new Set();
		for ( const ev of events ) {
			const { self, t, p, v, flagV, fIdxs, sibs } = ev;
			if ( now - t > detectMs ) {
				agedOutFlags++; // beyond even the late look-back — counted for stderr, see after the loop
				continue;
			}
			const evHash = p.hash.toLowerCase();
			if ( ! self && reportedHashes.has( evHash ) ) continue;
			// ---- confirmation gate ----
			// Observed flag precision without a gate was 0/3: every flagged point over a month of
			// live data was a one-commit spike that reverted immediately. So a flag becomes an
			// alert only when the metric's median over the NEXT commits holds above the median
			// over the previous ones. Suppression needs positive evidence: any non-finite median
			// reports, and so does a non-positive pre or baseline (a zero or negative value
			// sign-flips the ratio tests below).
			// Every flag's windows are built in SERVE order around the flag's own row (each of
			// fIdxs for a folded event; otherwise the flagged row's sIdx — a dropped re-run's
			// included), excluding the flagged commit's rows BY HASH from both sides: the
			// server's evidence for a flag is the rows before and after it IN THE RESPONSE, and
			// which side the commit's own kept row lands on is decided only by the response's
			// arbitrary equal-time listing order — counting it as evidence lets that order flip
			// the verdict (a held regression filed as transient behind the green tick). A folded
			// event is judged at EVERY folded flag's position: one reporting position forces the
			// alert; a position with too few later rows defers the event (pending) only when no
			// position reports; suppression requires every position to recover.
			//
			// Anchors shared by every window — half 3, re-run flags only: the kept row just
			// before a re-run's judging position is NOT the baseline its commit regressed from.
			// On an already-regressed plateau (every commit unflagged because each is ~0% worse
			// than its neighbour) the windows and the positional anchor all read the plateau
			// itself, and suppression would file the only surviving evidence of a live
			// regression as a transient. So a re-run flag may only be suppressed when the metric
			// ALSO sits back at its commit's own pre-regression level: the kept row's
			// predecessor. No such row (first point, or unresolvable): report, never suppress.
			// (keptByHash holds the same record objects pts does, so the indexOf below resolves
			// by identity.)
			let ownFrom = NaN;
			if ( ! self ) {
				const kIdx = pts.indexOf( keptByHash.get( evHash ) );
				if ( kIdx > 0 ) ownFrom = pts[ kIdx - 1 ].v;
			}
			const ownValid = Number.isFinite( ownFrom ) && ownFrom > 0;
			// ...half 4, every flag: the server computed this flag against the row immediately
			// before it IN THE RESPONSE (serverFrom, captured before the tie-sort), a row the
			// dedup may have dropped. When a catch-up batch first re-runs an old baseline commit
			// (dropped, its value never enters the series) and the next re-run is flagged against
			// it, every kept-series anchor reads the plateau, and suppression would bury the
			// only fresh evidence of a live regression. So suppression also requires the metric
			// to sit back at the server's own comparison base; an unresolvable or non-positive
			// base reports, never suppresses.
			const serverFrom = Number( p.serverFrom );
			const serverValid = Number.isFinite( serverFrom ) && serverFrom > 0;
			const wins = ( fIdxs ?? [ p.sIdx ] ).map( s => {
				const later = [];
				const prior = [];
				for ( const r of byServe )
					if ( r.p.hash.toLowerCase() !== evHash ) ( r.p.sIdx > s ? later : prior ).push( r.v );
				const pre = median( prior.slice( -5 ) );
				const post = median( later.slice( 0, 5 ) );
				const from = prior.length > 0 ? prior[ prior.length - 1 ] : undefined; // the kept value served just before the flag: the revert anchor
				// Suppression evidence half 1: the window medians agree the metric did not rise.
				const medianHeld =
					Number.isFinite( pre ) &&
					pre > 0 &&
					Number.isFinite( post ) &&
					( post - pre ) / pre < 0.05;
				// ...half 2: the metric RETURNED to the level of the commit just before the flag.
				// The pre-window median alone fails after a revert-and-re-land cycle (the window
				// itself sits at the regressed level), and the flagged sample's own value fails
				// as a reference when it overshoots the level the regression settles at (post <
				// v*0.95 held while the metric stayed regressed).
				const anchorValid = Number.isFinite( from ) && from > 0;
				const anchorOk = anchorValid && post <= from * 1.05;
				const ownAnchorOk = self || ( ownValid && post <= ownFrom * 1.05 );
				const serverAnchorOk = serverValid && post <= serverFrom * 1.05;
				let verdict = 'report';
				if ( later.length <= 2 ) {
					verdict = 'pending'; // need >=3 later kept rows at this position for a verdict
				} else if ( medianHeld && anchorOk && ownAnchorOk && serverAnchorOk ) {
					verdict = 'suppress';
				}
				return {
					s,
					pre,
					post,
					from,
					medianHeld,
					anchorValid,
					anchorOk,
					ownAnchorOk,
					serverAnchorOk,
					verdict,
				};
			} );
			const reporting = wins.filter( w => w.verdict === 'report' );
			// The entry renders the deciding window: the reporting one with the highest post
			// median (the strongest held evidence), else the loudest deferring one, else the
			// closest-call suppressed one. Adjacent same-hash siblings see byte-identical
			// windows (own rows are excluded from both sides), so a post tie carries no
			// evidence either way — it breaks toward the loudest render (worst percent, then
			// newest sibling), never the serve order, which would caption whichever sibling the
			// server listed first and flip with its listing order. Recency alone would not do
			// either: adjacent re-runs measure the step and then the increment, so the newest
			// sibling's percent can understate a step regression just as badly as the oldest's.
			const sibOf = w => ( sibs ? sibs[ fIdxs.indexOf( w.s ) ] : ev );
			const pctOf = f => {
				const n = Number( f.p.regressionPercent );
				return Number.isFinite( n ) ? n : -Infinity;
			};
			const loudest = ( a, b ) => {
				const sa = sibOf( a );
				const sb = sibOf( b );
				const pa = pctOf( sa );
				const pb = pctOf( sb );
				if ( pb !== pa ) return pb > pa ? b : a;
				return sb.t > sa.t ? b : a;
			};
			const stronger = ( a, b ) => {
				if ( b.post !== a.post ) return b.post > a.post ? b : a;
				return loudest( a, b );
			};
			// Deferring windows rank on the percent, not on the post median. A window defers
			// because it holds one or two later rows, so its post median is the very evidence the
			// verdict calls too thin — ranking on it first lets the thinnest reading in the digest
			// outvote the percent and caption a held step with a later re-run's increment.
			const deferring = wins.filter( w => w.verdict === 'pending' );
			let win;
			if ( reporting.length > 0 ) win = reporting.reduce( stronger );
			else if ( deferring.length > 0 ) win = deferring.reduce( loudest );
			else win = wins.reduce( stronger ); // all suppressed: the closest call
			const sib = sibOf( win ); // the flag at the deciding position supplies the entry's time and numbers
			const late = now - sib.t > windowMs; // COMMIT older than the window, judged anyway (see detectMs)
			const meta = metaById.get( String( id ) ) || {};
			const entry = {
				id,
				t: sib.t,
				late,
				name: meta.name || meta.key || `metric ${ id }`,
				key: meta.key,
				unit: meta.unit || '',
				hash: p.hash,
				pct: sib.p.regressionPercent, // the server's percent vs the row served just before the flag — for a re-run sibling, possibly this commit's own earlier re-run row
				// `from` — the rendered baseline — is the judging window's (the kept value served
				// just before it), or overridden by the anchor that held the alert up. It matches
				// the server's comparison base (serverFrom) only when no duplicate row was
				// dropped between the two, so from→to need not match the percent.
				from: win.from,
				// Display the value the flag was computed on (a re-post or re-run row's). A
				// re-run flag's percent was computed server-side against a row this series may
				// not even hold, so the "(flag from a re-run)" marker attributes its numbers
				// instead. The gate itself never sees this value; its medians and anchors judge
				// the kept series only.
				to: self ? flagV ?? v : sib.v,
				reRun: self ? fIdxs !== undefined : true, // marks a flag whose event folded in a re-post/re-run row: its numbers or comparison base MAY come from that row (a same-time fold or an off-time merge), so the reader is not shown an attribution the kept data need not support
			};
			if ( win.verdict === 'pending' ) {
				pending.push( entry ); // data edge — re-judged next digest (window rolls, batch fills in)
				reportedHashes.add( evHash );
			} else if ( win.verdict === 'suppress' ) {
				// Transient spike: no folded flag held, the metric sits back at its pre-flag
				// level.
				reverted.push( { ...entry, pre: win.pre, post: win.post } );
			} else {
				// A re-run flag confirmed because only its OWN baseline failed: the local anchor
				// cleared, so render the commit's own baseline. The alert stands on that level;
				// the positional value would read as a self-refuting "holds above" line.
				if ( ! self && win.medianHeld && win.anchorOk && ownValid ) entry.from = ownFrom;
				// A flag confirmed because only the SERVER's comparison base failed: every
				// kept-series anchor cleared, so the alert stands on that base. Render it — for
				// a folded event this is the LOWEST folded base, so the percent shown (a same-time
				// fold's worst flag or an off-time merge's deciding flag, judged against its own
				// base) need not match from→to.
				if ( win.medianHeld && win.anchorOk && win.ownAnchorOk && serverValid )
					entry.from = serverFrom;
				// heldAboveAnchor: the window medians did NOT move, so the alert stands only on
				// an anchor comparison. When that anchor commit is a one-commit dip this shape is
				// indistinguishable from a recovered dip; the gate deliberately resolves the
				// ambiguity toward reporting (fail loud, never false-clean), and the rendered
				// copy says what was compared so a reader can judge it. The anchor that holds the
				// alert up must also be the renderable one: positional when it failed, the re-run
				// commit's own when only IT failed, the server's base when every kept-series
				// anchor cleared.
				let anchorRenderable = win.anchorValid;
				if ( win.anchorOk ) anchorRenderable = win.ownAnchorOk ? serverValid : ownValid;
				( late ? confirmedLate : confirmed ).push( {
					...entry,
					pre: win.pre,
					post: win.post,
					heldAboveAnchor: win.medianHeld && anchorRenderable,
				} );
				reportedHashes.add( evHash );
			}
		}
	}

	// Aged-out flags exit the DIGEST silently by design: the server recomputes flags from the
	// same adjacent rows on every fetch, so an already-alerted regression re-arrives in every
	// response until it crosses the look-back, and any in-message line about them would re-render
	// forever after any real alert (it would redden nothing; the exit predicate never reads the
	// blocks). The count still lands on stderr, because the same path also swallows a flag never
	// reported at all if the digest was down longer than the look-back. Recovery: one catch-up
	// run with WINDOW_DAYS raised.
	if ( agedOutFlags > 0 )
		console.error(
			`${ agedOutFlags } regression flag(s) older than the ${
				2 * WINDOW_DAYS
			}d look-back skipped (judged by past digests — or missed entirely if the digest was down that long; for a catch-up run, raise WINDOW_DAYS)`
		);

	confirmed.sort( ( a, b ) => b.t - a.t ); // newest first, so the MAX_LINES cut drops the oldest, never the latest

	const allFailed = ! discoveryFailed && failedIds.length === metricIds.length;
	// Staleness is PER METRIC: one fresh metric must not mask a silently-dead sibling. A
	// recreated or stalled metric serves HTTP 200 with zero points, exactly the failure mode this
	// digest exists to catch. A metric CREATED inside the threshold is warming up, not stale
	// (otherwise every new metric fires the alarm at birth).
	const staleInfo = [];
	for ( const [ id, newest ] of newestByMetric ) {
		if ( newest === 0 || now - newest > STALENESS_DAYS * 864e5 ) {
			const created = parseCreated( ( metaById.get( String( id ) ) || {} ).createdAt );
			// created <= now + skew: a FUTURE createdAt (bad server clock or drifted contract)
			// must not grant a permanent staleness exemption.
			if (
				newest === 0 &&
				Number.isFinite( created ) &&
				created <= now + SKEW_MS &&
				now - created <= STALENESS_DAYS * 864e5
			) {
				warmingUp.push( id );
				console.error(
					`metric ${ id }: no points yet but created ${ Math.floor(
						( now - created ) / 864e5
					) }d ago — warming up, staleness exempt`
				);
				continue;
			}
			staleInfo.push( { id, days: newest ? Math.floor( ( now - newest ) / 864e5 ) : null } );
		}
	}
	const allStale =
		! allFailed &&
		! discoveryFailed &&
		staleInfo.length > 0 &&
		staleInfo.length === newestByMetric.size - warmingUp.length &&
		newestByMetric.size > warmingUp.length;

	// ---- Block Kit ----
	// The three joined single-block lists below (late / pending / suppressed) hold the 50-block
	// budget by capping ENTRIES, not just characters: the blunt 3000-char clamp at the end would
	// cut entries mid-link while the header still claimed the full count. Cap first and say how
	// many were cut, so header and body agree.
	const MAX_JOINED = 8; // worst-case ~330 chars/entry (120-char clipped name + two links) × 8 ≈ 2650 < 3000
	const joinRows = ( items, rowFn ) => {
		const sorted = [ ...items ].sort( ( a, b ) => b.t - a.t ); // newest first, so the cap drops the oldest
		const shown = sorted.slice( 0, MAX_JOINED ).map( rowFn ).join( ' · ' );
		return sorted.length > MAX_JOINED
			? `${ shown } — and ${ sorted.length - MAX_JOINED } more (see the metric charts)`
			: shown;
	};
	// Pending and suppressed rows share this tail: the 'regressed' fallback (a '' fallback
	// double-spaced the line) and a (late) marker — a weeks-old orphaned flag must not render
	// byte-identically to one raised this week.
	const lateRow = r =>
		`${ pctStr( r.pct ) || 'regressed' } ${ commitLink( r.hash ) }${ r.late ? ' (late)' : '' }`;
	const blocks = [
		{
			type: 'header',
			text: { type: 'plain_text', text: `📊 ${ repoTitle } CodeVitals — weekly digest` },
		},
		// A header block is plain_text only, so the title itself cannot carry the link. This
		// context line does instead, and it is the ONLY link a clean week's digest has: with no
		// regressions there are no commit or chart links to follow.
		{
			type: 'context',
			elements: [
				mrkdwn( `📈 <${ dashboardUrl }|Open the ${ esc( repoTitle ) } CodeVitals dashboard>` ),
			],
		},
	];

	if ( discoveryFailed ) {
		blocks.push(
			section(
				`:rotating_light: *Could not enumerate the tracked metrics* (${ esc(
					clip( discoveryError || 'metrics list came back empty' )
				) }). The digest has no signal this week — check the read API's /metrics endpoint and CODEVITALS_EVOLUTION_URL, or set METRIC_IDS explicitly as a stopgap.`
			)
		);
	} else if ( allFailed ) {
		blocks.push(
			section(
				`:rotating_light: *Could not read any metric data* (ids ${ metricIds.join(
					', '
				) }). The digest has no signal this week — check the evolution read API and the metric ids (ids change when metrics are recreated).`
			)
		);
	} else {
		const readable = metricIds.length - failedIds.length;
		if ( failedIds.length > 0 ) {
			blocks.push(
				section(
					`:warning: Could not read metric${ failedIds.length > 1 ? 's' : '' } ${ failedIds.join(
						', '
					) } — this digest is partial.`
				)
			);
		}
		if ( droppedIds > 0 ) {
			blocks.push(
				section(
					`:warning: ${ droppedIds } discovered metric id${
						droppedIds > 1 ? 's' : ''
					} did not look numeric and ${
						droppedIds > 1 ? 'were' : 'was'
					} dropped from the watch list (API contract drift?) — this digest may be missing metrics.`
				)
			);
		}
		if ( badPoints.size > 0 ) {
			const parts = [ ...badPoints ]
				.map( ( [ id, n ] ) => `${ label( id ) } (${ n })` )
				.join( ', ' );
			blocks.push(
				section(
					`:warning: Skipped malformed data point${
						[ ...badPoints.values() ].reduce( ( a, b ) => a + b, 0 ) > 1 ? 's' : ''
					} on ${ parts } — the digest may be incomplete. Check the posted CodeVitals data.`
				)
			);
		}
		if ( allStale ) {
			blocks.push(
				section(
					`:rotating_light: *No fresh data on any tracked metric* (threshold ${ STALENESS_DAYS }d). The measurement pipeline may be stalled — check the scheduled measurement builds.`
				)
			);
		} else if ( staleInfo.length > 0 ) {
			const list = staleInfo
				.map(
					s =>
						`${ label( s.id ) } — ${
							s.days === null ? 'no data points' : `newest ${ s.days }d old`
						}`
				)
				.join( '; ' );
			blocks.push(
				section(
					`:rotating_light: *Stale metric${
						staleInfo.length > 1 ? 's' : ''
					}:* ${ list } (threshold ${ STALENESS_DAYS }d). A recreated or stalled metric serves empty data — check its measurement scenario and the metric id.`
				)
			);
		}
		if ( confirmed.length === 0 && confirmedLate.length === 0 ) {
			// A degraded week must not wear the green tick next to its own alert blocks: the
			// clean claim only covers the data that could be read.
			const degraded =
				failedIds.length > 0 || badPoints.size > 0 || staleInfo.length > 0 || droppedIds > 0;
			blocks.push(
				section(
					degraded
						? `:grey_question: No sustained regressions among the data that could be read (${ readable } tracked metric${
								readable === 1 ? '' : 's'
						  }) — but the signal is degraded this week, see above.`
						: `:white_check_mark: No sustained metric regressions in the last ${ WINDOW_DAYS } days across ${ readable } tracked metric${
								readable === 1 ? '' : 's'
						  }.`
				)
			);
		} else {
			if ( confirmed.length > 0 ) {
				blocks.push(
					section(
						`:warning: *${ confirmed.length } sustained regression${
							confirmed.length > 1 ? 's' : ''
						}* in the last ${ WINDOW_DAYS } days:`
					)
				);
				for ( const r of confirmed.slice( 0, MAX_LINES ) ) {
					const pct = pctStr( r.pct ) || 'regressed';
					const delta =
						r.from != null && r.to != null
							? ` (${ fmt( r.from ) }→${ fmt( r.to ) }${ esc( clip( r.unit ) ) })`
							: '';
					// A transferred flag's percent, value, or comparison base comes from a re-run
					// row, not the kept first measurement. Say so, or the line asserts an
					// attribution the series data does not support.
					const reRun = r.reRun ? ' (flag from a re-run)' : '';
					// heldAboveAnchor alerts say what was compared (the medians did not move;
					// only an anchor comparison holds the alert up). The rest render the median
					// movement ONLY when the medians actually rose: an entry confirmed solely
					// because its anchor was unusable (a zero pre-flag value) must not justify
					// itself with medians that sat flat, and a tie renders as a single level
					// ("holding at med 200ms"), never a self-contradictory "100→100" arrow. pre >
					// 0 (not just finite): an empty pre-window medians to 0, and a fabricated
					// "med 0→…" baseline must never reach the message.
					let sustained = '';
					if ( r.heldAboveAnchor ) {
						// "has not risen" is spelled out (the guard's literal test): this branch
						// is the one shape the gate cannot tell apart from a recovered one-commit
						// dip, and no number it computes disambiguates. The reader must check the
						// chart, so the line says so.
						sustained = ` · holds above the pre-flag ${ fmt( r.from ) }${ esc(
							clip( r.unit )
						) } (window med ${ fmt( r.post ) }${ esc(
							clip( r.unit )
						) } has not risen — check the chart)`;
					} else if (
						Number.isFinite( r.pre ) &&
						r.pre > 0 &&
						Number.isFinite( r.post ) &&
						( r.post - r.pre ) / r.pre >= 0.05
					) {
						sustained = ` · holding at med ${ r.pre === r.post ? '' : `${ fmt( r.pre ) }→` }${ fmt(
							r.post
						) }${ esc( clip( r.unit ) ) }`;
					}
					const chart = r.key ? ` · <${ chartUrl( r.key ) }|chart>` : '';
					blocks.push(
						section(
							`• *${ esc(
								clip( r.name )
							) }* ${ pct }${ delta }${ reRun }${ sustained } — ${ commitLink( r.hash ) }${ chart }`
						)
					);
				}
				if ( confirmed.length > MAX_LINES ) {
					blocks.push(
						section( `…and ${ confirmed.length - MAX_LINES } more — see the metric charts.` )
					);
				}
			}
			if ( confirmedLate.length > 0 ) {
				blocks.push(
					section(
						`:warning: *${ confirmedLate.length } late-confirmed regression${
							confirmedLate.length > 1 ? 's' : ''
						}* — flagged commit${
							confirmedLate.length > 1 ? 's' : ''
						} older than the ${ WINDOW_DAYS }d window that still hold as sustained (typically backfilled or recovered data): ${ joinRows(
							confirmedLate,
							r =>
								`*${ esc( clip( r.name ) ) }* ${ pctStr( r.pct ) || 'regressed' }${
									r.reRun ? ' (flag from a re-run)' : ''
								} ${ commitLink( r.hash ) }${ r.key ? ` · <${ chartUrl( r.key ) }|chart>` : '' }`
						) }`
					)
				);
			}
		}
		if ( pending.length > 0 ) {
			blocks.push(
				section(
					`:hourglass_flipped: *${ pending.length } flagged change${
						pending.length > 1 ? 's' : ''
					} awaiting confirmation* (at the data edge — too few later commits to judge; re-checked each digest while the flag stays inside the ${
						2 * WINDOW_DAYS
					}d look-back): ${ joinRows(
						pending,
						r => `*${ esc( clip( r.name ) ) }* ${ lateRow( r ) }`
					) }`
				)
			);
		}
		if ( reverted.length > 0 ) {
			blocks.push( {
				type: 'context',
				elements: [
					mrkdwn(
						`:leftwards_arrow_with_hook: ${ reverted.length } transient spike${
							reverted.length > 1 ? 's' : ''
						} suppressed (flag did not hold over the next commits): ${ joinRows(
							reverted,
							r => `${ esc( clip( r.name ) ) } ${ lateRow( r ) }`
						) }`
					),
				],
			} );
		}
	}

	// Hard Slack schema cap: a section text object maxes out at 3000 chars, and unit/key/id lists
	// are not individually bounded. Clamp the finished text: blunt, but always valid.
	for ( const b of blocks ) {
		if ( b.text?.text?.length > 3000 ) b.text.text = b.text.text.slice( 0, 2999 ) + '…';
		for ( const el of b.elements || [] ) {
			if ( el.text?.length > 3000 ) el.text = el.text.slice( 0, 2999 ) + '…';
		}
	}

	// The top-level text drives notifications and screen readers. It must carry the
	// degraded-signal state, not just the regression count, and a screen reader never hears the
	// blocks, so the regressions themselves are named here too (bounded).
	const summaryParts = [];
	if ( discoveryFailed ) summaryParts.push( 'METRIC DISCOVERY FAILURE' );
	else if ( allFailed ) summaryParts.push( 'DATA READ FAILURE' );
	else {
		// Late-confirmed regressions are named too (top 2, newest first): the alerts a recipient
		// is most likely to triage from the notification alone.
		const summaryName = r => `${ esc( clip( r.name ) ) } ${ pctStr( r.pct ) || 'regressed' }`;
		const topNames = confirmed.slice( 0, 3 ).map( summaryName );
		summaryParts.push(
			`${ confirmed.length } sustained regression(s)${
				topNames.length > 0
					? `: ${ topNames.join( ', ' ) }${ confirmed.length > 3 ? ', …' : '' }`
					: ''
			}`
		);
		if ( confirmedLate.length > 0 ) {
			const lateNames = [ ...confirmedLate ]
				.sort( ( a, b ) => b.t - a.t )
				.slice( 0, 2 )
				.map( summaryName );
			summaryParts.push(
				`${ confirmedLate.length } late-confirmed: ${ lateNames.join( ', ' ) }${
					confirmedLate.length > 2 ? ', …' : ''
				}`
			);
		}
		if ( pending.length > 0 ) summaryParts.push( `${ pending.length } pending` );
		if ( failedIds.length > 0 ) summaryParts.push( `${ failedIds.length } metric read failure(s)` );
		if ( droppedIds > 0 ) summaryParts.push( `${ droppedIds } id(s) dropped` );
		if ( badPoints.size > 0 ) summaryParts.push( 'MALFORMED DATA SKIPPED' );
		if ( staleInfo.length > 0 ) summaryParts.push( 'DATA STALE' );
	}
	const payload = {
		channel: CHANNEL,
		// mrkdwn:false turns off formatting and auto-link parsing on the notification fallback:
		// the one mrkdwn sink block-level verbatim cannot reach, and the one that carries
		// API-sourced metric names. esc() STAYS: Slack decodes &lt;/&gt;/&amp; entities in every
		// text field regardless of mrkdwn. unfurl flags: a naked URL in a metric name must never
		// grow a link preview under the trusted bot identity.
		mrkdwn: false,
		unfurl_links: false,
		unfurl_media: false,
		text: `${ esc( repoTitle ) } CodeVitals weekly digest — ${ summaryParts.join( ', ' ) }`,
		blocks,
	};

	// Any degraded signal must leave the build red, even after posting: discovery/read failures,
	// dropped ids, malformed points, and stale/dead metrics are all act-on conditions
	// (pending/suppressed spikes and late confirmations are informational).
	if (
		discoveryFailed ||
		failedIds.length > 0 ||
		droppedIds > 0 ||
		badPoints.size > 0 ||
		staleInfo.length > 0
	)
		exitCode = 1;

	if ( DRY_RUN ) {
		console.log( JSON.stringify( payload, null, 2 ) );
	} else if ( ! TOKEN || ! CHANNEL ) {
		// Misconfigured production (missing, renamed, or placeholder token or channel) must be
		// loud, not a silent forever-skip.
		console.error(
			'SLACK_TOKEN and/or SLACK_CHANNEL_ID is not set — refusing to skip silently. Payload below.'
		);
		console.log( JSON.stringify( payload, null, 2 ) );
		exitCode = 1;
	} else {
		console.log( JSON.stringify( payload, null, 2 ) ); // keep the payload in the build log so a Slack-side failure never loses the digest
		try {
			// 1 retry (not the SDK's ~10/~30min default) bounds the attempt COUNT: a 5xx or
			// timeout is delivery-AMBIGUOUS (Slack may have created the message before the
			// response was lost), so every retry risks a duplicate digest in the channel. One
			// balances a transient network blip against duplicate spam. The 30s timeout bounds
			// each ATTEMPT: the SDK default is NO timeout, so one blackholed connection would
			// park the job until the CI wall clock. A 429's Retry-After sleep happens OUTSIDE
			// both bounds, so rate-limited calls reject instead of parking the queue: this weekly
			// single post should never see a real 429, and if it does the failure must be loud
			// and named. The SDK's attachOriginalToWebAPIRequestError default would hang the
			// Bearer token off the thrown error's config: detached as defense in depth. The catch
			// below prints only the coded error, but one future console.log(e) must not leak a
			// secret.
			await new WebClientClass( TOKEN, {
				retryConfig: { retries: 1 },
				timeout: 30000,
				rejectRateLimitedCalls: true,
				attachOriginalToWebAPIRequestError: false,
			} ).chat.postMessage( payload );
			// "posted" is the positive success marker a scheduler-side watchdog greps for: a
			// finished run does not prove a posted digest (an install/timeout death posts
			// nothing), so it prints ONLY after a successful chat.postMessage.
			console.log( 'posted' );
		} catch ( e ) {
			// Total over any thrown shape (a null/primitive throw must not TypeError inside this
			// catch), and collapsed through oneLine like every other external-text sink, so a
			// crafted multi-line error can never forge a standalone marker line.
			const reason = oneLine( ( e && ( e.data?.error || e.message ) ) || String( e ) );
			console.error(
				`Slack post failed: ${ reason } — check the SLACK_TOKEN (the Slack app's xoxb bot token), the channel id, and that the bot is INVITED to the channel (chat:write only, no chat:write.public).`
			);
			exitCode = 1;
		}
	}
	return exitCode;
}

// Run only when executed directly, not when imported (by the unit tests), so importing main()
// triggers no env checks, network reads, or exits. process.exitCode, never process.exit() (the
// sibling scripts' choice): the payload JSON on stdout can be large, and process.exit() truncates
// pending stdout writes. The digest must never lose its own payload from the build log.
if ( isDirectInvocation( import.meta.filename, process.argv[ 1 ] ) ) {
	process.exitCode = await main();
}

export { main };
