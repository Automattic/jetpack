import { useConnection } from '@automattic/jetpack-connection';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo } from 'react';
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

	const now = useMemo( () => new Date(), [] ); // Memoize current time to prevent recalculation

	// Helper function to check if the fixer is stale
	const fixerIsStale = useCallback(
		( lastUpdated: string ) => {
			const hoursDiff = ( now.getTime() - new Date( lastUpdated ).getTime() ) / ( 1000 * 60 * 60 );
			return hoursDiff >= 24;
		},
		[ now ]
	);

	// Memoize initial data to prevent recalculating on every render
	const initialData = useMemo( () => {
		return (
			window.jetpackProtectInitialState?.fixerStatus || {
				ok: true,
				threats: {},
			}
		);
	}, [] );

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
		queryKey: [ QUERY_FIXERS_KEY ],
		queryFn: async () => {
			const data = await API.getFixersStatus( threatIds );
			const cachedData = queryClient.getQueryData( [ QUERY_FIXERS_KEY ] ) as
				| FixersStatus
				| undefined;

			const successes: string[] = [];
			const failures: string[] = [];

			Object.keys( data?.threats || {} ).forEach( threatId => {
				const threat = data.threats[ threatId ];
				const cachedThreat = cachedData?.threats?.[ threatId ];

				if ( cachedThreat?.status === 'in_progress' ) {
					// If still in progress
					if ( threat.status === 'in_progress' ) {
						if (
							! fixerIsStale( cachedThreat.last_updated ) &&
							fixerIsStale( threat.last_updated )
						) {
							failures.push( threatId );
						}
					}

					// Handle completion of fixers
					if ( threat.status !== 'in_progress' ) {
						queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
						queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

						if ( threat.status === 'fixed' ) {
							successes.push( threatId );
						} else {
							failures.push( threatId );
						}
					}
				}
			} );

			showBulkNotices( failures, successes );
			return data;
		},
		retry: false,
		refetchInterval( query ) {
			if ( ! usePolling || ! query.state.data ) {
				return false;
			}

			const inProgressNotStale = Object.values( query.state.data.threats ).some(
				( threat: { status: string; last_updated: string } ) =>
					threat.status === 'in_progress' && ! fixerIsStale( threat.last_updated )
			);

			if ( inProgressNotStale ) {
				return query.state.dataUpdateCount < 5 ? 5000 : 15000;
			}

			return false;
		},
		initialData,
		enabled: isRegistered,
	} );

	// Handle error if present in the query result
	useEffect( () => {
		if ( fixersQuery.isError && fixersQuery.error ) {
			queryClient.setQueryData( [ QUERY_FIXERS_KEY ], initialData );
			showErrorNotice( __( 'An error occurred while fetching fixers status.', 'jetpack-protect' ) );
		}
	}, [ fixersQuery.isError, fixersQuery.error, queryClient, initialData, showErrorNotice ] );

	return fixersQuery;
}
