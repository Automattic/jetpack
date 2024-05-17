import { __ } from '@wordpress/i18n';
import { addGetParameter } from '$lib/utils/add-get-parameter';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { SuperCacheInfo } from '$lib/stores/super-cache';
import { useCallback } from 'react';

export function useSuperCacheDS() {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'super_cache', SuperCacheInfo );

	return data;
}

/**
 * Creates a callback which measures the speed of pageloads using Super Cache, and bypassing Super Cache.
 *
 * @return {() => Promise<number>} milliseconds difference between cached and uncached pageload.
 */
export function useMeasureSuperCacheSaving() {
	const data = useSuperCacheDS();
	const cachePageSecret = data?.cachePageSecret;
	const {
		site: { url },
	} = Jetpack_Boost;

	return useCallback( async () => {
		if ( ! cachePageSecret ) {
			// eslint-disable-next-line no-console
			console.error( 'Cache Page Secret is missing.' );
			return 0;
		}

		recordBoostEvent( 'super_cache_test_started', {} );

		const uncachedUrl = addGetParameter( url, 'donotcachepage', cachePageSecret as string );

		const uncachedTime = await measureFetch( uncachedUrl, false );
		const cachedTime = await measureFetch( url, true );

		// Calculate the results.
		const result = Math.max( 0, Math.round( uncachedTime - cachedTime ) );
		recordBoostEvent( 'super_cache_test_results', {
			difference: result,
		} );

		return result;
	}, [ cachePageSecret, url ] );
}

/**
 * Runs a request with no cookies / credentials, and throwing away the text body.
 *
 * @param {string} url - URL to fetch.
 * @return {Promise<Response>} response object.
 */
async function blindFetch( url: string ): Promise< Response > {
	const request = await fetch( url, { credentials: 'omit' } );
	await request.text();

	return request;
}

/**
 * Measures the time taken to fetch the URL a number of times, returning the average time.
 * Uses the indentifier to filter the performance logs to only include the relevant requests.
 *
 * @param {string} url      - URL to fetch, including the unique identifier.
 * @param {string} prefetch - If true, fetch the URL once before beginning the measurement.
 * @param {number} readings - Number of readings to test with (default 2)
 * @return {number} average time in milliseconds to fetch the URL.
 */
async function measureFetch( url: string, prefetch: boolean, readings = 2 ) {
	let totalTime = 0;

	// Generate a unique ID to make sure we get the right performance logs.
	const uniqueId = Math.random().toString( 36 ).substring( 2, 15 );
	const uniqueUrl = addGetParameter( url, 'uniqueId', uniqueId );

	// Prefetch the URL if requested.
	if ( prefetch ) {
		await blindFetch( uniqueUrl );
	}

	// Run the experiment.
	for ( let i = 0; i < readings; i++ ) {
		performance.clearResourceTimings();

		await blindFetch( uniqueUrl );

		// Find the relevant performance log by unique ID.
		const allEntries = performance.getEntriesByType( 'resource' );
		const entries = allEntries.filter( e => e.name.includes( uniqueId ) );

		if ( entries.length !== 1 ) {
			throw new Error(
				__(
					'Could not detect performance records for the Super Cache test. Please try again.',
					'jetpack-boost'
				)
			);
		}

		const perf = entries[ 0 ];
		totalTime += perf.duration;
	}

	return Math.round( totalTime / readings );
}
