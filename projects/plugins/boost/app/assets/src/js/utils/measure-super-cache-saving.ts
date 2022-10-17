/**
 * Measures the speed of pageloads using Super Cache, and bypassing Super Cache.
 *
 * @return {number} milliseconds difference between cached and uncached pageload.
 */
export async function measureSuperCacheSaving(): Promise< number > {
	const uncached = await measureUncachedFetch();
	const cached = await measureCachedFetch();

	return Math.max( 0, Math.round( uncached - cached ) );
}

/**
 * Tests the time taken when fetching a cached page.
 *
 * @return {number} average time in milliseconds to fetch a cached page.
 */
async function measureCachedFetch() {
	// Make sure the page is cached by fetching it first.
	await blindFetch( Jetpack_Boost.site.url );

	// Measure the performance of the cached page.
	return measureFetch( Jetpack_Boost.site.url );
}

/**
 * Runs a request with no cookies / credentials, and throwing away the text body.
 *
 * @param {string} url - URL to fetch.
 * @return {Promise<Response>} response object.
 */
async function blindFetch( url ): Promise< Response > {
	const request = await fetch( url, { credentials: 'omit' } );
	await request.text();

	return request;
}

/**
 * Measures the time taken when fetching a page without Super Cache.
 *
 * @return {number} average time in milliseconds to fetch a page without Super Cache.
 */
async function measureUncachedFetch() {
	const cacheBypassUrl =
		Jetpack_Boost.site.url +
		'?donotcache=' +
		encodeURIComponent( Jetpack_Boost.superCache.disableCacheKey );

	return measureFetch( cacheBypassUrl );
}

/**
 * Measures the time taken to fetch the URL a number of times, returning the average time.
 *
 * @param {string} url      - URL to test
 * @param {number} readings - Number of readings to test with (default 2)
 * @return {number} average time in milliseconds to fetch the URL.
 */
async function measureFetch( url, readings = 2 ) {
	let totalTime = 0;

	for ( let i = 0; i < readings; i++ ) {
		const response = await blindFetch( url );

		const perf = performance.getEntriesByName( response.url ).pop();
		totalTime += perf.duration;
	}

	return Math.round( totalTime / readings );
}
