import { useQuery } from '@tanstack/react-query';
import { fetchCapabilities, type Capabilities } from '../data/api/capabilities';
import { keys } from '../data/query-client';

const CAPABILITIES_STALE_MS = 5 * 60_000;

type Result = {
	data: Capabilities | undefined;
	isLoading: boolean;
	error: Error | null;
};

/**
 * React Query hook returning the site's backup capabilities.
 *
 * @return Capabilities query state.
 */
export function useCapabilities(): Result {
	const query = useQuery( {
		queryKey: keys.capabilities(),
		queryFn: fetchCapabilities,
		staleTime: CAPABILITIES_STALE_MS,
	} );
	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
