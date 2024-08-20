import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../constants';
import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';

/**
 * Use Fixers Hook
 *
 * @return {object} Fixers object
 */
export default function useFixers() {
	const queryClient = useQueryClient();
	const { data: status } = useScanStatusQuery();
	const fixersMutation = useFixersMutation();

	const fixableThreats = useMemo( () => {
		const threats = [
			...( status?.core?.threats || [] ),
			...( status?.plugins?.map( plugin => plugin.threats ).flat() || [] ),
			...( status?.themes?.map( theme => theme.threats ).flat() || [] ),
			...( status?.files || [] ),
			...( status?.database || [] ),
		];

		return threats.filter( threat => threat.fixable );
	}, [ status ] );

	const { data: fixersStatus } = useFixersQuery( {
		threatIds: fixableThreats.map( threat => parseInt( threat.id ) ),
		usePolling: true,
	} );

	const fixThreats = useCallback(
		async ( threatIds: number[] ) => fixersMutation.mutateAsync( threatIds ),
		[ fixersMutation ]
	);

	// List of threat IDs that are currently being fixed.
	const fixInProgressThreatIds = useMemo(
		() =>
			Object.values( fixersStatus?.threats || {} )
				.filter( ( threat: { status?: string } ) => threat.status === 'in_progress' )
				.map( ( threat: { id?: string } ) => parseInt( threat.id ) ),
		[ fixersStatus ]
	);

	useEffect( () => {
		if (
			Object.values( fixersStatus?.threats ).some(
				( threat: { status: string } ) => threat.status !== 'in_progress'
			)
		) {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
		}
	}, [ fixersStatus, queryClient ] );

	return {
		fixableThreats,
		fixersStatus,
		fixThreats,
		fixInProgressThreatIds,
		isLoading: fixersMutation.isPending,
	};
}
