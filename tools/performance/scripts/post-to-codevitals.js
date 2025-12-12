/** Post performance metrics to CodeVitals. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCENARIOS } from './scenarios.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/** Extract metrics for a single scenario. */
function extractScenarioMetrics( scenario, summary ) {
	const metrics = {};
	const baseMetrics = {};

	// Use explicit metricKey if defined, otherwise fall back to prefix-based keys
	if ( scenario.metricKey ) {
		// Single metric with exact key
		metrics[ scenario.metricKey ] = summary.median;
		baseMetrics[ scenario.metricKey ] = summary.median;
	} else {
		// Legacy: prefix-based keys with suffixes
		const prefix = scenario.metricPrefix;
		metrics[ `${ prefix }_ms` ] = summary.median;
		metrics[ `${ prefix }_mean_ms` ] = summary.mean;
		metrics[ `${ prefix }_min_ms` ] = summary.min;
		metrics[ `${ prefix }_max_ms` ] = summary.max;
		metrics[ `${ prefix }_stddev_ms` ] = summary.stdDev;
		baseMetrics[ `${ prefix }_ms` ] = summary.median;
		baseMetrics[ `${ prefix }_mean_ms` ] = summary.mean;
	}

	return { metrics, baseMetrics };
}

/** Post metrics to CodeVitals. */
async function postToCodeVitals( resultsPath, config ) {
	// Read results file
	if ( ! fs.existsSync( resultsPath ) ) {
		throw new Error( `Results file not found: ${ resultsPath }` );
	}

	const results = JSON.parse( fs.readFileSync( resultsPath, 'utf8' ) );

	// Extract metrics from results
	const metrics = {};
	const baseMetrics = {};

	// Process only scenarios marked for CodeVitals posting
	for ( const scenario of SCENARIOS ) {
		// Skip scenarios not marked for CodeVitals
		if ( ! scenario.postToCodeVitals ) {
			continue;
		}

		const measurement = results.measurements[ scenario.key ];
		if ( ! measurement || measurement.error ) {
			console.warn( `Warning: No measurement data for ${ scenario.name }` );
			continue;
		}

		const scenarioMetrics = extractScenarioMetrics( scenario, measurement.summary );

		Object.assign( metrics, scenarioMetrics.metrics );
		Object.assign( baseMetrics, scenarioMetrics.baseMetrics );
	}

	// Validate we have metrics to post
	if ( Object.keys( metrics ).length === 0 ) {
		throw new Error( 'No metrics to post - check scenario configuration and measurement results' );
	}

	// Prepare CodeVitals payload
	const payload = {
		metrics,
		baseMetrics,
		hash: results.git?.hash || config.gitHash || 'unknown',
		timestamp: Date.now(),
		branch: results.git?.branch || config.gitBranch || 'trunk',
	};

	console.log( 'Posting metrics to CodeVitals...' );
	console.log( 'Metrics:', JSON.stringify( metrics, null, 2 ) );

	// Token passed as query param per CodeVitals API spec (don't log URL)
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

async function main() {
	console.log( 'CodeVitals Integration' );
	console.log( '=====================\n' );

	// Configuration from environment
	const config = {
		codeVitalsUrl: process.env.CODEVITALS_URL || 'https://www.codevitals.run',
		codeVitalsToken: process.env.CODEVITALS_TOKEN,
		gitHash: process.env.GIT_COMMIT,
		gitBranch: process.env.GIT_BRANCH || 'trunk',
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
