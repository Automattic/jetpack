import { useMemo } from 'react';
import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';
import { FixersStatus } from '../types/fixers';

type UseFixersResult = {
	fixableThreatIds: number[];
	activefixInProgressThreatIds: number[];
	stalefixInProgressThreatIds: number[];
	fixersStatus: FixersStatus;
	fixThreats: ( threatIds: number[] ) => Promise< unknown >;
	isLoading: boolean;
};

/**
 * Use Fixers Hook
 *
 * @return {UseFixersResult} Fixers object
 */
export default function useFixers(): UseFixersResult {
	const { data: status } = useScanStatusQuery();
	const fixersMutation = useFixersMutation();
	const { data: fixersStatus } = useFixersQuery( {
		threatIds: status.fixableThreatIds,
		usePolling: true,
	} );

	const { activefixInProgressThreatIds, stalefixInProgressThreatIds } = useMemo( () => {
		const now = new Date();

		return Object.entries( fixersStatus?.threats || {} ).reduce(
			( acc, [ id, threat ]: [ string, { status?: string; last_updated?: string } ] ) => {
				if ( threat.status === 'in_progress' ) {
					let isStale = false;

					// Check if 'last_updated' exists
					if ( threat.last_updated ) {
						const lastUpdatedDate = new Date( threat.last_updated );
						const timeDifferenceInHours =
							( now.getTime() - lastUpdatedDate.getTime() ) / ( 1000 * 60 * 60 );

						// If more than 24 hours have passed, mark as stale
						if ( timeDifferenceInHours > 24 ) {
							isStale = true;
						}
					}

					if ( isStale ) {
						acc.stalefixInProgressThreatIds.push( parseInt( id ) );
					} else {
						acc.activefixInProgressThreatIds.push( parseInt( id ) );
					}
				}
				return acc;
			},
			{
				activefixInProgressThreatIds: [] as number[],
				stalefixInProgressThreatIds: [] as number[],
			}
		);
	}, [ fixersStatus ] );

	return {
		fixableThreatIds: status.fixableThreatIds,
		activefixInProgressThreatIds,
		stalefixInProgressThreatIds,
		fixersStatus,
		fixThreats: fixersMutation.mutateAsync,
		isLoading: fixersMutation.isPending,
	};
}
