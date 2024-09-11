import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
import API from '../../api';
import { QUERY_FIXERS_KEY, QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { FixersStatus } from '../../types/fixers';

/**
 * Fixers Query Hook
 *
 * @param {object}   args            - Hook arguments.
 * @param {number[]} args.threatIds  - The threat IDs to monitor for fixer status.
 * @param {boolean}  args.usePolling - Whether to continuously poll for fixer status while fixers are in progress.
 *
 * @return {UseQueryResult} The query hook result.
 */
export default function useFixersQuery( {
	threatIds,
	usePolling,
}: {
	threatIds: number[];
	usePolling?: boolean;
} ): UseQueryResult< FixersStatus > {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	// Memoize initialData to prevent recalculating on every render
	const initialData: FixersStatus = useMemo(
		() =>
			window.jetpackProtectInitialState?.fixerStatus || {
				ok: false,
				threats: {},
			},
		[]
	);

	const fixersQuery = useQuery( {
		queryKey: [ QUERY_FIXERS_KEY ],
		queryFn: async () => {
			// Fetch fixer status from API
			const data = await API.getFixersStatus( threatIds );
			const cachedData = queryClient.getQueryData( [ QUERY_FIXERS_KEY ] ) as
				| FixersStatus
				| undefined;

			// Check if any fixers have completed, by comparing the latest data against the cache.
			Object.keys( data?.threats ).forEach( ( threatId: string ) => {
				const threat = data?.threats[ threatId ];
				const cachedThreat = cachedData?.threats?.[ threatId ];

				if (
					cachedThreat &&
					cachedThreat.status === 'in_progress' &&
					threat.status !== 'in_progress'
				) {
					// Invalidate related queries when a fixer has completed.
					queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
					queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

					// Show a relevant notice.
					if ( threat.status === 'fixed' ) {
						showSuccessNotice( __( 'Threat fixed successfully.', 'jetpack-protect' ) );
					} else {
						showErrorNotice( __( 'Threat could not be fixed.', 'jetpack-protect' ) );
					}
				}
			} );

			// Return the fetched data so the query resolves
			return data;
		},
		retry: false,
		refetchInterval( query ) {
			if ( ! usePolling || ! query.state.data ) {
				return false;
			}

			// Refetch while any threats are still in progress.
			if (
				Object.values( query.state.data?.threats ).some(
					( threat: { status: string } ) => threat.status === 'in_progress'
				)
			) {
				// Refetch on a shorter interval first, then slow down if it is taking a while.
				return query.state.dataUpdateCount < 5 ? 5_000 : 15_000;
			}

			return false;
		},
		initialData: initialData,
		enabled: isRegistered,
	} );

	// Handle error if present in the query result
	useEffect( () => {
		if ( fixersQuery.isError && fixersQuery.error ) {
			// Reset the query data to initial state
			queryClient.setQueryData( [ QUERY_FIXERS_KEY ], initialData );

			// Show an error notice
			showErrorNotice( __( 'An error occurred while fetching fixers status.', 'jetpack-protect' ) );
		}
	}, [ fixersQuery.isError, fixersQuery.error, queryClient, initialData, showErrorNotice ] );

	return fixersQuery;
}
