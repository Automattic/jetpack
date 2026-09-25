/**
 * External dependencies
 */
import type { UseQueryOptions } from '@tanstack/react-query';

const GEO_ENDPOINT = 'https://public-api.wordpress.com/geo/';

/**
 * React Query options for the country of the person viewing the dashboard, looked up
 * by IP address on WordPress.com. Not the site's visitors: this is the admin's own location.
 *
 * @return The query options; `data` is an ISO 3166-1 alpha-2 code, or `null` when unknown.
 */
export function viewerCountryQuery(): UseQueryOptions< string | null > {
	return {
		queryKey: [ 'viewer-country' ],
		queryFn: async () => {
			const response = await fetch( GEO_ENDPOINT );
			if ( ! response.ok ) {
				return null;
			}

			const { country_short: countryCode } = await response.json();
			return typeof countryCode === 'string' && /^[A-Z]{2}$/i.test( countryCode )
				? countryCode.toUpperCase()
				: null;
		},
		staleTime: Infinity,
		retry: false,
	};
}
