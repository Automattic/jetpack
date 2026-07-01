/**
 * External dependencies
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Create the caption manager modal's own query client.
 *
 * The modal is hosted both in the block editor (which has no ambient query
 * client) and the dashboard (which has its own, with its own cache keys); a
 * dedicated per-mount client gives every host the same behavior without
 * coupling the modal to either environment.
 *
 * @return {QueryClient} The query client.
 */
export const createCaptionManagerQueryClient = (): QueryClient =>
	new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
				refetchOnWindowFocus: false,
			},
		},
	} );

/**
 * Write query data after cancelling any in-flight fetch for the key, so a
 * now-stale response can't overwrite the write. Cancellation asynchronously
 * reverts the query to its pre-fetch state — a synchronous write here would
 * itself be reverted — so the write lands once the revert has settled.
 *
 * @param {QueryClient} queryClient - Query client to write to.
 * @param {unknown[]}   queryKey    - Key of the query to cancel and write.
 * @param {Function}    update      - Maps the current cached value to the next one.
 */
export const cancelQueryThenSetData = < T >(
	queryClient: QueryClient,
	queryKey: unknown[],
	update: ( current: T | undefined ) => T
): void => {
	void queryClient.cancelQueries( { queryKey } ).then( () => {
		queryClient.setQueryData< T >( queryKey, update );
	} );
};
