/**
 * Measure Largest Contentful Paint (LCP) for WordPress wp-admin dashboard.
 * Logs in, refreshes dashboard, and captures LCP via PerformanceObserver.
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

/** Measure LCP for the wp-admin dashboard. */
async function measureLCP( url, username, password, iterations = 5 ) {
	const results = [];

	console.log( `Measuring LCP for ${ url } (${ iterations } iterations)...` );

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

			// Verify we're on the dashboard
			await page.waitForSelector( '#dashboard-widgets, #wpbody', { timeout: 30000 } );

			// Step 2: Set up LCP capture using addInitScript
			// This injects code that runs BEFORE any page script on every navigation
			/* eslint-disable no-undef -- This runs in browser context via Playwright */
			await context.addInitScript( () => {
				// This runs in the browser context before page load
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

			// Step 3: Refresh the dashboard for a clean LCP measurement
			await page.reload( { waitUntil: 'networkidle', timeout: 60000 } );

			// Wait for dashboard content to be visible
			await page.waitForSelector( '#dashboard-widgets, #wpbody-content', { timeout: 30000 } );

			// Wait for network to settle and LCP to finalize
			// LCP stops updating after user input or visibility change
			// Using networkidle is more reliable than a fixed timeout on slow systems
			await page.waitForLoadState( 'networkidle', { timeout: 30000 } );

			// Additional short wait for any final rendering after network settles
			await page.waitForTimeout( 500 );

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

					// Size metrics
					transferSize: navigation ? navigation.transferSize : null,
					encodedBodySize: navigation ? navigation.encodedBodySize : null,
					decodedBodySize: navigation ? navigation.decodedBodySize : null,
				};
			} );

			// Get resource stats
			const resourceStats = await page.evaluate( () => {
				const resources = performance.getEntriesByType( 'resource' );
				const byType = {};
				let totalTransferSize = 0;

				resources.forEach( r => {
					const type = r.initiatorType || 'other';
					byType[ type ] = ( byType[ type ] || 0 ) + 1;
					totalTransferSize += r.transferSize || 0;
				} );

				return {
					totalRequests: resources.length,
					totalTransferSizeKB: Math.round( totalTransferSize / 1024 ),
					byType,
				};
			} );
			/* eslint-enable no-undef */

			// Validate we got an LCP value
			if ( metrics.lcp === null || metrics.lcp === undefined ) {
				throw new Error(
					'LCP measurement not available - page may not have rendered visible content'
				);
			}

			results.push( {
				iteration: i + 1,
				lcp: metrics.lcp,
				metrics,
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

	// Calculate statistics
	const validResults = results.filter( r => ! r.error && r.lcp != null );

	if ( validResults.length === 0 ) {
		throw new Error(
			'All iterations failed - check WordPress is accessible and credentials are correct'
		);
	}

	return {
		summary: buildSummary( validResults, iterations ),
		results,
		url,
	};
}

/**
 * Metric fields aggregated into the summary. LCP stays first: it is the load-bearing
 * value (unchanged), and it also populates the flat top-level summary for backward-compat.
 * TTFB and FCP are already captured per iteration (see the page.evaluate block above);
 * this is where they finally get aggregated into the summary.
 */
const SUMMARY_FIELDS = [ 'lcp', 'ttfb', 'fcp' ];

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
 * field on some iteration) are dropped before aggregating; a field with NO finite samples
 * returns null so the caller omits it and the poster fails closed on the missing field
 * rather than posting a fabricated 0.
 *
 * @param {Array<number|null|undefined>} values - Raw per-iteration values for the field.
 * @return {{median:number,mean:number,min:number,max:number,stdDev:number}|null} Rounded stats, or null.
 */
function summarizeField( values ) {
	const finite = values.filter( v => typeof v === 'number' && Number.isFinite( v ) );
	if ( finite.length === 0 ) {
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
		// older readers of summary.median). validResults always carries a finite LCP, so
		// perField.lcp is always present.
		...( perField.lcp ?? {} ),
		successfulIterations: validResults.length,
		totalIterations: iterations,
		// Per-field nested blocks for the multi-metric poster path (reads summary.<field>.median).
		...perField,
	};
}

async function main() {
	const username = process.env.WP_ADMIN_USER || 'admin';
	const password = process.env.WP_ADMIN_PASS || 'password';
	const iterations = parseInt( process.env.ITERATIONS || '5', 10 );
	const scenarioFilter = process.env.SCENARIO || 'all';

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
	console.log( '  2. Refresh dashboard (clean page load)' );
	console.log( '  3. Measure LCP of the fresh dashboard' );
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

	// Run each scenario
	for ( const scenario of SCENARIOS ) {
		// Skip if filtering to a specific scenario
		if ( scenarioFilter !== 'all' && scenarioFilter !== scenario.cliName ) {
			continue;
		}

		const url = getScenarioUrl( scenario );

		console.log( scenario.header );
		console.log( '-'.repeat( scenario.header.length ) );

		try {
			measurements[ scenario.key ] = await measureLCP( url, username, password, iterations );
			console.log(
				`✓ ${ scenario.name } median LCP: ${ measurements[ scenario.key ].summary.median }ms\n`
			);
		} catch ( error ) {
			console.error( `✗ ${ scenario.name } measurement failed:`, error.message, '\n' );
			measurements[ scenario.key ] = { error: error.message };
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
		} else {
			console.log( `  ${ scenario.name }: FAILED - ${ measurement?.error || 'unknown error' }` );
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

	const hasFailures = Object.values( measurements ).some( m => m.error );
	process.exit( hasFailures ? 1 : 0 );
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

export { measureLCP, resolveResultsGit, buildSummary };
