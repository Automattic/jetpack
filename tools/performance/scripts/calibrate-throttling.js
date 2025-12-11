#!/usr/bin/env node
/**
 * CPU Throttling Calibration Script
 *
 * This script calibrates a CPU throttling multiplier so that performance tests
 * produce consistent results across different machines. It uses Chrome DevTools
 * Protocol to throttle CPU speed to a normalized baseline.
 *
 * How it works:
 * 1. Run a synthetic benchmark to measure machine speed (unthrottled)
 * 2. Binary search to find a throttle rate that produces a target score (~1000)
 * 3. Run multiple calibration passes and take the median
 * 4. Save the result to calibration.json
 *
 * Usage:
 * node scripts/calibrate-throttling.js
 * CALIBRATION_PASSES=5 node scripts/calibrate-throttling.js
 *
 * Based on the Gutenberg performance testing calibration approach.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { median, truncate } from './stats.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Configuration
const TARGET_SCORE = 1000;
const CALIBRATION_PASSES = parseInt( process.env.CALIBRATION_PASSES || '9', 10 );
const BINARY_SEARCH_MAX_ITERATIONS = 8;
const SCORE_TOLERANCE = 10;
const BENCHMARK_DURATION_MS = 500;

// Output path
const CALIBRATION_FILE = path.join( __dirname, '..', 'calibration.json' );

// Cache for benchmark scores within a single pass (keyed by throttle rate)
const scoreCache = new Map();

/**
 * Benchmark function that runs in the browser context
 *
 * Combines two sub-benchmarks:
 * - benchmarkIndexGC: String building (GC-heavy workload)
 * - benchmarkIndexNoGC: Array copying (pure CPU workload)
 *
 * @param {number} duration - Duration in milliseconds for each sub-benchmark
 * @return {number} Average benchmark score
 */
function computeBenchmarkIndex( duration = 500 ) {
	/**
	 * GC-heavy benchmark: Build 10k-char strings repeatedly
	 *
	 * @param {number} dur - Duration in milliseconds
	 * @return {number} Iterations per second / 10
	 */
	function benchmarkIndexGC( dur ) {
		const start = Date.now();
		let iterations = 0;

		while ( Date.now() - start < dur ) {
			let str = '';
			for ( let i = 0; i < 10000; i++ ) {
				str += 'x';
			}
			// Prevent optimization
			if ( str.length === 0 ) {
				throw new Error( 'Unexpected' );
			}
			iterations++;
		}

		const elapsed = ( Date.now() - start ) / 1000;
		return iterations / elapsed / 10;
	}

	/**
	 * Pure CPU benchmark: Copy between two 100k-length arrays
	 *
	 * Uses reduced Date.now() checks (every 10th iteration) to avoid
	 * JIT compiler issues with frequent date checks.
	 *
	 * @param {number} dur - Duration in milliseconds
	 * @return {number} Iterations per second / 10
	 */
	function benchmarkIndexNoGC( dur ) {
		const arr1 = new Array( 100000 ).fill( 0 ).map( ( _, i ) => i );
		const arr2 = new Array( 100000 ).fill( 0 );
		const start = Date.now();
		let iterations = 0;

		// Check time less frequently to avoid JIT issues
		while ( true ) {
			for ( let j = 0; j < 10; j++ ) {
				for ( let i = 0; i < arr1.length; i++ ) {
					arr2[ i ] = arr1[ i ];
				}
				iterations++;
			}

			if ( Date.now() - start >= dur ) {
				break;
			}
		}

		const elapsed = ( Date.now() - start ) / 1000;
		return iterations / elapsed / 10;
	}

	// Run both benchmarks and average the results
	const gcScore = benchmarkIndexGC( duration );
	const noGcScore = benchmarkIndexNoGC( duration );

	return ( gcScore + noGcScore ) / 2;
}

/**
 * Apply CPU throttling via Chrome DevTools Protocol
 *
 * @param {object} cdpSession - Playwright CDP session
 * @param {number} rate       - Throttle rate (1 = no throttle, 2 = 2x slower, etc.)
 */
async function throttle( cdpSession, rate ) {
	await cdpSession.send( 'Emulation.setCPUThrottlingRate', { rate } );
}

/**
 * Run the benchmark at a given throttle rate
 *
 * Uses caching to avoid re-running benchmarks for the same rate within a pass.
 *
 * @param {object} page       - Playwright page
 * @param {object} cdpSession - Playwright CDP session
 * @param {number} rate       - Throttle rate to apply
 * @return {Promise<number>} Benchmark score
 */
async function runBenchmark( page, cdpSession, rate ) {
	// Check cache first
	const cacheKey = truncate( rate, 2 );
	if ( scoreCache.has( cacheKey ) ) {
		return scoreCache.get( cacheKey );
	}

	// Apply throttling
	await throttle( cdpSession, rate );

	// Run benchmark in browser context
	const score = await page.evaluate( computeBenchmarkIndex, BENCHMARK_DURATION_MS );

	// Cache the result
	scoreCache.set( cacheKey, score );

	return score;
}

/**
 * Binary search to find the throttle rate that produces the target score
 *
 * @param {object} page       - Playwright page
 * @param {object} cdpSession - Playwright CDP session
 * @param {number} target     - Target benchmark score
 * @param {number} lowerRate  - Lower bound for throttle rate
 * @param {number} upperRate  - Upper bound for throttle rate
 * @return {Promise<number>} Throttle rate that produces score within tolerance of target
 */
async function findRateForTargetScore( page, cdpSession, target, lowerRate, upperRate ) {
	let iterations = 0;

	while ( iterations < BINARY_SEARCH_MAX_ITERATIONS ) {
		const midRate = truncate( ( lowerRate + upperRate ) / 2, 2 );
		const score = await runBenchmark( page, cdpSession, midRate );

		// Check if we're within tolerance
		if ( Math.abs( score - target ) <= SCORE_TOLERANCE ) {
			return midRate;
		}

		// Adjust bounds based on score
		// If score is too high, we need more throttling (higher rate)
		// If score is too low, we need less throttling (lower rate)
		if ( score > target ) {
			lowerRate = midRate;
		} else {
			upperRate = midRate;
		}

		iterations++;
	}

	// Return best estimate after max iterations
	return truncate( ( lowerRate + upperRate ) / 2, 2 );
}

/**
 * Main calibration function
 */
async function main() {
	console.log( '╔════════════════════════════════════════════════════════╗' );
	console.log( '║   CPU Throttling Calibration                           ║' );
	console.log( '╚════════════════════════════════════════════════════════╝' );
	console.log( '' );
	console.log( `Target benchmark score: ${ TARGET_SCORE }` );
	console.log( `Calibration passes: ${ CALIBRATION_PASSES }` );
	console.log( '' );

	// Validate configuration
	if ( CALIBRATION_PASSES < 1 ) {
		console.error( 'Error: CALIBRATION_PASSES must be at least 1' );
		process.exit( 1 );
	}

	// Launch browser (headful for calibration to avoid headless performance differences)
	console.log( 'Launching browser...' );
	const browser = await chromium.launch( {
		headless: false,
		args: [ '--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu' ],
	} );

	const context = await browser.newContext( {
		viewport: { width: 1024, height: 768 },
	} );

	const page = await context.newPage();

	// Create CDP session for throttling control
	const cdpSession = await context.newCDPSession( page );

	// Navigate to about:blank for clean benchmark environment
	await page.goto( 'about:blank' );
	console.log( 'Browser ready.' );
	console.log( '' );

	// Warmup run (discard result)
	console.log( 'Running warmup...' );
	await runBenchmark( page, cdpSession, 1 );
	scoreCache.clear();
	console.log( 'Warmup complete.' );
	console.log( '' );

	// Run calibration passes
	const passResults = [];

	for ( let pass = 1; pass <= CALIBRATION_PASSES; pass++ ) {
		console.log( `Pass ${ pass }/${ CALIBRATION_PASSES }:` );

		// Clear cache for each pass
		scoreCache.clear();

		// Measure unthrottled score
		const unthrottledScore = await runBenchmark( page, cdpSession, 1 );
		console.log( `  Unthrottled score: ${ truncate( unthrottledScore, 1 ) }` );

		// Check if machine is fast enough
		if ( unthrottledScore < TARGET_SCORE ) {
			console.error( '' );
			console.error( `Error: Machine is too slow for calibration.` );
			console.error(
				`  Unthrottled score (${ truncate( unthrottledScore, 1 ) }) < target (${ TARGET_SCORE })`
			);
			console.error( `  This machine cannot be throttled to the target performance level.` );
			await browser.close();
			process.exit( -1 );
		}

		// Calculate upper bound for binary search
		// Use 1.5x the ratio with a minimum of 1.1 to ensure we have search space
		const upperRate = Math.max( ( unthrottledScore / TARGET_SCORE ) * 1.5, 1.1 );
		console.log( `  Search range: 1.00 - ${ truncate( upperRate, 2 ) }` );

		// Binary search for target score
		const foundRate = await findRateForTargetScore( page, cdpSession, TARGET_SCORE, 1, upperRate );

		// Verify the found rate
		scoreCache.clear();
		const verifyScore = await runBenchmark( page, cdpSession, foundRate );
		console.log( `  Found rate: ${ foundRate } (produces score: ${ truncate( verifyScore, 1 ) })` );

		passResults.push( foundRate );

		// Brief pause between passes (except after last)
		if ( pass < CALIBRATION_PASSES ) {
			await new Promise( resolve => setTimeout( resolve, 500 ) );
		}
	}

	// Close browser
	await browser.close();

	// Calculate final result
	console.log( '' );
	console.log( '════════════════════════════════════════════════════════' );
	console.log( 'Results:' );
	console.log( `  All samples: ${ passResults.map( r => truncate( r, 2 ) ).join( ', ' ) }` );

	const finalRate = truncate( median( passResults ), 2 );
	console.log( `  Median CPU throttle rate: ${ finalRate }` );
	console.log( '' );

	// Write calibration file
	const calibrationData = {
		cpuRate: finalRate,
		calibratedAt: new Date().toISOString(),
		targetScore: TARGET_SCORE,
		passes: CALIBRATION_PASSES,
		samples: passResults.map( r => truncate( r, 2 ) ),
	};

	fs.writeFileSync( CALIBRATION_FILE, JSON.stringify( calibrationData, null, 2 ) + '\n' );
	console.log( `Calibration saved to: ${ path.relative( process.cwd(), CALIBRATION_FILE ) }` );
	console.log( '' );
	console.log( 'Calibration complete!' );
	console.log( `Performance tests will now use CPU throttle rate: ${ finalRate }` );
}

// Run
main().catch( error => {
	console.error( 'Calibration failed:', error );
	process.exit( 1 );
} );
