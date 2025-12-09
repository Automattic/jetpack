/**
 * Post performance metrics to CodeVitals
 *
 * Reads the results from measure-lcp.js and posts them to CodeVitals API
 * for tracking and visualization over time.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCENARIOS } from './scenarios.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * Extract metrics for a single scenario
 *
 * @param {object}      summary        - The scenario's summary object (median, mean, min, max, stdDev)
 * @param {string}      prefix         - Metric name prefix (e.g., 'wp_admin_lcp_baseline')
 * @param {number|null} baselineMedian - Baseline median for overhead calculation (null for baseline itself)
 * @return {object} Object with metrics and baseMetrics properties
 */
function extractScenarioMetrics( summary, prefix, baselineMedian ) {
	const metrics = {};
	const baseMetrics = {};

	// Core metrics
	metrics[ `${ prefix }_ms` ] = summary.median;
	metrics[ `${ prefix }_mean_ms` ] = summary.mean;
	metrics[ `${ prefix }_min_ms` ] = summary.min;
	metrics[ `${ prefix }_max_ms` ] = summary.max;
	metrics[ `${ prefix }_stddev_ms` ] = summary.stdDev;

	// Base metrics for CodeVitals normalization
	baseMetrics[ `${ prefix }_ms` ] = summary.median;
	baseMetrics[ `${ prefix }_mean_ms` ] = summary.mean;

	// Calculate overhead vs baseline (only for non-baseline scenarios)
	// Guard against division by zero (theoretically impossible but defensive)
	if ( baselineMedian !== null && baselineMedian > 0 ) {
		const overhead = summary.median - baselineMedian;
		const overheadPct = ( overhead / baselineMedian ) * 100;
		metrics[ `${ prefix }_overhead_ms` ] = Math.round( overhead );
		metrics[ `${ prefix }_overhead_pct` ] = Math.round( overheadPct * 10 ) / 10;
	}

	return { metrics, baseMetrics };
}

/**
 * Post metrics to CodeVitals
 *
 * @param {string} resultsPath - Path to the results JSON file
 * @param {object} config      - Configuration object
 * @return {Promise<Object>} Response from CodeVitals API
 */
async function postToCodeVitals( resultsPath, config ) {
	// Read results file
	if ( ! fs.existsSync( resultsPath ) ) {
		throw new Error( `Results file not found: ${ resultsPath }` );
	}

	const results = JSON.parse( fs.readFileSync( resultsPath, 'utf8' ) );

	// Extract metrics from results
	const metrics = {};
	const baseMetrics = {};

	// Get baseline value for normalization
	const baselineMedian = results.measurements.baseline?.summary?.median ?? null;

	// Process each scenario
	for ( const scenario of SCENARIOS ) {
		const measurement = results.measurements[ scenario.key ];
		if ( ! measurement || measurement.error ) {
			continue;
		}

		const scenarioMetrics = extractScenarioMetrics(
			measurement.summary,
			scenario.metricPrefix,
			scenario.isBaseline ? null : baselineMedian
		);

		Object.assign( metrics, scenarioMetrics.metrics );
		Object.assign( baseMetrics, scenarioMetrics.baseMetrics );
	}

	// Prepare CodeVitals payload
	const payload = {
		metrics,
		baseMetrics,
		hash: results.git?.hash || config.gitHash || 'unknown',
		baseHash: config.baseHash || 'trunk',
		timestamp: Date.now(),
		branch: results.git?.branch || config.gitBranch || 'trunk',
	};

	console.log( 'Posting metrics to CodeVitals...' );
	console.log( 'Metrics:', JSON.stringify( metrics, null, 2 ) );

	// Post to CodeVitals API with timeout to prevent hanging builds
	// Note: Token is passed as query parameter per CodeVitals API spec.
	// The CodeVitals UI does not support Authorization header authentication,
	// so we must use the query parameter approach. Be aware that query parameters
	// may appear in server access logs. Avoid logging the full URL.
	const url = `${ config.codeVitalsUrl }/api/log?token=${ config.codeVitalsToken }`;
	const TIMEOUT_MS = 30000; // 30 second timeout

	const controller = new AbortController();
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
		clearTimeout( timeoutId );

		if ( ! response.ok ) {
			const errorText = await response.text();
			// Don't log the URL as it contains the token
			throw new Error( `CodeVitals API error (${ response.status }): ${ errorText }` );
		}

		let data;
		try {
			data = await response.json();
		} catch ( jsonError ) {
			throw new Error( `CodeVitals returned invalid JSON: ${ jsonError.message }` );
		}
		console.log( '✓ Metrics posted successfully to CodeVitals' );
		return data;
	} catch ( error ) {
		clearTimeout( timeoutId );
		const message =
			error.name === 'AbortError'
				? `CodeVitals request timed out after ${ TIMEOUT_MS / 1000 }s`
				: error.message;
		console.error( '✗ Failed to post metrics to CodeVitals:', message );
		throw new Error( message );
	}
}

/**
 * Main execution
 */
async function main() {
	console.log( 'CodeVitals Integration' );
	console.log( '=====================\n' );

	// Configuration from environment
	const config = {
		codeVitalsUrl: process.env.CODEVITALS_URL || 'https://www.codevitals.run',
		codeVitalsToken: process.env.CODEVITALS_TOKEN,
		gitHash: process.env.GIT_COMMIT,
		gitBranch: process.env.GIT_BRANCH || 'trunk',
		baseHash: process.env.GIT_BASE_HASH || 'trunk',
		resultsPath: process.env.RESULTS_PATH || path.join( __dirname, '../results/lcp-results.json' ),
	};

	// Validate required config
	if ( ! config.codeVitalsToken ) {
		console.error( 'ERROR: CODEVITALS_TOKEN environment variable is required' );
		process.exit( 1 );
	}

	console.log( 'Configuration:' );
	console.log( `  CodeVitals URL: ${ config.codeVitalsUrl }` );
	console.log( `  Results Path: ${ config.resultsPath }` );
	console.log( `  Git Hash: ${ config.gitHash || 'unknown' }` );
	console.log( `  Git Branch: ${ config.gitBranch }` );
	console.log( `  Base Hash: ${ config.baseHash }` );
	console.log( '' );

	try {
		await postToCodeVitals( config.resultsPath, config );
		console.log( '\n✓ All done!' );
		process.exit( 0 );
	} catch ( error ) {
		console.error( '\n✗ Failed:', error.message );
		process.exit( 1 );
	}
}

// Run if called directly
main();

export { postToCodeVitals };
