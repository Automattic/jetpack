/** Post performance metrics to CodeVitals. */

import fs from 'fs';
import path from 'path';
import { SCENARIOS, SANITY_RANGES } from './scenarios.js';

/**
 * Exit code for a LOCAL data-integrity failure: a metric failed a sanity check, a
 * scenario is misconfigured, or the results file is missing/unusable. In short,
 * anything that goes wrong BEFORE the live POST. This is distinct from exit 1 (a
 * remote CodeVitals transport/API failure during or after the POST).
 * run-performance-tests.js treats this code as always fatal and never suppresses it
 * with `--allow-codevitals-failure`, which exists only to tolerate CodeVitals
 * network outages, not bad local data.
 */
const VALIDATION_FAILED_EXIT_CODE = 2;

/**
 * A local data-integrity or scenario-configuration failure. A thrown error of this
 * type must always fail the build (exit VALIDATION_FAILED_EXIT_CODE), so the runner
 * can never suppress it under `--allow-codevitals-failure`. It is distinct from a
 * CodeVitals transport/API error, which exits 1 and that flag may tolerate.
 */
class ValidationError extends Error {
	constructor( message, options ) {
		super( message, options ); // forward { cause } so a wrapped transport error is preserved
		this.name = 'ValidationError';
	}
}

/**
 * Map a thrown error to a process exit code. A local data-integrity failure
 * (ValidationError, e.g. a misconfigured scenario) exits VALIDATION_FAILED_EXIT_CODE
 * so the runner always fails the build on it; any other error (a CodeVitals
 * transport/API failure) exits 1, which `--allow-codevitals-failure` may tolerate.
 *
 * @param {*} error - The caught error.
 * @return {number} The exit code to use.
 */
function exitCodeForError( error ) {
	return error instanceof ValidationError ? VALIDATION_FAILED_EXIT_CODE : 1;
}

/**
 * Extract metric entries for a single scenario.
 *
 * Each entry carries its CodeVitals key, value, and (optional) type. The type
 * drives the sanity-range check; untyped legacy entries are posted unchecked.
 *
 * Three shapes, in precedence order. A `metrics` array yields one typed entry per element,
 * each reading its value from summary.<field>.median and posting to its own key (the
 * FORMS-707 multi-metric-per-scenario path). A single `metricKey` yields one typed entry
 * reading the flat summary.median (legacy). A `metricPrefix` yields five untyped
 * prefix-suffixed entries, posted unchecked (legacy).
 */
function extractScenarioMetrics( scenario, summary ) {
	const scenarioLabel = scenario.key ?? 'unknown';
	// Multi-metric path: a scenario declares several metrics posted together in one call.
	if ( Array.isArray( scenario.metrics ) ) {
		// An empty metrics[] posts nothing without tripping any guard: solo it falls
		// through to the fail-closed no-metrics gate, but next to a sibling posting
		// scenario it would be dropped silently while the run posts green. Declaring
		// the array and leaving it empty is a scenario misconfiguration either way.
		if ( scenario.metrics.length === 0 ) {
			throw new ValidationError(
				`Scenario "${ scenarioLabel }" declares an empty metrics array; declare at least one metric or drop postToCodeVitals`
			);
		}
		const seen = new Set();
		return scenario.metrics.map( metric => {
			// A null/undefined entry would throw a raw TypeError on the key read below,
			// and a plain Error maps to the suppressible exit 1 — escaping the exit-2
			// contract every other misconfiguration here honors. Reject the shape first.
			if ( ! metric || typeof metric !== 'object' ) {
				throw new ValidationError(
					`Scenario "${ scenarioLabel }" has a non-object metrics[] entry (${ JSON.stringify(
						metric
					) }); refusing to post`
				);
			}
			// Every entry MUST name a CodeVitals key. Without one, `key` is undefined and the
			// value lands under the literal key "undefined" in the append-only store — a
			// permanent garbage point checkSanityRange (which only inspects the value) can't
			// catch. A missing or blank key is a scenario misconfiguration, so fail closed
			// here, mirroring the type and duplicate-key guards below.
			if ( typeof metric.codevitalsKey !== 'string' || ! metric.codevitalsKey.trim() ) {
				throw new ValidationError(
					`Scenario "${ scenarioLabel }" has a metric (field "${
						metric.field ?? 'unknown'
					}") with no codevitalsKey; refusing to post to the append-only store`
				);
			}
			// Every keyed metric MUST declare a type so checkSanityRange can range-check it —
			// the same fail-closed invariant the single-metricKey path enforces below. A
			// missing type is a scenario misconfiguration, so fail loud here (the dry-run CI
			// smoke test catches it before any post) rather than post an unchecked value.
			if ( ! metric.type ) {
				throw new ValidationError(
					`Scenario "${ scenarioLabel }" metric "${
						metric.codevitalsKey ?? metric.field ?? 'unknown'
					}" has no type; refusing to post an unchecked keyed metric`
				);
			}
			// A metrics array that lists the same key twice would post one value then clobber
			// it — a scenario-config bug, not bad runtime data. Fail closed here, before any
			// value is read, mirroring the cross-scenario duplicate-key guard in the loop.
			if ( seen.has( metric.codevitalsKey ) ) {
				throw new ValidationError(
					`Duplicate CodeVitals metric key "${ metric.codevitalsKey }" within scenario "${ scenarioLabel }"`
				);
			}
			seen.add( metric.codevitalsKey );
			// Read the value from the per-field summary block (summary.<field>.median). A
			// missing field yields undefined, which checkSanityRange rejects (fail closed)
			// rather than crashing — never a fabricated value into the append-only store.
			return {
				key: metric.codevitalsKey,
				value: summary?.[ metric.field ]?.median,
				type: metric.type,
			};
		} );
	}

	// Use explicit metricKey if defined, otherwise fall back to prefix-based keys
	if ( scenario.metricKey ) {
		// A posted exact-key metric must declare a metricType so checkSanityRange can
		// range-check it. Without one it would fall through as an untyped "legacy"
		// entry and post any finite value unchecked — the exact hole this fail-closed
		// guard exists to close. A missing type is a scenario misconfiguration, so
		// fail loud here (the dry-run CI smoke test catches it before any post).
		if ( ! scenario.metricType ) {
			throw new ValidationError(
				`Scenario "${
					scenario.key ?? scenario.metricKey
				}" sets metricKey but no metricType; refusing to post an unchecked keyed metric`
			);
		}
		// Single metric with exact key
		return [ { key: scenario.metricKey, value: summary.median, type: scenario.metricType } ];
	}

	// Legacy: prefix-based keys with suffixes (untyped — not range-checked)
	// A posting scenario with none of the three selectors would reach here with an
	// undefined prefix and post five finite summary stats under literal "undefined_*"
	// keys — untyped, so unchecked, and with a green build. That is the one fail-open
	// shape in this function, so refuse it like the sibling guards above.
	if ( typeof scenario.metricPrefix !== 'string' || ! scenario.metricPrefix.trim() ) {
		throw new ValidationError(
			`Scenario "${ scenarioLabel }" posts to CodeVitals but declares no metrics[], metricKey, or metricPrefix; refusing to post under "undefined_*" keys`
		);
	}
	const prefix = scenario.metricPrefix;
	return [
		{ key: `${ prefix }_ms`, value: summary.median },
		{ key: `${ prefix }_mean_ms`, value: summary.mean },
		{ key: `${ prefix }_min_ms`, value: summary.min },
		{ key: `${ prefix }_max_ms`, value: summary.max },
		{ key: `${ prefix }_stddev_ms`, value: summary.stdDev },
	];
}

/**
 * Check whether a metric value is safe to post to CodeVitals.
 *
 * CodeVitals is append-only, so anything uncertain fails closed. A typed metric
 * whose type has no range row (a typo, or a forgotten SANITY_RANGES entry) and a
 * non-finite value (null, NaN, Infinity, a numeric string) are both rejected
 * rather than posted. Only a genuinely untyped legacy entry passes unchecked.
 *
 * @param {string|undefined} type  - Metric type, or falsy for an untyped legacy entry.
 * @param {*}                value - Candidate metric value.
 * @return {{ ok: boolean, reason?: string }} Whether the value may be posted, and why not.
 */
function checkSanityRange( type, value ) {
	// Never post a non-finite value, regardless of type. null, NaN, Infinity, and
	// numeric strings are always wrong for an append-only store, so this check
	// comes before the untyped early return below.
	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		return { ok: false, reason: `value ${ JSON.stringify( value ) } is not a finite number` };
	}

	// Genuinely untyped legacy entry: no declared type, so no range to enforce.
	if ( ! type ) {
		return { ok: true };
	}

	// Look up the range as an OWN property only. SANITY_RANGES is a plain object, so a type
	// that happens to name an inherited property ("constructor", "toString", "valueOf", …)
	// would resolve to a truthy prototype value with undefined min/max, and the range
	// comparison below (value < undefined || value > undefined) is always false — the value
	// would post unchecked. A type with no OWN range row is a typo or a forgotten entry and
	// must fail closed.
	if ( ! Object.hasOwn( SANITY_RANGES, type ) ) {
		return { ok: false, reason: `no sanity range is defined for type "${ type }"` };
	}
	const range = SANITY_RANGES[ type ];

	if ( value < range.min || value > range.max ) {
		return { ok: false, reason: `${ value } is outside [${ range.min }, ${ range.max }]` };
	}

	return { ok: true };
}

/**
 * Strip the CodeVitals token from a string so it can never reach a log or a
 * re-thrown error. fetch and the URL parser echo the full request URL (token
 * included) in their messages, and the token grants append access to an
 * unrollback-able store, so scrub it before anything prints.
 *
 * @param {string} text    - Text that may contain the token or a `token=...` query param.
 * @param {string} [token] - The exact token value to strip, when known.
 * @return {string} The text with the token replaced by `REDACTED`.
 */
function redactToken( text, token ) {
	let safe = String( text );
	if ( token ) {
		safe = safe.split( token ).join( 'REDACTED' );
	}
	// Catch the query-param form too, in case the exact value isn't in hand here.
	return safe.replace( /token=[^&\s]+/g, 'token=REDACTED' );
}

/**
 * Assign a value to an object property, swallowing a write failure.
 *
 * Some native errors expose `message`/`stack` as getter-only accessors — a fetch
 * timeout rejects with a `DOMException` whose `message` has no setter — so a direct
 * write throws a TypeError in strict mode. Redaction is best-effort defense in depth:
 * skipping an unwritable field is always better than throwing out of the error
 * handler, and those native fields (an abort's "operation was aborted" message)
 * never carry the token anyway.
 *
 * @param {object} obj   - Target object.
 * @param {string} key   - Property to set.
 * @param {*}      value - Value to assign.
 */
function safeAssign( obj, key, value ) {
	try {
		obj[ key ] = value;
	} catch {
		// Getter-only / non-writable property; leave it as-is.
	}
}

/**
 * Redact the token from an error and every error in its `cause` chain, in place.
 *
 * A re-thrown error keeps its caught cause for debugging, but that cause (and any
 * nested cause) can carry the token in its `message`, `stack`, or a custom string
 * field a client stashed a URL in (e.g. `requestUrl`), or a primitive string
 * `cause`. Walking the whole chain
 * scrubs each one so logging the full error never leaks the secret. Native fetch
 * never populates such fields, so the own-property pass is belt-and-suspenders for
 * a non-native HTTP client; it stays at string fields rather than recursing into
 * arbitrary nested objects.
 *
 * @param {*}      error - The caught error (or any thrown value).
 * @param {string} token - The token value to strip from messages, stacks, and string fields.
 */
function sanitizeErrorChain( error, token ) {
	const seen = new Set();
	let current = error;
	while ( current && typeof current === 'object' && ! seen.has( current ) ) {
		seen.add( current );
		// message and stack are non-enumerable own props, so handle them explicitly.
		// safeAssign because a native error (e.g. a DOMException abort) may expose them
		// as getter-only — a direct write would throw a TypeError out of this handler.
		if ( typeof current.message === 'string' ) {
			safeAssign( current, 'message', redactToken( current.message, token ) );
		}
		if ( typeof current.stack === 'string' ) {
			safeAssign( current, 'stack', redactToken( current.stack, token ) );
		}
		// Then scrub any enumerable string field (an object `cause` is non-enumerable
		// and is walked on the next iteration; a string `cause` is handled just below).
		for ( const key of Object.keys( current ) ) {
			if ( typeof current[ key ] === 'string' ) {
				safeAssign( current, key, redactToken( current[ key ], token ) );
			}
		}
		// `cause` is non-enumerable on Error, so the pass above can't reach a primitive
		// string cause (e.g. `new Error( m, { cause: someUrl } )`); it would otherwise
		// survive untouched and leak the token. Redact it in place before advancing; an
		// object cause is scrubbed when the loop walks into it next.
		if ( typeof current.cause === 'string' ) {
			safeAssign( current, 'cause', redactToken( current.cause, token ) );
		}
		current = current.cause;
	}
}

/**
 * Resolve the timestamp to stamp on the CodeVitals point: the time the code under
 * test was COMMITTED, not when this build happened to run.
 *
 * CodeVitals orders a trend by this value, and the Scheduler reads the most recent
 * point by it to decide "last tested commit". A build-time stamp (Date.now()) would
 * order a backfilled or re-run commit by when CI ran rather than when the code
 * landed, scrambling both the trend graph and the scheduler's catch-up logic.
 * Prefer the commit time carried in the results file, then the runner-provided env
 * value, and only fall back to Date.now() (with a warning) when neither is a plausible
 * epoch-ms value — a gross unit error (e.g. epoch seconds, which would post as 1970) is
 * rejected the same as a non-numeric one.
 *
 * The env value is only considered when it cannot contradict the posted hash: the payload
 * hash prefers results.git.hash over config.gitHash, while config.commitTimestampMs is
 * provenance-paired with the env GIT_COMMIT hash (see pairedCommitTimestampMs). So when a
 * results file names a DIFFERENT commit than the env pair — a stale results file plus an
 * inherited GIT_COMMIT/GIT_COMMIT_TIMESTAMP_MS pair — the env timestamp is dropped rather
 * than stamped onto another commit's hash.
 *
 * @param {object} results - Parsed results file (may carry git.timestamp in ms).
 * @param {object} config  - Poster config (may carry commitTimestampMs from env).
 * @return {number} Epoch milliseconds to post.
 */
function resolvePostTimestamp( results, config ) {
	// A posted timestamp is epoch *milliseconds*. Bound it to a wide plausible window so a
	// gross unit mistake can't silently corrupt the append-only trend: a 10-digit
	// epoch-*seconds* value (e.g. 1700000000) is below MIN and would post as 1970, and a
	// micro/nanosecond value is far above MAX. The window only catches unit errors, never
	// a normal commit time.
	const MIN_PLAUSIBLE_MS = 1_000_000_000_000; // ≈ 2001-09-09
	const MAX_PLAUSIBLE_MS = 4_102_444_800_000; // ≈ 2100-01-01
	// Hash and timestamp are resolved as one provenance tuple: only offer the env
	// timestamp when the env hash is (or matches) the hash being posted — see the
	// JSDoc above.
	const envPairMatchesPostedHash = ! results?.git?.hash || results.git.hash === config?.gitHash;
	const candidates = envPairMatchesPostedHash
		? [ results?.git?.timestamp, config?.commitTimestampMs ]
		: [ results?.git?.timestamp ];
	// A numeric string (env vars are always strings) is fine; a non-numeric one
	// coerces to NaN and is rejected below.
	for ( const candidate of candidates ) {
		const ms = Number( candidate );
		// A real commit time is a finite epoch-ms inside the plausible window. Reject 0,
		// NaN, negatives, empty strings, and out-of-window unit errors so a malformed
		// field can't poison the trend ordering.
		if ( Number.isFinite( ms ) && ms >= MIN_PLAUSIBLE_MS && ms <= MAX_PLAUSIBLE_MS ) {
			return ms;
		}
	}
	console.warn(
		'⚠ No commit timestamp available (results.git.timestamp / GIT_COMMIT_TIMESTAMP_MS); ' +
			'falling back to the current time, which orders this point by build time, not commit time.'
	);
	return Date.now();
}

/**
 * Whether a commit hash already has a data point in CodeVitals, so a re-run or
 * retry doesn't append a duplicate to the append-only trend.
 *
 * Reads the same gitaudit repo-scoped evolution endpoint the Scheduler uses to
 * compute "last tested commit", so dedup and scheduling agree on what counts as
 * already tested. Needs no token (the read endpoint is unauthenticated, like the
 * Scheduler's curl).
 *
 * Fails OPEN: any read error, timeout, non-OK status, or unexpected body shape
 * returns false (the post proceeds). Missing a real data point is worse than a rare
 * duplicate, and a flaky read must never block a legitimate post.
 *
 * IMPORTANT: the read and write backends must match before dedup can be trusted. This
 * reads gitaudit (metric `config.dedupMetricId`) while the POST targets
 * `config.codeVitalsUrl` (codevitals.run today). Until the two are reconciled (the
 * FORMS-705 host/metric work), a hash written to codevitals.run may not appear here, so
 * dedup is effectively a no-op. The "can only fail to skip, never wrongly skip" guarantee
 * holds ONLY while dedup is off (the default): with no read, no skip can happen. If an
 * operator enables dedup before the backends match, metric 58 is a different, *populated*
 * trunk series (not the codevitals.run write target), so a coincidental hash match there
 * could WRONGLY skip a real post on the append-only, no-rollback store. So `main()` keeps
 * dedup OPT-IN (off by default) until the read series is proven to be the write series.
 * See CODEVITALS_ENABLE_DEDUP. Do not enable it before then.
 *
 * @param {string} hash   - Monorepo commit hash about to be posted.
 * @param {string} branch - Branch to scope the evolution query to.
 * @param {object} config - Poster config (dedupBaseUrl, dedupRepo, dedupMetricId).
 * @return {Promise<boolean>} True only on a confirmed existing point for this hash.
 */
async function hashAlreadyPosted( hash, branch, config ) {
	if ( ! hash || hash === 'unknown' ) {
		return false; // can't dedup an unknown hash — let it post
	}

	const TIMEOUT_MS = config.dedupTimeoutMs ?? 15000;
	const controller = new AbortController();
	const timeoutId = setTimeout( () => controller.abort(), TIMEOUT_MS );
	try {
		// Build the URL inside the try so even a pathological branch (a lone surrogate
		// that makes encodeURIComponent throw) is caught and fails open — the "never
		// block a post" contract stays total, not just total for the fetch itself.
		const url =
			`${ config.dedupBaseUrl }/api/repos/${ config.dedupRepo }` +
			`/perf/evolution/${ config.dedupMetricId }` +
			`?branch=${ encodeURIComponent( branch ) }&limit=200`;
		const response = await fetch( url, {
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		} );
		if ( ! response.ok ) {
			clearTimeout( timeoutId );
			console.warn(
				`⚠ Dedup check skipped: evolution endpoint returned HTTP ${ response.status }. Proceeding with post.`
			);
			return false;
		}
		// Read the body with the abort timer still armed — only clear it once json()
		// settles. Clearing right after fetch (as the live-POST path does) leaves the
		// body read unbounded, so a server that sends headers then stalls the body
		// could hang here (undici's ~300s default at best) and block the post,
		// violating "a flaky read must never block a post". With the timer live,
		// controller.abort() makes json() reject with AbortError → caught → fail open.
		const body = await response.json();
		clearTimeout( timeoutId );
		// The gitaudit API returns { data: [ { hash, measuredAt, ... }, ... ] }.
		if ( ! Array.isArray( body?.data ) ) {
			// Fail open (post proceeds), but warn — every other degraded dedup path warns,
			// and a silent {data: undefined} would make API/schema drift look like a valid
			// empty series ("dedup never skips") with no signal once dedup is enabled.
			console.warn(
				'⚠ Dedup check skipped: evolution response had no data array (unexpected shape). Proceeding with post.'
			);
			return false;
		}
		return body.data.some( point => point?.hash === hash );
	} catch ( error ) {
		clearTimeout( timeoutId );
		const reason =
			error?.name === 'AbortError' ? `timed out after ${ TIMEOUT_MS / 1000 }s` : error?.message;
		console.warn( `⚠ Dedup check skipped (${ reason }). Proceeding with post.` );
		return false;
	}
}

/** Post metrics to CodeVitals. */
async function postToCodeVitals( resultsPath, config ) {
	// Everything from here until the live POST is local data-integrity work: a missing
	// or malformed results file, no usable measurements, or a bad config all fail as a
	// ValidationError (exit 2, never suppressible by --allow-codevitals-failure). Only a
	// failure during the live POST below is a transport error (exit 1, suppressible).
	if ( ! fs.existsSync( resultsPath ) ) {
		throw new ValidationError( `Results file not found: ${ resultsPath }` );
	}

	let results;
	try {
		results = JSON.parse( fs.readFileSync( resultsPath, 'utf8' ) );
	} catch {
		throw new ValidationError( `Results file is not valid JSON: ${ resultsPath }` );
	}
	if ( ! results.measurements || typeof results.measurements !== 'object' ) {
		throw new ValidationError( 'Results file has no measurements object' );
	}

	// Extract and sanity-check metrics from results
	const metrics = {};
	let validationFailed = false;

	// Process only scenarios marked for CodeVitals posting
	for ( const scenario of SCENARIOS ) {
		// Skip scenarios not marked for CodeVitals
		if ( ! scenario.postToCodeVitals ) {
			continue;
		}

		const measurement = results.measurements[ scenario.key ];
		// A missing/errored measurement, or one with no summary object, has no usable
		// data. For an OPTIONAL scenario — or one ABSENT from the results (measure-lcp
		// writes every SELECTED scenario's key, success or error, so absent means the
		// scenario wasn't in the run set) — that is a skip: warn and post the survivors;
		// if skipping leaves nothing to post, the no-metrics guard below fails closed.
		// A REQUIRED scenario that was measured and failed is different: that results
		// file comes from a red run, and a red run must post nothing (retry-safety on
		// the append-only, dedup-off store), so fail closed before anything accumulates.
		// The runner never reaches this path (it exits before posting on a required
		// failure), but the direct `pnpm report` entrypoint does.
		if ( ! measurement || measurement.error || ! measurement.summary ) {
			if ( measurement && ! scenario.optional ) {
				throw new ValidationError(
					`Required scenario "${ scenario.name }" has no usable measurement (${
						measurement.error ? `error: ${ measurement.error }` : 'no summary'
					}); this results file comes from a failed run, which must post nothing`
				);
			}
			// Two distinct skip cases, and the log must not conflate them: an ABSENT scenario
			// was never in the run set (normal for a targeted SCENARIO run — nothing went
			// wrong), while a PRESENT-but-unusable one (only ever optional here; required
			// throws above) is a real measurement failure.
			console.warn(
				measurement
					? `Warning: ${ scenario.name } measurement failed (${
							measurement.error ? `error: ${ measurement.error }` : 'no summary'
					  }; optional scenario — its keys skip this build)`
					: `Warning: ${ scenario.name } not in this results file (not part of the run set; its keys skip this build)`
			);
			continue;
		}

		for ( const entry of extractScenarioMetrics( scenario, measurement.summary ) ) {
			const check = checkSanityRange( entry.type, entry.value );
			if ( ! check.ok ) {
				console.error(
					`✗ Sanity check failed for "${ entry.key }" (${ entry.type }): ${ check.reason }. Skipping this metric.`
				);
				validationFailed = true;
				continue;
			}
			// CodeVitals keys a trend by metric name and appends, so two scenarios writing
			// the same key would silently clobber one with the other and post the survivor
			// (validationFailed:false) as if it were the intended series. A duplicate key is
			// a scenario-config bug, not bad runtime data, so fail closed (exit 2) before
			// anything posts rather than coin-flip which value lands in the trend.
			if ( Object.prototype.hasOwnProperty.call( metrics, entry.key ) ) {
				throw new ValidationError(
					`Duplicate CodeVitals metric key "${ entry.key }"; two scenarios must not post the same key`
				);
			}
			metrics[ entry.key ] = entry.value;
		}
	}

	// Nothing valid left to post.
	if ( Object.keys( metrics ).length === 0 ) {
		if ( validationFailed ) {
			// Every metric was skipped by a sanity check (failures already logged).
			return { posted: false, validationFailed };
		}
		throw new ValidationError(
			'No metrics to post - check scenario configuration and measurement results'
		);
	}

	// Prepare CodeVitals payload
	const payload = {
		metrics,
		baseMetrics: {}, // Empty object - we don't use baseline normalization
		hash: results.git?.hash || config.gitHash || 'unknown',
		// Commit time of the code under test, not build time — see resolvePostTimestamp.
		timestamp: resolvePostTimestamp( results, config ),
		branch: results.git?.branch || config.gitBranch || 'trunk',
	};

	// Dry run: show exactly what would be posted, then stop short of the POST.
	if ( config.dryRun ) {
		console.log( '— DRY RUN — building payload only, not posting to CodeVitals —' );
		console.log( JSON.stringify( payload, null, 2 ) );
		return { posted: false, validationFailed, payload };
	}

	// Atomic per-run posting: any sanity-check failure above already commits this run to
	// exit 2, so never live-post the surviving subset. CodeVitals is append-only and dedup
	// is opt-in (off by default), so posting survivors (e.g. a good LCP) just before the
	// build reds would re-append them as duplicate trend points when the red build is
	// retried. Posting nothing keeps the retry clean: fix the bad metric, re-run, and the
	// full set lands exactly once. The dry-run path above still prints the partial payload,
	// so CI diagnostics keep showing which metrics survived.
	if ( validationFailed ) {
		console.error(
			'✗ Skipping CodeVitals post: one or more metrics failed sanity checks; posting nothing.'
		);
		return { posted: false, validationFailed };
	}

	// Cross-commit dedup (live posts only — kept after the dry-run return so the
	// token-free CI smoke test still makes zero network calls). CodeVitals is
	// append-only, so re-testing a commit (a manual re-run, a TeamCity retryBuild,
	// or the Scheduler double-triggering) would append a second point for the same
	// hash. Skip the post if this hash already has metrics. This is gated OFF by
	// default in main() until the dedup read and write backends are reconciled (see the
	// IMPORTANT note above), so it runs here only when a caller opts in (config.skipDedup
	// false + dedupBaseUrl set);
	// the unit tests opt in by passing dedupBaseUrl, live runs via CODEVITALS_ENABLE_DEDUP.
	if ( ! config.skipDedup && config.dedupBaseUrl ) {
		if ( await hashAlreadyPosted( payload.hash, payload.branch, config ) ) {
			console.log(
				`✓ Commit ${ payload.hash } already has metrics in CodeVitals (metric ${ config.dedupMetricId }); skipping post.`
			);
			return { posted: false, skipped: true, validationFailed, payload };
		}
	}

	console.log( 'Posting metrics to CodeVitals...' );
	console.log( 'Metrics:', JSON.stringify( metrics, null, 2 ) );

	// Build the URL before attaching the token, so a malformed base host can't
	// throw a parse error that echoes the secret. The token lives only on the URL
	// object (via searchParams), never in a string we build or log.
	let url;
	try {
		url = new URL( '/api/log', config.codeVitalsUrl );
	} catch {
		throw new ValidationError( 'Invalid CodeVitals URL; check the CODEVITALS_URL setting' );
	}
	// Only http(s) can carry the POST. A file:/ftp:/etc. base parses cleanly but would
	// fail (or worse, mis-target) at fetch as a generic exit-1 transport error that
	// --allow-codevitals-failure could suppress. A wrong scheme is a local CODEVITALS_URL
	// misconfiguration, not a network outage, so fail closed (exit 2) before the token is
	// attached or fetch runs. Only the protocol is named, never the token-free URL.
	if ( url.protocol !== 'http:' && url.protocol !== 'https:' ) {
		throw new ValidationError(
			`CodeVitals URL must use http(s); got "${ url.protocol }". Check the CODEVITALS_URL setting`
		);
	}
	url.searchParams.set( 'token', config.codeVitalsToken );

	// Keep ONE abort timer armed across the whole response — fetch() headers AND the
	// response.text()/response.json() body read — and clear it in a single finally. Clearing
	// right after fetch (the old shape) left the body read unbounded, so a server that sent
	// headers then stalled the body could hang past this timeout (undici's ~300s default at
	// best). With the timer live through the body, controller.abort() makes that read reject
	// with AbortError → caught → reported as a clean timeout. This mirrors the bounded dedup
	// read in hashAlreadyPosted. Timeout is configurable (default 30s) so the body-stall
	// regression tests can use a short bound instead of waiting the full 30s.
	const TIMEOUT_MS = config.postTimeoutMs ?? 30000;
	const controller = new AbortController();
	// The finally below always clears this timer, so it is never left unused by an early
	// return/throw; the lint rule only fires because the first textual reference now lives in
	// that finally — which is the whole point of the fix (the timer must stay armed across the
	// body read, so it cannot be cleared early).
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- cleared in finally
	const timeoutId = setTimeout( () => controller.abort(), TIMEOUT_MS );

	try {
		const response = await fetch( url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( payload ),
			signal: controller.signal,
		} );

		if ( ! response.ok ) {
			const errorText = await response.text();
			// Don't log the URL as it contains the token
			throw new Error( `CodeVitals API error (${ response.status }): ${ errorText }` );
		}

		let data;
		try {
			data = await response.json();
		} catch ( jsonError ) {
			// A stalled OK body aborts as AbortError — let it through so the outer catch
			// reports the timeout, not a misleading "invalid JSON". A genuinely unparseable
			// body (any other error) keeps the invalid-JSON message.
			if ( jsonError.name === 'AbortError' ) {
				throw jsonError;
			}
			throw new Error( `CodeVitals returned invalid JSON: ${ jsonError.message }`, {
				cause: jsonError,
			} );
		}
		console.log( '✓ Metrics posted successfully to CodeVitals' );
		return { posted: true, data, validationFailed };
	} catch ( error ) {
		// Scrub the token from the caught error and its whole cause chain before we
		// log it or re-use it as `cause`. fetch/undici can echo the token-bearing
		// URL in a message or stack, so a caller that logs err.cause or
		// util.inspect( err ) would otherwise re-expose the secret. This is defense
		// in depth: safe URL construction already keeps it out of parse errors.
		sanitizeErrorChain( error, config.codeVitalsToken );
		const message =
			error.name === 'AbortError'
				? `CodeVitals request timed out after ${ TIMEOUT_MS / 1000 }s`
				: error.message;
		console.error( '✗ Failed to post metrics to CodeVitals:', message );
		// Backstop for the exit-code split: bad local data is never suppressible by
		// --allow-codevitals-failure, so a validation failure must map to the
		// data-integrity code even when the transport ALSO failed. The atomic gate above
		// means a live POST can no longer run with validationFailed set, so this stays
		// Error (exit 1) today — kept so a future re-ordering of the gate cannot
		// silently downgrade a validation failure to a suppressible exit 1.
		const ErrorClass = validationFailed ? ValidationError : Error;
		throw new ErrorClass( message, { cause: error } );
	} finally {
		clearTimeout( timeoutId );
	}
}

/**
 * Decide whether cross-commit dedup runs, from CLI args and env. Dedup is OPT-IN (off
 * by default) until the dedup read and write backends are reconciled (see
 * hashAlreadyPosted's note). An explicit
 * opt-out always wins over an opt-in, so a wrapper that forces `--dedup` can still be
 * disabled with `--no-dedup` / CODEVITALS_SKIP_DEDUP.
 *
 * NOTE: `--dedup`/`--no-dedup` only take effect when post-to-codevitals.js is invoked
 * directly. The TeamCity runner (run-performance-tests.js) does not forward CLI flags to
 * this child, so the pipeline must toggle dedup via the CODEVITALS_ENABLE_DEDUP env var.
 *
 * @param {string[]} argv - Process argv (or any arg list).
 * @param {object}   env  - Environment object (process.env or a test double).
 * @return {boolean} True when dedup should run.
 */
function resolveDedupEnabled( argv, env ) {
	// String()-coerce: process.env values are always strings, but this helper is exported,
	// so a future caller passing a non-string env double must not TypeError on toLowerCase.
	const truthy = value => [ '1', 'true', 'yes' ].includes( String( value ?? '' ).toLowerCase() );
	const optedIn = argv.includes( '--dedup' ) || truthy( env.CODEVITALS_ENABLE_DEDUP );
	const optedOut = argv.includes( '--no-dedup' ) || truthy( env.CODEVITALS_SKIP_DEDUP );
	return optedIn && ! optedOut;
}

/**
 * The env commit timestamp to trust at this (poster) entrypoint, mirroring the runner's
 * paired-override rule in resolveCommitTimestampEnv.
 *
 * GIT_COMMIT_TIMESTAMP_MS is honored ONLY as a pair with a GIT_COMMIT hash override. A
 * lone GIT_COMMIT_TIMESTAMP_MS (no GIT_COMMIT) is orphaned: trusting it would stamp the
 * results-file hash with an unrelated inherited time, so we drop it and let
 * resolvePostTimestamp fall back to results.git.timestamp (itself paired with GIT_COMMIT at
 * the measure-lcp write site, so it is provenance-matched) or build time. The runner always
 * sets GIT_COMMIT before spawning this child, so its env handoff is unaffected; this gate
 * closes the direct `pnpm report` config channel (measure-lcp closes the dominant one).
 *
 * @param {object} env - Environment object (process.env or a test double).
 * @return {string|undefined} The paired env timestamp, or undefined when unpaired.
 */
function pairedCommitTimestampMs( env ) {
	return env.GIT_COMMIT ? env.GIT_COMMIT_TIMESTAMP_MS : undefined;
}

async function main() {
	console.log( 'CodeVitals Integration' );
	console.log( '=====================\n' );

	const dryRun = process.argv.includes( '--dry-run' );
	// Cross-commit dedup is OPT-IN until the dedup read and write backends are reconciled.
	// See resolveDedupEnabled (the argv/env truth table) and hashAlreadyPosted's note for
	// why default-off matters.
	const skipDedup = ! resolveDedupEnabled( process.argv, process.env );

	// Configuration from environment
	const config = {
		// Default to the apex host. www.codevitals.run 301-redirects the API, and on a
		// 301 fetch retries a POST as a GET with no body, so the metric never lands.
		codeVitalsUrl: process.env.CODEVITALS_URL || 'https://codevitals.run',
		codeVitalsToken: process.env.CODEVITALS_TOKEN,
		gitHash: process.env.GIT_COMMIT,
		gitBranch: process.env.GIT_BRANCH || 'trunk',
		// Commit time of the code under test, in epoch ms, supplied by the runner. The
		// poster prefers results.git.timestamp and only uses this as a fallback. Honored
		// only when paired with a GIT_COMMIT hash override (see pairedCommitTimestampMs),
		// so a lone inherited timestamp can't backdate a direct `pnpm report` run.
		commitTimestampMs: pairedCommitTimestampMs( process.env ),
		resultsPath:
			process.env.RESULTS_PATH || path.join( import.meta.dirname, '../results/lcp-results.json' ),
		dryRun,
		skipDedup,
		// Read backend for the dedup check — the same gitaudit endpoint, repo, and
		// metric the Scheduler reads, so "already tested" means the same thing to both.
		dedupBaseUrl:
			process.env.CODEVITALS_DEDUP_URL || 'https://gitaudit-server-production.up.railway.app',
		dedupRepo: process.env.CODEVITALS_REPO || 'Automattic/jetpack',
		dedupMetricId: process.env.CODEVITALS_DEDUP_METRIC_ID || '58',
	};

	// A live post needs a token; a dry run does not, so CI can smoke-test it.
	if ( ! dryRun && ! config.codeVitalsToken ) {
		console.error( 'ERROR: CODEVITALS_TOKEN environment variable is required' );
		process.exit( 1 );
	}

	console.log( 'Configuration:' );
	console.log( `  Mode: ${ dryRun ? 'DRY RUN (no POST)' : 'live post' }` );
	console.log( `  CodeVitals URL: ${ config.codeVitalsUrl }` );
	console.log( `  Results Path: ${ config.resultsPath }` );
	console.log( `  Git Hash: ${ config.gitHash || 'unknown' }` );
	console.log( `  Git Branch: ${ config.gitBranch }` );
	console.log(
		`  Dedup: ${
			dryRun || config.skipDedup
				? 'off (opt in with CODEVITALS_ENABLE_DEDUP=1 once the dedup read and write backends are reconciled)'
				: `on (metric ${ config.dedupMetricId } @ ${ config.dedupBaseUrl })`
		}`
	);
	console.log( '' );

	try {
		const result = await postToCodeVitals( config.resultsPath, config );
		if ( result.validationFailed ) {
			console.error(
				'\n✗ One or more metrics failed sanity checks (see above). Nothing was posted.'
			);
			// Exit with the data-integrity code so the runner always fails the build
			// here, even under --allow-codevitals-failure (that flag is for outages).
			process.exit( VALIDATION_FAILED_EXIT_CODE );
		}
		console.log( dryRun ? '\n✓ Dry run complete!' : '\n✓ All done!' );
		process.exit( 0 );
	} catch ( error ) {
		console.error( '\n✗ Failed:', error.message );
		// A scenario misconfiguration (ValidationError) is local bad data and must
		// always fail the build, exactly like an out-of-range metric — not a
		// suppressible exit 1. exitCodeForError encodes that split.
		process.exit( exitCodeForError( error ) );
	}
}

/**
 * Whether this module was run directly (`node post-to-codevitals.js`) rather than imported.
 *
 * Compares real filesystem paths so spaces, non-ASCII characters, and symlinks
 * (e.g. /tmp → /private/tmp) cannot make the match fail and silently skip main().
 * A raw ``file://${ process.argv[1] }`` comparison breaks on all three: Node
 * percent-encodes and symlink-resolves import.meta.url but argv[1] stays raw.
 *
 * @param {string|undefined} moduleFilename - Absolute path of this module (import.meta.filename).
 * @param {string|undefined} invokedPath    - The path Node was invoked with (process.argv[1]).
 * @return {boolean} True when both resolve to the same file.
 */
function isDirectInvocation( moduleFilename, invokedPath ) {
	if ( ! moduleFilename || ! invokedPath ) {
		return false;
	}
	try {
		return fs.realpathSync( moduleFilename ) === fs.realpathSync( invokedPath );
	} catch {
		// realpathSync throws when invokedPath does not exist (e.g. `node --test`).
		return false;
	}
}

// Run only when executed directly, not when imported (e.g. by the unit tests),
// so importing the pure helpers does not trigger main()'s env checks or exits.
if ( isDirectInvocation( import.meta.filename, process.argv[ 1 ] ) ) {
	main();
}

export {
	postToCodeVitals,
	checkSanityRange,
	extractScenarioMetrics,
	exitCodeForError,
	isDirectInvocation,
	redactToken,
	resolvePostTimestamp,
	hashAlreadyPosted,
	resolveDedupEnabled,
	pairedCommitTimestampMs,
	ValidationError,
	VALIDATION_FAILED_EXIT_CODE,
};
