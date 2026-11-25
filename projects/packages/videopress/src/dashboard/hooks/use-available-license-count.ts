import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

type LicenseCounts = {
	detached?: number;
};

/**
 * Count the current user's Jetpack licenses that aren't attached to a site yet.
 *
 * @return The count; 0 while loading, on error, and on WordPress.com Simple, which has no licensing.
 */
export function useAvailableLicenseCount(): number {
	const { data } = useQuery( {
		queryKey: [ 'jetpack-licensing-user-counts' ],
		queryFn: () => apiFetch< LicenseCounts >( { path: '/jetpack/v4/licensing/user/counts' } ),
		staleTime: 5 * 60_000,
		// A user who isn't connected to WordPress.com gets an error here: there is nothing to offer.
		retry: false,
		enabled: ! isSimpleSite(),
	} );

	return data?.detached ?? 0;
}
