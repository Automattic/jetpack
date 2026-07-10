import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { isSimpleSite } from '../utils/is-simple';

export type Features = {
	isVideoPressSupported: boolean;
	isVideoPress1TBSupported: boolean;
	isVideoPressUnlimitedSupported: boolean;
};

const QUERY_KEY = [ 'jetpack-videopress-features' ] as const;

/**
 * Fetch the VideoPress feature flags from the REST API.
 *
 * @return TanStack Query result containing the Features payload.
 */
export function useFeatures() {
	return useQuery< Features >( {
		queryKey: QUERY_KEY,
		queryFn: () => apiFetch< Features >( { path: '/videopress/v1/features' } ),
		staleTime: 5 * 60_000,
		// The videopress/v1 namespace never reaches the REST dispatcher on
		// WordPress.com Simple; the boot payload (`siteData.hasVideoPressAccess`
		// / `isVideoPress1TB` / `isVideoPressUnlimited`) covers the flags there.
		enabled: ! isSimpleSite(),
	} );
}
