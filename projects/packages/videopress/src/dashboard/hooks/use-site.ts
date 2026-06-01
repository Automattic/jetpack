import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

export type SiteInfo = {
	options?: {
		videopress_storage_used?: number; // decimal megabytes
		is_wpcom_atomic?: boolean;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
};

const QUERY_KEY = [ 'jetpack-videopress-site' ] as const;

/**
 * Fetch the VideoPress site info from the REST API.
 *
 * @return TanStack Query result containing the SiteInfo payload.
 */
export function useSite() {
	return useQuery< SiteInfo >( {
		queryKey: QUERY_KEY,
		queryFn: () => apiFetch< SiteInfo >( { path: '/videopress/v1/site' } ),
		staleTime: 5 * 60_000,
	} );
}

/**
 * Extract storage usage in bytes from the site payload. WPCOM reports
 * `options.videopress_storage_used` in decimal megabytes (matches legacy
 * conversion at `src/client/state/resolvers.js:273`).
 *
 * @param site - The site info payload, or undefined when still loading.
 * @return Storage used in bytes (0 when the field is missing).
 */
export function getStorageUsedBytes( site: SiteInfo | undefined ): number {
	const mb = site?.options?.videopress_storage_used;
	if ( typeof mb !== 'number' ) {
		return 0;
	}
	return Math.round( mb * 1_000_000 );
}
