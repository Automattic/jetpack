import { z } from 'zod';
import { useDataSyncAction } from './use-data-sync-action';
import { useDataSyncEntry } from './use-data-sync-entry';

const lcpErrorSchema = z.object( {
	type: z.string(),
	meta: z
		.object( {
			code: z.number().nullable().optional(),
			selector: z.string().nullable().optional(),
		} )
		.nullable()
		.optional(),
} );

const lcpPageSchema = z.object( {
	key: z.string(),
	url: z.string(),
	status: z.string(),
	errors: z.array( lcpErrorSchema ).nullable().optional(),
} );

const lcpStateSchema = z
	.object( {
		pages: z.array( lcpPageSchema ),
		status: z.enum( [ 'not_analyzed', 'analyzed', 'pending', 'error' ] ),
		updated: z.number().nullable().optional(),
	} )
	.nullable();

export type LcpState = NonNullable< z.infer< typeof lcpStateSchema > >;
export type LcpPage = z.infer< typeof lcpPageSchema >;

/**
 * Reads the LCP optimization state. Polls every 2s while a request is
 * pending so the Status card updates as pages are analyzed, then
 * relaxes to 30s once idle.
 *
 * @return Query result for `lcp_state`.
 */
export function useLcpState() {
	return useDataSyncEntry( 'lcp_state', lcpStateSchema, {
		refetchInterval: query => ( query.data?.status === 'pending' ? 2000 : 30000 ),
		staleTime: 0,
	} )[ 0 ];
}

/**
 * Triggers a server-side LCP analysis pass. Invalidates the state
 * query so the Status card flips into `pending` immediately.
 *
 * @return Mutation that fires the analyze request.
 */
export function useRequestLcpAnalyze() {
	return useDataSyncAction( 'lcp_state', 'request-analyze', lcpStateSchema, [
		[ 'jetpack_boost_ds', 'lcp_state' ],
	] );
}
