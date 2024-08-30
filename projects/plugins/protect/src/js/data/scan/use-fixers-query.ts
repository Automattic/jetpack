import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_FIXERS_KEY, QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Fixers Query Hook
 *
 * @param {object}   args            - Hook arguments.
 * @param {number[]} args.threatIds  - The threat IDs to monitor for fixer status.
 * @param {boolean}  args.usePolling - Whether to continuously poll for fixer status while fixers are in progress.
 *
 * @return {object} The query hook.
 */
export default function useFixersQuery( {
	threatIds = [],
	usePolling,
}: {
	threatIds: number[];
	usePolling?: boolean;
} ) {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_FIXERS_KEY ],
		queryFn: async () => {
			const data = await API.getFixersStatus( threatIds );
			const cachedData = queryClient.getQueryData( [ QUERY_FIXERS_KEY ] ) as
				| { threats: object }
				| undefined;

			// Check if any fixers have completed, by comparing the latest data against the cache.
			data?.threats &&
				Object.entries( data.threats ).forEach( ( [ , threat ] ) => {
					const typedThreat = threat as { id: number; status: string }; // Ensure threat has the correct type

					// Find the specific threat in the cached data.
					const cachedThreat =
						cachedData?.threats &&
						Object.values( cachedData.threats ).find(
							( t: { id: number } ) => t.id === typedThreat.id
						);

					if (
						cachedThreat &&
						cachedThreat.status === 'in_progress' &&
						typedThreat.status !== 'in_progress'
					) {
						// Invalidate related queries.
						queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
						queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

						// Show a relevant notice.
						if ( typedThreat.status === 'fixed' ) {
							showSuccessNotice( __( 'Threat fixed successfully.', 'jetpack-protect' ) );
						} else if ( typedThreat.status === 'not_fixed' ) {
							showErrorNotice( __( 'Threat could not be fixed.', 'jetpack-protect' ) );
						}
					}
				} );

			return data;
		},
		initialData: window.jetpackProtectInitialState?.fixerStatus,
		refetchInterval( query ) {
			if ( ! usePolling || ! query.state.data ) {
				return false;
			}

			// Refetch if any threats are still in progress.
			if (
				Object.values( query.state.data.threats ).some(
					( threat: { status: string } ) => threat.status === 'in_progress'
				)
			) {
				// Refetch on a shorter interval first, then slow down if it is taking a while.
				return query.state.dataUpdateCount < 5 ? 5_000 : 15_000;
			}

			return false;
		},
		enabled: isRegistered,
	} );
}
