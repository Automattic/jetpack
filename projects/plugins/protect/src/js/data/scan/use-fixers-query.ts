import { useConnection } from '@automattic/jetpack-connection';
import { type FixersStatus, type ThreatFixStatus } from '@automattic/jetpack-scan';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import API from '../../api';
import { QUERY_FIXERS_KEY, QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import { fixerTimestampIsStale } from '../../hooks/use-fixers';
import useNotices from '../../hooks/use-notices';

const initialData: FixersStatus = window.jetpackProtectInitialState?.fixerStatus || {
	ok: true,
	threats: {},
};

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

	// Helper to show success or failure notices
	const showBulkNotices = useCallback(
		( failures: string[], successes: string[] ) => {
			if ( failures.length > 0 ) {
				// Translators: %d is the number of threats, and %s is a list of threat IDs.
				const failureMessage = _n(
					'A threat could not be fixed.',
					'%d threats could not be fixed.',
					failures.length,
					'jetpack-protect'
				);
				showErrorNotice( sprintf( failureMessage, failures.length ) );
			} else if ( successes.length > 0 ) {
				// Translators: %d is the number of threats, and %s is a list of threat IDs.
				const successMessage = _n(
					'Threat fixed successfully.',
					'%d threats fixed successfully.',
					successes.length,
					'jetpack-protect'
				);
				showSuccessNotice( sprintf( successMessage, successes.length ) );
			}
		},
		[ showErrorNotice, showSuccessNotice ]
	);

	// Main query function to fetch fixer status
	const fixersQuery = useQuery( {
		queryKey: [ QUERY_FIXERS_KEY, threatIds ],
		queryFn: async () => {
			// Fetch fixer status from API
			const data = await API.getFixersStatus( threatIds );
			const cachedData = queryClient.getQueryData( [ QUERY_FIXERS_KEY ] ) as
				| FixersStatus
				| undefined;

			// Handle a top level error
			if ( data.ok === false ) {
				throw new Error( data.error );
			}

			const successes: string[] = [];
			const failures: string[] = [];

			Object.keys( data.threats || {} ).forEach( threatId => {
				const threat = data.threats[ threatId ];

				if ( cachedData.ok === true ) {
					const cachedThreat = cachedData.threats?.[ threatId ];

					if ( cachedThreat && cachedThreat.status === 'in_progress' ) {
						if ( threat.status === 'in_progress' ) {
							if (
								! fixerTimestampIsStale( cachedThreat.lastUpdated ) &&
								fixerTimestampIsStale( threat.lastUpdated )
							) {
								failures.push( threatId );
							}
						} else {
							queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
							queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

							if ( threat.status === 'fixed' ) {
								successes.push( threatId );
							} else {
								failures.push( threatId );
							}
						}
					}
				}
			} );

			showBulkNotices( failures, successes );

			// Return the fetched data so the query resolves
			return data;
		},
		retry: false,
		refetchInterval( query ) {
			if ( ! usePolling || ! query.state.data ) {
				return false;
			}

			const data = query.state.data;

			if ( data.ok === true ) {
				const inProgressNotStale = Object.values( data.threats ).some(
					( threat: ThreatFixStatus ) =>
						'status' in threat &&
						threat.status === 'in_progress' &&
						! fixerTimestampIsStale( threat.lastUpdated )
				);

				// Refetch while any threats are still in progress and not stale.
				if ( inProgressNotStale ) {
					// Refetch on a shorter interval first, then slow down if it is taking a while.
					return query.state.dataUpdateCount < 5 ? 5000 : 15000;
				}
			}

			return false;
		},
		initialData: initialData,
		enabled: isRegistered,
	} );

	// Handle error if present in the query result
	useEffect( () => {
		if ( fixersQuery.isError && fixersQuery.error ) {
			// Reset the query data to the initial state
			queryClient.setQueryData( [ QUERY_FIXERS_KEY ], initialData );
			showErrorNotice( __( 'An error occurred while fetching fixers status.', 'jetpack-protect' ) );
		}
	}, [ fixersQuery.isError, fixersQuery.error, queryClient, showErrorNotice ] );

	return fixersQuery;
}
