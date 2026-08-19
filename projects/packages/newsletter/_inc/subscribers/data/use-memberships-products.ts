import { useQuery } from '@tanstack/react-query';
import { fetchMembershipsProducts } from './api';
import type { MembershipsProduct } from './api';

/**
 * Fetch the paid newsletter / membership products configured on this site. Lazy — only runs
 * when the consumer asks for it. The Subscribers table fetches it to decide whether to offer the
 * "Comp a subscription" action; the Comp modal reuses the same cached result.
 *
 * @param enabled - Whether the request should run.
 * @return React Query handle.
 */
export function useMembershipsProducts( enabled: boolean ) {
	return useQuery< MembershipsProduct[], Error >( {
		// Deliberately not prefixed with `subscribers` — products don't change when a
		// subscriber is added/comped/removed, so they must survive the broad
		// `invalidateQueries( [ 'subscribers' ] )` those mutations fire.
		queryKey: [ 'memberships-products' ],
		queryFn: fetchMembershipsProducts,
		enabled,
		staleTime: 5 * 60 * 1000,
	} );
}
