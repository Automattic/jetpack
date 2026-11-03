/**
 * External dependencies
 */
import { queryOptions } from '@tanstack/react-query';

const GEO_ENDPOINT = 'https://public-api.wordpress.com/geo/';
const GEO_TIMEOUT_MS = 3000;

/**
 * React Query options for the country of the person viewing the dashboard, looked up
 * by IP address on WordPress.com. Not the site's visitors: this is the admin's own location.
 *
 * @return The query options; `data` is an ISO 3166-1 alpha-2 code, or `null` when unknown.
 */
export function viewerCountryQuery() {
	return queryOptions< string | null >( {
		queryKey: [ 'viewer-country' ],
		queryFn: async () => {
			// The map waits for this lookup, and the borders are cosmetic: an offline
			// viewer, a blocked or slow request or a malformed body must settle on
			// Google's default borders, not fail or hold the map back.
			try {
				const response = await fetch( GEO_ENDPOINT, {
					signal: AbortSignal.timeout( GEO_TIMEOUT_MS ),
				} );
				if ( ! response.ok ) {
					return null;
				}

				const { country_short: countryCode } = await response.json();
				return typeof countryCode === 'string' && /^[A-Z]{2}$/i.test( countryCode )
					? countryCode.toUpperCase()
					: null;
			} catch {
				return null;
			}
		},
		staleTime: Infinity,
		retry: false,
	} );
}
