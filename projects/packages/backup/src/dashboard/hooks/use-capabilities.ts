import { useQuery } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { fetchCapabilities, type Capabilities } from '../data/api/capabilities';
import { keys } from '../data/query-client';

const CAPABILITIES_STALE_MS = 5 * 60_000;

type Result = {
	data: Capabilities | undefined;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
};

type Args = {
	/**
	 * Skip the request entirely when false. The bridge requires a
	 * user-level WPCOM connection, so asking from a site that doesn't
	 * have one only buys a 403 and a retry.
	 */
	enabled?: boolean;
};

/**
 * React Query hook returning the site's backup capabilities.
 *
 * @param args         - Hook args.
 * @param args.enabled - Whether to issue the request at all. Defaults to true.
 * @return Capabilities query state.
 */
export function useCapabilities( { enabled = true }: Args = {} ): Result {
	const query = useQuery( {
		queryKey: keys.capabilities(),
		queryFn: fetchCapabilities,
		staleTime: CAPABILITIES_STALE_MS,
		enabled,
	} );
	const { refetch } = query;
	// Wrapped so callers can hand it straight to `onClick` without
	// returning a floating promise from the event handler.
	const retry = useCallback( () => {
		refetch();
	}, [ refetch ] );
	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error ?? null,
		refetch: retry,
	};
}
