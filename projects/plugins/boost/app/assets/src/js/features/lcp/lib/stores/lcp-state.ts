import { useSingleModuleState } from '$features/module/lib/stores';
import { useDataSync, useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import type { LcpState } from './lcp-state-types';
import { LcpStateSchema } from './lcp-state-types';

/**
 * Hook for accessing and writing to the overall Lcp state.
 */
export function useLcpState() {
	const [ lcp ] = useSingleModuleState( 'lcp' );
	const enabled = lcp?.active;

	return useDataSync( 'jetpack_boost_ds', 'lcp_state', LcpStateSchema, {
		query: {
			refetchInterval: refetch => {
				if ( ! enabled ) {
					return false;
				}

				return refetch.state.data?.status === 'pending' ? 2000 : 30000;
			},
		},
	} );
}

/**
 * Helper for creating a valid Lcp error state object.
 */
export function lcpErrorState(): LcpState {
	return {
		pages: [],
		status: 'error',
	};
}

/**
 * Hook which creates a callable action for optimizing Lcp.
 * @param onSuccess
 */
export function useOptimizeLcpAction( onSuccess?: ( state: LcpState ) => void ) {
	const optimisticState: LcpState = { status: 'pending', pages: [] };

	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'lcp_state',
		action_name: 'request-analyze',
		schema: {
			state: LcpStateSchema,
			action_request: z.void(),
			action_response: z.object( {
				success: z.boolean(),
				state: LcpStateSchema,
				error: z.string().optional(),
			} ),
		},
		callbacks: {
			optimisticUpdate: ( _requestData, _state: LcpState ) => optimisticState,
			onResult: ( result, _state ): LcpState => {
				if ( result.success ) {
					if ( onSuccess ) {
						onSuccess( result.state );
					}

					return result.state;
				}

				return lcpErrorState();
			},
		},
	} );
}
