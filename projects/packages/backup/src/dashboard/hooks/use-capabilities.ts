import { useQuery } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { fetchCapabilities, type Capabilities } from '../data/api/capabilities';
import { keys } from '../data/query-client';
import { useStickyError } from './use-sticky-error';

const CAPABILITIES_STALE_MS = 5 * 60_000;

type Result = {
	data: Capabilities | undefined;
	/** True only on the very first load, never during a retry. */
	isLoading: boolean;
	error: Error | null;
	/** A retry is in flight and there is already something on screen. */
	isRetrying: boolean;
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
	// Held across the refetch. React Query rewinds an errored query that
	// holds no data back to `pending`, so without this the error vanishes
	// in the same render as the click — and this is the query whose error
	// screen wraps the entire dashboard body.
	const error = useStickyError( query.error ?? null, query.isFetching );

	return {
		data: query.data,
		// `isPending && isFetching` rather than React Query's `isLoading`:
		// the rewind makes a retry pending again, so `isLoading` is true
		// for the whole round trip and the error screen would be replaced
		// by a spinner. This has to mean "nothing has ever been shown".
		isLoading: query.isPending && query.isFetching && error === null,
		error,
		// Not `query.isRefetching`: that is `isFetching && ! isPending`,
		// and the rewind makes a retry pending, so it stays false exactly
		// when it is needed.
		isRetrying: query.isFetching && ( error !== null || query.data !== undefined ),
		refetch: retry,
	};
}
