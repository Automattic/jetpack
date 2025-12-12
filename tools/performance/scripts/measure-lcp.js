/**
 * Measure Largest Contentful Paint (LCP) for WordPress wp-admin dashboard
 *
 * This script uses Playwright to measure LCP and other performance metrics
 * for four scenarios:
 * 1. Baseline WordPress (no Jetpack)
 * 2. Jetpack installed but not connected
 * 3. Jetpack in offline mode (simulated connection via JETPACK_DEV_DEBUG)
 * 4. Jetpack connected (simulated with fake tokens + mocked API with latency)
 *
 * Measurement approach:
 * 1. Log in to WordPress (this is not measured)
 * 2. Navigate to dashboard
 * 3. REFRESH the dashboard to get a clean LCP measurement
 * 4. Collect LCP from the fresh page load via PerformanceObserver
 *
 * This ensures login overhead doesn't impact the measurement.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { SCENARIOS, getScenarioUrl } from './scenarios.js';
import { median as calcMedian, mean as calcMean, stdDev as calcStdDev } from './stats.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Calibration file path
const CALIBRATION_FILE = path.join( __dirname, '..', 'calibration.json' );

/**
 * Load calibration data if available
 *
 * @return {object|null} Calibration data or null if not available
 */
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
 * Measure LCP for the wp-admin dashboard
 *
 * @param {string} url        - The WordPress base URL
 * @param {string} username   - WordPress admin username
 * @param {string} password   - WordPress admin password
 * @param {number} iterations - Number of iterations to run
 * @return {Promise<Object>} Measurement results
 */
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
		let cdpSession = null;
		if ( calibration?.cpuRate ) {
			cdpSession = await context.newCDPSession( page );
			await cdpSession.send( 'Emulation.setCPUThrottlingRate', {
				rate: calibration.cpuRate,
			} );
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

	const lcpValues = validResults.map( r => r.lcp );

	// Calculate statistics using shared utilities
	const median = calcMedian( lcpValues );
	const mean = calcMean( lcpValues );
	const stdDev = calcStdDev( lcpValues );
	const min = Math.min( ...lcpValues );
	const max = Math.max( ...lcpValues );

	return {
		summary: {
			median: Math.round( median ),
			mean: Math.round( mean ),
			min: Math.round( min ),
			max: Math.round( max ),
			stdDev: Math.round( stdDev ),
			successfulIterations: validResults.length,
			totalIterations: iterations,
		},
		results,
		url,
	};
}

/**
 * Main execution
 */
async function main() {
	const username = process.env.WP_ADMIN_USER || 'admin';
	const password = process.env.WP_ADMIN_PASS || 'password';
	const iterations = parseInt( process.env.ITERATIONS || '5', 10 );
	const scenarioFilter = process.env.SCENARIO || 'all';

	console.log( 'WordPress Performance Testing - LCP Measurement' );
	console.log( '================================================' );
	console.log( '' );

	// Log calibration status
	if ( calibration ) {
		console.log( `CPU Throttling: Enabled (rate: ${ calibration.cpuRate })` );
		console.log( `  Calibrated: ${ calibration.calibratedAt }` );
	} else {
		console.log( 'CPU Throttling: Disabled (no calibration.json found)' );
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
	console.log( 'Summary Comparison' );
	console.log( '==================' );

	const baselineMedian = measurements.baseline?.summary?.median;

	for ( const scenario of SCENARIOS ) {
		const measurement = measurements[ scenario.key ];
		if ( ! measurement ) {
			continue; // Scenario was filtered out
		}
		if ( measurement && ! measurement.error ) {
			const median = measurement.summary.median;
			let deltaStr = '';
			if ( baselineMedian && scenario.key !== 'baseline' ) {
				const delta = median - baselineMedian;
				const pct = ( ( delta / baselineMedian ) * 100 ).toFixed( 1 );
				deltaStr = ` (${ delta > 0 ? '+' : '' }${ delta }ms, ${ delta > 0 ? '+' : '' }${ pct }%)`;
			}
			console.log( `  ${ scenario.name }: ${ median }ms${ deltaStr }` );
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
		git: {
			hash: process.env.GIT_COMMIT || 'unknown',
			branch: process.env.GIT_BRANCH || 'unknown',
		},
	};

	fs.writeFileSync( outputPath, JSON.stringify( output, null, 2 ) );
	console.log( `Results saved to: ${ outputPath }` );

	const hasFailures = Object.values( measurements ).some( m => m.error );
	process.exit( hasFailures ? 1 : 0 );
}

main().catch( error => {
	console.error( 'Fatal error:', error );
	process.exit( 1 );
} );

export { measureLCP };
