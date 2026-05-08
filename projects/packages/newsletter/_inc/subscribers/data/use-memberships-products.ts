import { useQuery } from '@tanstack/react-query';
import { fetchMembershipsProducts } from './api';
import type { MembershipsProduct } from './api';

/**
 * Fetch the paid newsletter / membership products configured on this site. Lazy — only runs
 * when the consumer asks for it (the Comp modal needs it; nothing else does).
 *
 * @param enabled - Whether the request should run (typically `true` once the modal is open).
 * @return React Query handle.
 */
export function useMembershipsProducts( enabled: boolean ) {
	return useQuery< MembershipsProduct[], Error >( {
		queryKey: [ 'subscribers', 'memberships-products' ],
		queryFn: fetchMembershipsProducts,
		enabled,
		staleTime: 5 * 60 * 1000,
	} );
}
