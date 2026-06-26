/** Post performance metrics to CodeVitals. */

import fs from 'fs';
import path from 'path';
import { SCENARIOS, SANITY_RANGES } from './scenarios.js';

/**
 * Extract metric entries for a single scenario.
 *
 * Each entry carries its CodeVitals key, value, and (optional) type. The type
 * drives the sanity-range check; untyped legacy entries are posted unchecked.
 */
function extractScenarioMetrics( scenario, summary ) {
	// Use explicit metricKey if defined, otherwise fall back to prefix-based keys
	if ( scenario.metricKey ) {
		// Single metric with exact key
		return [ { key: scenario.metricKey, value: summary.median, type: scenario.metricType } ];
	}

	// Legacy: prefix-based keys with suffixes (untyped — not range-checked)
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
	// Genuinely untyped legacy entry: no declared type, so no range to enforce.
	if ( ! type ) {
		return { ok: true };
	}

	const range = SANITY_RANGES[ type ];
	if ( ! range ) {
		return { ok: false, reason: `no sanity range is defined for type "${ type }"` };
	}

	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		return { ok: false, reason: `value ${ JSON.stringify( value ) } is not a finite number` };
	}

	if ( value < range.min || value > range.max ) {
		return { ok: false, reason: `${ value } is outside [${ range.min }, ${ range.max }]` };
	}

	return { ok: true };
}

/** Post metrics to CodeVitals. */
async function postToCodeVitals( resultsPath, config ) {
	// Read results file
	if ( ! fs.existsSync( resultsPath ) ) {
		throw new Error( `Results file not found: ${ resultsPath }` );
	}

	const results = JSON.parse( fs.readFileSync( resultsPath, 'utf8' ) );

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
		if ( ! measurement || measurement.error ) {
			console.warn( `Warning: No measurement data for ${ scenario.name }` );
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
			metrics[ entry.key ] = entry.value;
		}
	}

	// Nothing valid left to post.
	if ( Object.keys( metrics ).length === 0 ) {
		if ( validationFailed ) {
			// Every metric was skipped by a sanity check (failures already logged).
			return { posted: false, validationFailed };
		}
		throw new Error( 'No metrics to post - check scenario configuration and measurement results' );
	}

	// Prepare CodeVitals payload
	const payload = {
		metrics,
		baseMetrics: {}, // Empty object - we don't use baseline normalization
		hash: results.git?.hash || config.gitHash || 'unknown',
		timestamp: Date.now(),
		branch: results.git?.branch || config.gitBranch || 'trunk',
	};

	// Dry run: show exactly what would be posted, then stop short of the POST.
	if ( config.dryRun ) {
		console.log( '— DRY RUN — building payload only, not posting to CodeVitals —' );
		console.log( JSON.stringify( payload, null, 2 ) );
		return { posted: false, validationFailed };
	}

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
			throw new Error( `CodeVitals returned invalid JSON: ${ jsonError.message }`, {
				cause: jsonError,
			} );
		}
		console.log( '✓ Metrics posted successfully to CodeVitals' );
		return { posted: true, data, validationFailed };
	} catch ( error ) {
		clearTimeout( timeoutId );
		const message =
			error.name === 'AbortError'
				? `CodeVitals request timed out after ${ TIMEOUT_MS / 1000 }s`
				: error.message;
		console.error( '✗ Failed to post metrics to CodeVitals:', message );
		throw new Error( message, { cause: error } );
	}
}

async function main() {
	console.log( 'CodeVitals Integration' );
	console.log( '=====================\n' );

	const dryRun = process.argv.includes( '--dry-run' );

	// Configuration from environment
	const config = {
		// Default to the apex host. www.codevitals.run 301-redirects the API, and on a
		// 301 fetch retries a POST as a GET with no body, so the metric never lands.
		codeVitalsUrl: process.env.CODEVITALS_URL || 'https://codevitals.run',
		codeVitalsToken: process.env.CODEVITALS_TOKEN,
		gitHash: process.env.GIT_COMMIT,
		gitBranch: process.env.GIT_BRANCH || 'trunk',
		resultsPath:
			process.env.RESULTS_PATH || path.join( import.meta.dirname, '../results/lcp-results.json' ),
		dryRun,
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
	console.log( '' );

	try {
		const result = await postToCodeVitals( config.resultsPath, config );
		if ( result.validationFailed ) {
			console.error(
				'\n✗ One or more metrics failed sanity checks (see above). Any valid metrics were still processed.'
			);
			process.exit( 1 );
		}
		console.log( dryRun ? '\n✓ Dry run complete!' : '\n✓ All done!' );
		process.exit( 0 );
	} catch ( error ) {
		console.error( '\n✗ Failed:', error.message );
		process.exit( 1 );
	}
}

// Run only when executed directly, not when imported (e.g. by the unit test),
// so importing the pure helpers does not trigger main()'s env checks or exits.
if ( import.meta.url === `file://${ process.argv[ 1 ] }` ) {
	main();
}

export { postToCodeVitals, checkSanityRange, extractScenarioMetrics };
