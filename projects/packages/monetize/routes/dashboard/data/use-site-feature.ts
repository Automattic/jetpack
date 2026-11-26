import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

/**
 * The plan features WordPress.com reports for the site now.
 *
 * @return The active feature slugs.
 */
async function fetchActiveFeatures(): Promise< string[] > {
	const response = await apiFetch< { data: string } >( { path: '/jetpack/v4/site/features' } );
	return JSON.parse( response.data ).active ?? [];
}

/**
 * Whether the site's plan includes a feature, asking WordPress.com when Jetpack's cached plan says no.
 *
 * The cache refreshes daily or on a My Jetpack visit, so it can miss a purchase made since.
 *
 * @param feature - The plan feature, e.g. `wordads`.
 * @param cached  - What Jetpack's cached plan says.
 * @return The answer, or undefined while WordPress.com is asked.
 */
export function useSiteHasFeature( feature: string, cached: boolean ): boolean | undefined {
	const { data, isError } = useQuery( {
		queryKey: [ 'monetize', 'site-features' ],
		queryFn: fetchActiveFeatures,
		enabled: ! cached,
		// A failure keeps the cached answer, so retrying would only delay it.
		retry: false,
	} );

	if ( cached || isError ) {
		return cached;
	}
	return data?.includes( feature );
}
