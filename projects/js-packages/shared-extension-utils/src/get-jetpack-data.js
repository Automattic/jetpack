export const JETPACK_DATA_PATH = 'Jetpack_Editor_Initial_State';

// Cache for the fetched data
let cachedData = null;
let fetchPromise = null;

/**
 * Retrieves Jetpack editor state
 *
 * @return {object|null} The Jetpack Editor State or null if not available
 */
export default function getJetpackData() {
	const windowData = window?.[ JETPACK_DATA_PATH ];
	if ( windowData ) {
		return windowData;
	}

	if ( cachedData ) {
		return cachedData;
	}

	return null;
}

/**
 * Fetches Jetpack editor state from API
 *
 * @return {Promise<object>} Promise that resolves to the Jetpack Editor State
 */
export function fetchJetpackData() {
	return getJetpackDataAsync();
}

/**
 * Internal async function to fetch Jetpack data
 *
 * @return {Promise<object>} Promise that resolves to the Jetpack Editor State
 */
async function getJetpackDataAsync() {
	// Return existing promise if already in progress
	if ( fetchPromise ) {
		return await fetchPromise;
	}

	if ( window?.[ JETPACK_DATA_PATH ] ) {
		return window[ JETPACK_DATA_PATH ];
	}

	if ( cachedData ) {
		return cachedData;
	}

	try {
		const { default: apiFetch } = await import( '@wordpress/api-fetch' );
		const data = await apiFetch( {
			path: '/wpcom/v2/gutenberg/editor-initial-state',
		} );

		cachedData = data;
		fetchPromise = null;

		return data;
	} catch ( error ) {
		fetchPromise = null;
		throw error;
	}
}
