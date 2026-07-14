/**
 * Measure page performance for a WordPress wp-admin scenario: LCP (via PerformanceObserver),
 * TTFB, FCP, and the summed runtime bundle size (decodedBytesKB). Logs in, then reloads either
 * the wp-admin Dashboard (default) or a scenario's targeted admin page, and captures the metrics.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { isDirectInvocation, pairedCommitTimestampMs } from './post-to-codevitals.js';
import { SCENARIOS, getScenarioUrl } from './scenarios.js';
import { median as calcMedian, mean as calcMean, stdDev as calcStdDev } from './stats.js';

const __dirname = import.meta.dirname;

// Calibration file path
const CALIBRATION_FILE = path.join( __dirname, '..', 'calibration.json' );

/** Load calibration data if available. */
function loadCalibration() {
	try {
		if ( fs.existsSync( CALIBRATION_FILE ) ) {
			const data = JSON.parse( fs.readFileSync( CALIBRATION_FILE, 'utf8' ) );
			if ( data.cpuRate && typeof data.cpuRate === 'number' ) {
				return data;
			}
		}
	} catch ( err ) {
		console.warn( 'Warning: Failed to load calibration file:', err.message );
	}
	return null;
}

// Load calibration at module init
const calibration = loadCalibration();

/**
 * Measure LCP (and the other summary fields) for a scenario's page.
 *
 * Defaults to the wp-admin Dashboard flow (log in, reload, measure). When the scenario
 * targets a specific admin page, `scenario.path` + `scenario.waitForSelector` steer it to
 * that page after login and wait for the page's own ready signal (SPA hydration included)
 * before measuring. Absent path/selector, the Dashboard flow is unchanged.
 *
 * @param {string} url        - Base site URL (no trailing path).
 * @param {string} username   - wp-admin username.
 * @param {string} password   - wp-admin password.
 * @param {number} iterations - Number of measurement iterations.
 * @param {object} [scenario] - Scenario config; reads optional `path`, `waitForSelector`,
 *                            `expectUrlIncludes`, and `minResourceCount`.
 * @return {Promise<object>} { summary, results, url }.
 */
async function measureLCP( url, username, password, iterations = 5, scenario = {} ) {
	const results = [];

	// Optional page navigation: when a scenario targets a specific admin page (not the wp-admin
	// Dashboard default), go there after login and wait for its own ready selector before
	// measuring. Absent path/selector, targetPath stays null and the Dashboard flow is unchanged.
	const targetPath = scenario.path || null;
	const pageReadySelector = scenario.waitForSelector || null;
	// A substring the final URL MUST contain (after any server redirect / client route). Guards
	// against measuring the wrong page — e.g. a bare Forms URL redirecting to /forms instead of
	// the responses inbox — which would populate this scenario's permanent keys from off-target.
	const expectUrlIncludes = scenario.expectUrlIncludes || null;

	console.log( `Measuring LCP for ${ url }${ targetPath || '' } (${ iterations } iterations)...` );

	for ( let i = 0; i < iterations; i++ ) {
		const browser = await chromium.launch( {
			headless: true,
			args: [ '--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu' ],
		} );

		const context = await browser.newContext( {
			viewport: { width: 1920, height: 1080 },
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		} );

		const page = await context.newPage();

		// Create CDP session for CPU throttling
		if ( calibration?.cpuRate ) {
			const cdpSession = await context.newCDPSession( page );
			await cdpSession.send( 'Emulation.setCPUThrottlingRate', {
				rate: calibration.cpuRate,
			} );
			if ( i === 0 ) {
				// Log confirmation on first iteration only
				console.log( `    [Throttling applied: ${ calibration.cpuRate }x via CDP]` );
			}
		}

		try {
			console.log( `  Iteration ${ i + 1 }/${ iterations }...` );

			// Step 1: Log in to WordPress (not measured)
			await page.goto( `${ url }/wp-login.php`, {
				waitUntil: 'networkidle',
				timeout: 60000,
			} );

			// Fill login form
			await page.fill( '#user_login', username );
			await page.fill( '#user_pass', password );

			// Submit and wait for dashboard navigation to complete
			// Using waitForURL avoids race condition where navigation completes before waitForNavigation is set up
			await Promise.all( [
				page.waitForURL( '**/wp-admin/**', { waitUntil: 'networkidle', timeout: 60000 } ),
				page.click( '#wp-submit', { timeout: 60000 } ),
			] );

			// Confirm login landed in wp-admin (the Dashboard is the post-login screen).
			await page.waitForSelector( '#dashboard-widgets, #wpbody', { timeout: 30000 } );

			// Step 1b: For a page-targeted scenario, navigate to that page and wait for its own
			// ready selector before measuring. The Dashboard scenario has no path and skips this.
			if ( targetPath ) {
				await page.goto( `${ url }${ targetPath }`, {
					waitUntil: 'networkidle',
					timeout: 60000,
				} );
				await page.waitForSelector( pageReadySelector, { timeout: 30000 } );
			}

			// Step 2: Set up LCP capture using addInitScript
			// This injects code that runs BEFORE any page script on every navigation
			/* eslint-disable no-undef -- This runs in browser context via Playwright */
			await context.addInitScript( () => {
				// This runs in the browser context before page load

				// Raise the Resource Timing buffer well above the default 250 entries. This metric
				// exists to watch a GROWING count of @wordpress/* editor module files, so the
				// measured quantity and the default cap would collide exactly as the tracked
				// regression worsens — past 250 the tail would drop and the decoded-bytes sum would
				// silently under-count. (~79 resources today; this is headroom, not a live fix.)
				performance.setResourceTimingBufferSize( 10000 );

				window.__lcpEntries = [];
				window.__lcpObserver = new PerformanceObserver( list => {
					const entries = list.getEntries();
					for ( const entry of entries ) {
						window.__lcpEntries.push( {
							startTime: entry.startTime,
							element: entry.element?.tagName || 'unknown',
							size: entry.size,
							url: entry.url,
						} );
					}
				} );
				window.__lcpObserver.observe( { type: 'largest-contentful-paint', buffered: true } );
			} );
			/* eslint-enable no-undef */

			// Step 3: Reload for a clean measurement of the current page — the Dashboard, or the
			// page navigated to above.
			await page.reload( { waitUntil: 'networkidle', timeout: 60000 } );

			// Wait for the measured page's content to be present after reload.
			if ( pageReadySelector ) {
				await page.waitForSelector( pageReadySelector, { timeout: 30000 } );
				// A wp-build SPA mounts its root element before React fills it, so "exists" isn't
				// "rendered". Wait for the root to actually hydrate (gain children) so LCP and the
				// resource payload reflect the rendered page, not an empty shell.
				/* eslint-disable no-undef -- This runs in browser context via Playwright */
				await page.waitForFunction(
					sel => {
						const el = document.querySelector( sel );
						return el && el.childElementCount > 0;
					},
					pageReadySelector,
					{ timeout: 30000 }
				);
				/* eslint-enable no-undef */
			} else {
				// Dashboard: wait for content to be visible (unchanged).
				await page.waitForSelector( '#dashboard-widgets, #wpbody-content', { timeout: 30000 } );
			}

			// Wait for network to settle and LCP to finalize
			// LCP stops updating after user input or visibility change
			// Using networkidle is more reliable than a fixed timeout on slow systems
			await page.waitForLoadState( 'networkidle', { timeout: 30000 } );

			// Additional short wait for any final rendering after network settles
			await page.waitForTimeout( 500 );

			// Refuse to measure the wrong page. Asserted here (after every redirect and the client
			// route settle) so a mis-targeted or redirected page fails the iteration instead of
			// posting off-target bytes to this scenario's permanent, no-rollback CodeVitals keys.
			assertExpectedUrl( page.url(), expectUrlIncludes );

			// Collect all metrics
			/* eslint-disable no-undef -- This runs in browser context via Playwright */
			const metrics = await page.evaluate( () => {
				// Disconnect observer to finalize LCP
				if ( window.__lcpObserver ) {
					window.__lcpObserver.disconnect();
				}

				// Get the last (final) LCP entry
				const lcpEntry =
					window.__lcpEntries && window.__lcpEntries.length > 0
						? window.__lcpEntries[ window.__lcpEntries.length - 1 ]
						: null;

				// Fallback: try to get from performance API directly
				let lcp = lcpEntry ? lcpEntry.startTime : null;
				let lcpElement = lcpEntry ? lcpEntry.element : null;
				let lcpSize = lcpEntry ? lcpEntry.size : null;

				if ( lcp === null ) {
					const entries = performance.getEntriesByType( 'largest-contentful-paint' );
					if ( entries.length > 0 ) {
						const entry = entries[ entries.length - 1 ];
						lcp = entry.startTime;
						lcpElement = entry.element?.tagName || 'unknown';
						lcpSize = entry.size;
					}
				}

				// Get navigation timing
				const navEntries = performance.getEntriesByType( 'navigation' );
				const navigation = navEntries.length > 0 ? navEntries[ 0 ] : null;

				// Get paint timing
				const paintEntries = performance.getEntriesByType( 'paint' );
				const fcp = paintEntries.find( p => p.name === 'first-contentful-paint' );
				const fp = paintEntries.find( p => p.name === 'first-paint' );

				return {
					// LCP - primary metric
					lcp: lcp,
					lcpElement: lcpElement,
					lcpSize: lcpSize,
					lcpEntriesCount: window.__lcpEntries ? window.__lcpEntries.length : 0,

					// Other Core Web Vitals
					fcp: fcp ? fcp.startTime : null,
					fp: fp ? fp.startTime : null,

					// Navigation timing
					domContentLoaded: navigation ? navigation.domContentLoadedEventEnd : null,
					loadEventEnd: navigation ? navigation.loadEventEnd : null,
					domInteractive: navigation ? navigation.domInteractive : null,
					ttfb: navigation ? navigation.responseStart : null,

					// Size metrics for the NAVIGATION DOCUMENT ONLY (the HTML response). This
					// decodedBodySize is NOT the bundle-size metric — that one (decodedBytesKB) is
					// the sum across every resource, computed in the resourceStats block below.
					transferSize: navigation ? navigation.transferSize : null,
					encodedBodySize: navigation ? navigation.encodedBodySize : null,
					decodedBodySize: navigation ? navigation.decodedBodySize : null,
				};
			} );

			// Gather the raw per-resource timing entries in the browser, then sum them in Node via
			// summarizeResources() so the bundle-size arithmetic (the load-bearing decodedBodySize
			// fold) is a pure, unit-tested function instead of untested inline browser code. Only the
			// three fields the summary reads cross the CDP boundary.
			const rawResources = await page.evaluate( () =>
				performance.getEntriesByType( 'resource' ).map( r => ( {
					initiatorType: r.initiatorType,
					transferSize: r.transferSize,
					decodedBodySize: r.decodedBodySize,
				} ) )
			);
			/* eslint-enable no-undef */
			const resourceStats = summarizeResources( rawResources );

			// Validate we got an LCP value
			if ( metrics.lcp === null || metrics.lcp === undefined ) {
				throw new Error(
					'LCP measurement not available - page may not have rendered visible content'
				);
			}

			// Refuse a partial capture before its bundle size can reach a permanent key.
			assertCaptureComplete( resourceStats, scenario );

			results.push( {
				iteration: i + 1,
				lcp: metrics.lcp,
				// Fold the summed decoded payload into the per-iteration metrics block (as KB) so
				// readIterationField/buildSummary aggregate it alongside lcp/ttfb/fcp. It lives on
				// resourceStats too (the `resources` block below) for the saved results file.
				metrics: { ...metrics, decodedBytesKB: resourceStats.totalDecodedBodySizeKB },
				resources: resourceStats,
				timestamp: new Date().toISOString(),
			} );

			console.log(
				`    LCP: ${ metrics.lcp.toFixed( 2 ) }ms (element: ${ metrics.lcpElement }, entries: ${
					metrics.lcpEntriesCount
				})`
			);
		} catch ( error ) {
			console.error( `  Iteration ${ i + 1 } failed:`, error.message );
			results.push( {
				iteration: i + 1,
				error: error.message,
				timestamp: new Date().toISOString(),
			} );
		} finally {
			await browser.close();
		}

		// Delay between iterations
		if ( i < iterations - 1 ) {
			await new Promise( resolve => setTimeout( resolve, 2000 ) );
		}
	}

	return finalizeMeasurement( scenario, results, iterations, url );
}

/**
 * Metric fields aggregated into the summary. LCP stays first: it is the load-bearing
 * value (unchanged), and it also populates the flat top-level summary for backward-compat.
 * TTFB and FCP are already captured per iteration (see the page.evaluate block above);
 * this is where they finally get aggregated into the summary.
 *
 * `decodedBytesKB` is the summed per-resource decodedBodySize (folded into the per-iteration
 * metrics block above): the page's runtime payload in KB. Unlike the timing fields it is
 * deterministic — throttle- and noise-independent — so the median across iterations is exact.
 * It is aggregated for every scenario but posted only by those that list it in `metrics[]`;
 * scenarios that don't (the dashboard) keep it as diagnostic data in `results.json` and never
 * send it to CodeVitals.
 */
const SUMMARY_FIELDS = [ 'lcp', 'ttfb', 'fcp', 'decodedBytesKB' ];

/**
 * Read one metric field from a single iteration's result.
 *
 * LCP lives at the top level (r.lcp) exactly as before, so its value source is byte-for-byte
 * unchanged; the other Core Web Vitals come from the captured per-iteration `metrics` block.
 *
 * @param {object} result - One entry from the measureLCP results array.
 * @param {string} field  - Metric field name (e.g. 'lcp', 'ttfb', 'fcp').
 * @return {number|null|undefined} The raw value, or null/undefined when the browser had none.
 */
function readIterationField( result, field ) {
	if ( field === 'lcp' ) {
		return result.lcp;
	}
	return result.metrics ? result.metrics[ field ] : null;
}

/**
 * Summary stats for one field across the valid iterations, rounded to whole ms to match
 * the original LCP-only summary. Non-finite samples (a browser that reported null for a
 * field on some iteration) are dropped before aggregating. A field whose finite samples do
 * not cover a MAJORITY of the valid iterations returns null so the caller omits it and the
 * poster fails closed on the missing field rather than posting a fabricated 0 — or, worse, a
 * thin value (e.g. a field captured on 1 of 5 runs) as a full "median" with stdDev 0, a
 * low-confidence point indistinguishable from a real full-sample median in the append-only store.
 *
 * @param {Array<number|null|undefined>} values - Raw per-iteration values for the field.
 * @return {{median:number,mean:number,min:number,max:number,stdDev:number}|null} Rounded stats, or null.
 */
function summarizeField( values ) {
	const finite = values.filter( v => typeof v === 'number' && Number.isFinite( v ) );
	// Require a STRICT majority of the valid iterations to have produced a finite sample:
	// finite*2 > n. This keeps single-iteration runs working (1 of 1) while rejecting a thin
	// field that would otherwise post a lone/minority sample as a trend point — including the
	// even-count edge (1 of 2, 2 of 4) that a ceil(n/2) floor would let slip through. n=0 also
	// falls through to null (0 > 0 is false). LCP is unaffected in practice: it is finite on
	// every valid iteration by construction (validResults already filtered out null LCP).
	if ( finite.length * 2 <= values.length ) {
		return null;
	}
	return {
		median: Math.round( calcMedian( finite ) ),
		mean: Math.round( calcMean( finite ) ),
		min: Math.round( Math.min( ...finite ) ),
		max: Math.round( Math.max( ...finite ) ),
		stdDev: Math.round( calcStdDev( finite ) ),
	};
}

/**
 * Build the measurement summary from the per-iteration results.
 *
 * Produces a nested `summary.<field>` block ({ median, mean, min, max, stdDev }) for every
 * field with finite samples, AND mirrors the LCP block's stats flat on the summary root for
 * backward-compat: the poster's legacy `metricKey` path and older dashboards read
 * `summary.median` directly, and it must keep returning the same LCP number as before.
 *
 * @param {Array}    validResults - Iteration results already filtered to successful runs.
 * @param {number}   iterations   - Total iterations attempted (for the summary counters).
 * @param {string[]} [fields]     - Metric fields to aggregate (defaults to SUMMARY_FIELDS).
 * @return {object} The summary object.
 */
function buildSummary( validResults, iterations, fields = SUMMARY_FIELDS ) {
	const perField = {};
	for ( const field of fields ) {
		const stats = summarizeField( validResults.map( r => readIterationField( r, field ) ) );
		if ( stats ) {
			perField[ field ] = stats;
		}
	}
	return {
		// Flat top-level LCP stats, mirrored for backward-compat (legacy metricKey path +
		// older readers of summary.median). Nothing above enforces a FINITE LCP (the
		// validResults filter only drops null/undefined), so in the degenerate case where
		// every LCP sample is non-finite, perField.lcp is absent: the flat mirror is
		// simply omitted and findIncompleteSummaryFields() classifies the scenario as a
		// measurement failure (the poster's undefined-median rejection is the backstop
		// for stale artifacts).
		...( perField.lcp ?? {} ),
		successfulIterations: validResults.length,
		totalIterations: iterations,
		// Per-field nested blocks for the multi-metric poster path (reads summary.<field>.median).
		...perField,
	};
}

/**
 * Names of the posted fields a scenario's summary failed to aggregate.
 *
 * A summary can be truthy yet incomplete: summarizeField() returns null for a field whose
 * finite samples miss a strict majority of the valid iterations (the flaky-page case the
 * `optional` flag exists for), so buildSummary() omits that field's block entirely. The
 * poster reads summary.<field>.median for every scenario.metrics[] entry; an omitted block
 * reaches it as undefined, fails the sanity-range check, and — because the sanity gate is
 * deliberately atomic — blanks the ENTIRE post, required survivors included. An incomplete
 * summary is a MEASUREMENT failure, not a data-integrity event, so finalizeMeasurement()
 * below throws on it and main()'s catch records a scenario error, where the `optional`
 * flag can isolate it and the skipped-scenario warnings name the culprit. Scenarios
 * without a metrics[] array (legacy
 * metricKey/metricPrefix shapes) post from the flat LCP mirror, covered by the 'lcp'
 * fallback.
 *
 * @param {object} scenario - Scenario definition; its metrics[] names the posted fields.
 * @param {object} summary  - Summary produced by buildSummary().
 * @return {string[]} Posted fields with no finite median (empty when the summary is complete).
 */
function findIncompleteSummaryFields( scenario, summary ) {
	const fields = Array.isArray( scenario.metrics )
		? scenario.metrics.map( metric => metric.field )
		: [ 'lcp' ];
	return fields.filter( field => ! Number.isFinite( summary?.[ field ]?.median ) );
}

/**
 * Turn the raw per-iteration results into the scenario's final measurement, or throw.
 *
 * The tail of measureLCP(), extracted pure so its two refusal paths are unit-testable
 * without a browser: (1) no valid iterations at all; (2) an INCOMPLETE summary — a posted
 * field dropped by summarizeField's majority rule. Both must throw INSIDE the measure
 * step, so main()'s catch records a scenario error the optional/required policy can
 * classify. An incomplete summary let through would green this step with no warning
 * naming the scenario, then trip the poster's atomic sanity gate on the undefined
 * median — one flaky optional field blanking the whole post, required survivors included.
 *
 * @param {object} scenario   - Scenario definition; its metrics[] names the posted fields.
 * @param {Array}  results    - Raw per-iteration results (successes and error records).
 * @param {number} iterations - Total iterations attempted (for the summary counters).
 * @param {string} url        - The measured URL, echoed into the saved measurement.
 * @return {object} The measurement: `{ summary, results, url }`.
 */
function finalizeMeasurement( scenario, results, iterations, url ) {
	const validResults = results.filter( r => ! r.error && r.lcp != null );

	if ( validResults.length === 0 ) {
		throw new Error(
			'All iterations failed - check WordPress is accessible and credentials are correct'
		);
	}

	const summary = buildSummary( validResults, iterations );
	const incompleteFields = findIncompleteSummaryFields( scenario, summary );
	if ( incompleteFields.length > 0 ) {
		throw new Error(
			`summary is missing posted field(s): ${ incompleteFields.join( ', ' ) } — ` +
				`too few finite samples across the ${ validResults.length } valid iteration(s)`
		);
	}

	return { summary, results, url };
}

/**
 * Sum a page's resource-timing entries into the bundle-size stats.
 *
 * This is the load-bearing arithmetic behind the decodedBytesKB metric, lifted out of the browser
 * capture so it is unit-testable in Node. It sums the DECODED (uncompressed) size of every resource,
 * NOT transferSize: the measured load is a warm-cache page.reload(), where cached resources report
 * transferSize:0, and the Docker WordPress serves uncompressed, so transferSize would neither survive
 * caching nor match real gzipped bytes. decodedBodySize is cache- and compression-independent, so it
 * stays stable however assets are served — the right denominator for the runtime-payload
 * (downloaded-but-unexecuted `@wordpress/editor`) regression this metric tracks. A missing/undefined
 * size counts as 0 and a missing initiatorType buckets as 'other', matching the browser's behavior.
 *
 * @param {Array<object>} resources - Raw resource-timing entries; each may carry `initiatorType`,
 *                                  `transferSize`, and `decodedBodySize` (all optional — the only three fields the summary reads).
 * @return {object} Aggregated stats: `totalRequests`, `totalTransferSizeKB`, `totalDecodedBodySizeKB`,
 * and `byType` (request count per initiatorType). decodedBytesKB is folded from totalDecodedBodySizeKB.
 */
function summarizeResources( resources ) {
	const byType = {};
	let totalTransferSize = 0;
	let totalDecodedBodySize = 0;

	resources.forEach( r => {
		const type = r.initiatorType || 'other';
		byType[ type ] = ( byType[ type ] || 0 ) + 1;
		totalTransferSize += r.transferSize || 0;
		totalDecodedBodySize += r.decodedBodySize || 0;
	} );

	return {
		totalRequests: resources.length,
		totalTransferSizeKB: Math.round( totalTransferSize / 1024 ),
		totalDecodedBodySizeKB: Math.round( totalDecodedBodySize / 1024 ),
		byType,
	};
}

/**
 * Content-completeness guard for the bundle-size metric. When a scenario declares the minimum
 * resource count a healthy load produces (`minResourceCount`), throw if the capture returned
 * fewer — a hydrated-but-partial page, or a `networkidle` window that settled in a gap before
 * async resources finished, would otherwise post an in-range-but-undercounted `decodedBytesKB`
 * to a permanent, no-rollback key.
 *
 * A COUNT floor is deliberate, NOT an "editor asset is present" assertion: the metric is meant
 * to fall when the editor payload is lazy-loaded, and that removes a few large files rather than
 * the bulk of the count, so this catches a broken capture without clipping the very improvement
 * it exists to record. A scenario with no `minResourceCount` (e.g. the Dashboard) is unaffected.
 *
 * @param {{totalRequests:number}}     resourceStats - The per-iteration resource stats.
 * @param {{minResourceCount?:number}} scenario      - The scenario config.
 * @throws {Error} When the captured resource count is below the scenario's floor.
 */
function assertCaptureComplete( resourceStats, scenario ) {
	if ( scenario.minResourceCount && resourceStats.totalRequests < scenario.minResourceCount ) {
		throw new Error(
			`Incomplete capture: ${ resourceStats.totalRequests } resources < expected minimum ${ scenario.minResourceCount } — refusing to post a partial page's bundle size`
		);
	}
}

/**
 * Refuse to measure the wrong page.
 *
 * Scope, on purpose: this catches a page whose FINAL URL no longer contains the expected route —
 * the concrete threat here is class-dashboard.php server-redirecting a bare page URL to the forms
 * LIST, which strips the pinned `p=/responses/inbox` from the URL, so this fires. It does NOT prove
 * the SPA client-rendered the inbox: a client-side route divergence that keeps the URL would pass.
 * That is a deliberate trade — a stricter DOM-selector assertion would throw on every iteration if
 * the guessed selector is wrong or the markup shifts, which blackholes the scenario's whole series
 * on the append-only store. The URL check defends the real redirect without that failure mode.
 *
 * decodeURIComponent can throw on a malformed URL; we catch and re-throw as a mis-target so the
 * iteration fails closed (no post) with a clear message rather than an opaque URIError.
 *
 * @param {string}      currentUrl        - The page's final URL (page.url()).
 * @param {string|null} expectUrlIncludes - Substring the final URL must contain, or null to skip.
 * @throws {Error} When the final URL does not contain the expected route (or cannot be decoded).
 */
function assertExpectedUrl( currentUrl, expectUrlIncludes ) {
	if ( ! expectUrlIncludes ) {
		return;
	}
	let finalUrl;
	try {
		finalUrl = decodeURIComponent( currentUrl );
	} catch ( e ) {
		throw new Error(
			`Wrong page: could not decode final URL "${ currentUrl }" to check for "${ expectUrlIncludes }" (${ e.message })`,
			{ cause: e }
		);
	}
	if ( ! finalUrl.includes( expectUrlIncludes ) ) {
		throw new Error(
			`Wrong page: expected URL to include "${ expectUrlIncludes }" but landed on "${ finalUrl }"`
		);
	}
}

/**
 * Resolve the SCENARIO filter to the set of scenarios to run.
 *
 * Fails fast on a filter that matches nothing (e.g. the typo `SCENARIO=my-jetpak`).
 * Before this guard, an unknown value silently matched zero scenarios: the run wrote an
 * empty measurements object and exited 0 — a green build that measured and posted nothing.
 *
 * @param {string}        scenarioFilter - The SCENARIO env value ('all' or a scenario cliName).
 * @param {Array<object>} scenarios      - Scenario definitions (SCENARIOS, or a test double).
 * @return {Array<object>} The scenarios to run. Non-empty when filtered by cliName; the
 * 'all' passthrough returns the caller's array verbatim.
 * @throws {Error} When the filter matches no scenario; the message lists the valid values.
 */
function resolveScenarioSet( scenarioFilter, scenarios ) {
	if ( scenarioFilter === 'all' ) {
		return scenarios;
	}
	const matched = scenarios.filter( s => s.cliName === scenarioFilter );
	if ( matched.length === 0 ) {
		const valid = [ 'all', ...scenarios.map( s => s.cliName ) ].join( ', ' );
		throw new Error( `Unknown SCENARIO "${ scenarioFilter }". Valid values: ${ valid }` );
	}
	return matched;
}

/**
 * Decide the process exit code from the per-scenario measurement outcomes.
 *
 * The posting policy lives here, once: exit 0 means "every required scenario measured —
 * safe to post". The runner treats a non-zero exit as fatal and never reaches the posting
 * step, which is the retry-safety invariant: a red build has posted nothing, so re-running
 * it cannot append duplicate points to the append-only, dedup-off CodeVitals store. A
 * failed `optional` scenario therefore must NOT fail the build — it warns, its keys skip
 * the build, and the poster skips its errored measurement. Two deliberate hard edges:
 * every scenario in the run set failed → exit 1 even when all of them are optional, so a
 * targeted single-scenario run (SCENARIO=forms-responses) still fails loudly; and empty
 * measurements → exit 1 (backstop; resolveScenarioSet already rejects a filter that
 * matches nothing).
 *
 * @param {Object<string, {error?: string}>} measurements - Per-scenario results, keyed by scenario key.
 * @param {Array<object>}                    scenarios    - Scenario definitions (only those present in measurements count).
 * @return {{exitCode: number, requiredFailures: string[], optionalFailures: string[]}} The outcome; failure arrays carry scenario names.
 */
function computeRunOutcome( measurements, scenarios ) {
	const requiredFailures = [];
	const optionalFailures = [];
	let successes = 0;
	for ( const scenario of scenarios ) {
		const measurement = measurements[ scenario.key ];
		if ( ! measurement ) {
			continue; // Not part of this run (SCENARIO filter).
		}
		if ( measurement.error ) {
			( scenario.optional ? optionalFailures : requiredFailures ).push( scenario.name );
		} else {
			successes++;
		}
	}
	const exitCode = requiredFailures.length > 0 || successes === 0 ? 1 : 0;
	return { exitCode, requiredFailures, optionalFailures };
}

async function main() {
	const username = process.env.WP_ADMIN_USER || 'admin';
	const password = process.env.WP_ADMIN_PASS || 'password';
	const iterations = parseInt( process.env.ITERATIONS || '5', 10 );
	const scenarioFilter = process.env.SCENARIO || 'all';

	// Validate the filter before any browser work: a typo must fail the build, not
	// green-exit with zero measurements.
	let scenariosToRun;
	try {
		scenariosToRun = resolveScenarioSet( scenarioFilter, SCENARIOS );
	} catch ( error ) {
		console.error( `✗ ${ error.message }` );
		process.exit( 1 );
	}

	console.log( 'WordPress Performance Testing - LCP Measurement' );
	console.log( '================================================' );
	console.log( '' );

	// Log calibration status with detailed verification
	console.log( 'CPU Throttling Status:' );
	console.log( `  Calibration file: ${ CALIBRATION_FILE }` );
	console.log( `  File exists: ${ fs.existsSync( CALIBRATION_FILE ) }` );

	if ( calibration ) {
		console.log( `  Status: ENABLED` );
		console.log( `  Throttle rate: ${ calibration.cpuRate }x` );
		console.log( `  Target score: ${ calibration.targetScore }` );
		console.log( `  Calibrated at: ${ calibration.calibratedAt }` );
		console.log( `  Samples: ${ calibration.samples?.join( ', ' ) || 'N/A' }` );
	} else {
		console.log( `  Status: DISABLED (no valid calibration.json found)` );
		console.log( '  Warning: Results may vary between machines.' );
		console.log( '  Run "pnpm calibrate" to enable consistent throttling.' );
	}
	console.log( '' );

	console.log( 'Methodology:' );
	console.log( '  1. Log in to WordPress' );
	console.log(
		'  2. Reload the scenario page (Dashboard, or a targeted admin page) for a clean load'
	);
	console.log( '  3. Measure LCP, TTFB, FCP, and the summed bundle size' );
	console.log( '' );
	console.log( 'Configuration:' );
	for ( const scenario of SCENARIOS ) {
		console.log( `  ${ scenario.name } URL: ${ getScenarioUrl( scenario ) }` );
	}
	console.log( `  Username: ${ username }` );
	console.log( `  Iterations: ${ iterations }` );
	console.log( `  Scenario: ${ scenarioFilter }` );
	console.log( '' );

	const measurements = {};

	// Run each scenario in the resolved set
	for ( const scenario of scenariosToRun ) {
		const url = getScenarioUrl( scenario );

		console.log( scenario.header );
		console.log( '-'.repeat( scenario.header.length ) );

		try {
			measurements[ scenario.key ] = await measureLCP(
				url,
				username,
				password,
				iterations,
				scenario
			);
			console.log(
				`✓ ${ scenario.name } median LCP: ${ measurements[ scenario.key ].summary.median }ms\n`
			);
		} catch ( error ) {
			console.error( `✗ ${ scenario.name } measurement failed:`, error.message, '\n' );
			// Guarantee a truthy error record: computeRunOutcome classifies failure by the
			// truthiness of `.error`, so a thrown Error('') (falsy .message) must not let a
			// failed required scenario slip into the success branch and green the build.
			measurements[ scenario.key ] = {
				error: error?.message || String( error ) || 'measurement failed',
			};
		}
	}

	// Print summary
	console.log( 'Summary' );
	console.log( '=======' );
	for ( const scenario of SCENARIOS ) {
		const measurement = measurements[ scenario.key ];
		if ( ! measurement ) {
			continue;
		}
		if ( measurement && ! measurement.error ) {
			console.log( `  ${ scenario.name }: ${ measurement.summary.median }ms` );
		} else if ( scenario.optional ) {
			console.log(
				`  ${ scenario.name }: FAILED (optional — build continues, its keys skip this build) - ${
					measurement?.error || 'unknown error'
				}`
			);
		} else {
			console.log(
				`  ${ scenario.name }: FAILED (required — build fails, nothing posts) - ${
					measurement?.error || 'unknown error'
				}`
			);
		}
	}
	console.log( '' );

	// Save results
	const outputPath =
		process.env.OUTPUT_PATH || path.join( __dirname, '../results/lcp-results.json' );
	const dir = path.dirname( outputPath );

	if ( ! fs.existsSync( dir ) ) {
		fs.mkdirSync( dir, { recursive: true } );
	}

	const output = {
		timestamp: new Date().toISOString(),
		metric: 'LCP',
		methodology: 'Login then refresh dashboard for clean measurement',
		config: {
			iterations,
			scenario: scenarioFilter,
			cpuThrottling: calibration
				? {
						enabled: true,
						rate: calibration.cpuRate,
						calibratedAt: calibration.calibratedAt,
				  }
				: { enabled: false },
		},
		measurements,
		git: resolveResultsGit( process.env ),
	};

	fs.writeFileSync( outputPath, JSON.stringify( output, null, 2 ) );
	console.log( `Results saved to: ${ outputPath }` );

	const outcome = computeRunOutcome( measurements, SCENARIOS );
	if ( outcome.exitCode === 0 && outcome.optionalFailures.length > 0 ) {
		console.warn(
			`Warning: optional scenario(s) failed — their CodeVitals keys skip this build: ${ outcome.optionalFailures.join(
				', '
			) }`
		);
	}
	process.exit( outcome.exitCode );
}

/**
 * Build the `git` block written into the results file from the environment.
 *
 * The commit time is stamped ONLY when paired with a GIT_COMMIT hash, via the shared
 * pairedCommitTimestampMs rule (mirrors the runner's resolveCommitTimestampEnv and the
 * poster's config gate). This is the DOMINANT timestamp channel: the poster PREFERS this
 * results.git.timestamp over its own env fallback, so a lone/stale inherited
 * GIT_COMMIT_TIMESTAMP_MS written here would backdate the append-only trend regardless of
 * the poster-side guard. A lone value is dropped to undefined (JSON.stringify omits it);
 * the poster then warns and falls back to build time.
 *
 * @param {object} env - Environment object (process.env or a test double).
 * @return {{hash: string, branch: string, timestamp: (number|undefined)}} The results git block.
 */
function resolveResultsGit( env ) {
	return {
		hash: env.GIT_COMMIT || 'unknown',
		branch: env.GIT_BRANCH || 'unknown',
		timestamp: Number( pairedCommitTimestampMs( env ) ) || undefined,
	};
}

// Run only when executed directly (node measure-lcp.js / pnpm measure), not when imported
// by the unit tests, so importing resolveResultsGit never launches a browser via main().
if ( isDirectInvocation( import.meta.filename, process.argv[ 1 ] ) ) {
	main().catch( error => {
		console.error( 'Fatal error:', error );
		process.exit( 1 );
	} );
}

export {
	measureLCP,
	resolveResultsGit,
	buildSummary,
	findIncompleteSummaryFields,
	finalizeMeasurement,
	assertCaptureComplete,
	assertExpectedUrl,
	summarizeResources,
	resolveScenarioSet,
	computeRunOutcome,
};
