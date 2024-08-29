import { useConnection } from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_FIXERS_KEY } from '../../constants';

/**
 * Use Fixers Query
 *
 * @param {object}   args            - Object argument
 * @param {number[]} args.threatIds  - Threat IDs
 * @param {boolean}  args.usePolling - Use polling
 * @return {object} Query object
 */
export default function useFixersQuery( {
	threatIds = [],
	usePolling,
}: {
	threatIds: number[];
	usePolling?: boolean;
} ) {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_FIXERS_KEY ],
		queryFn: () => API.getFixersStatus( threatIds ),
		initialData: window.jetpackProtectInitialState?.fixerStatus,
		refetchInterval( query ) {
			if ( ! usePolling || ! query.state.data ) {
				return false;
			}

			if (
				Object.values( query.state.data.threats ).some(
					( threat: { status: string } ) => threat.status === 'in_progress'
				)
			) {
				// Refetch on a shorter interval first, then slow down if it is taking a while.
				return query.state.dataUpdateCount < 5 ? 5_000 : 15_000;
			}
		},
		enabled: isRegistered,
	} );
}
