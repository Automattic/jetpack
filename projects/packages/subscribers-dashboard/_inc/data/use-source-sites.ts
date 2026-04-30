import { useQuery } from '@tanstack/react-query';
import { fetchSourceSites } from './api';
import type { SourceSite } from './api';

/**
 * Fetch the WPCOM sites the connected user owns and could migrate subscribers from. Used by
 * the Migrate tab in the Add Subscribers modal. Disabled until the modal is opened so we don't
 * pre-warm a request the user may never need.
 *
 * @param enabled - Whether the request should run (typically `true` once the Migrate tab is shown).
 * @return React Query handle.
 */
export function useSourceSites( enabled: boolean ) {
	return useQuery< SourceSite[], Error >( {
		queryKey: [ 'subscribers', 'source-sites' ],
		queryFn: fetchSourceSites,
		enabled,
		staleTime: 5 * 60 * 1000,
	} );
}
