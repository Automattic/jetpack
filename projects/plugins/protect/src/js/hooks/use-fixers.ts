import { useCallback } from 'react';
import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';
import { FixersStatus, ThreatFixStatus } from '../types/fixers';

const FIXER_IS_STALE_THRESHOLD = 1000 * 60 * 60 * 24; // 24 hours

export const fixerTimestampIsStale = ( lastUpdatedTimestamp: string ) => {
	const now = new Date();
	const lastUpdated = new Date( lastUpdatedTimestamp );
	return now.getTime() - lastUpdated.getTime() >= FIXER_IS_STALE_THRESHOLD;
};

export const fixerStatusIsStale = ( fixerStatus: ThreatFixStatus ) => {
	return fixerStatus.status === 'in_progress' && fixerTimestampIsStale( fixerStatus.last_updated );
};

type UseFixersResult = {
	fixableThreatIds: number[];
	fixersStatus: FixersStatus;
	fixThreats: ( threatIds: number[] ) => Promise< unknown >;
	isLoading: boolean;
	isThreatFixInProgress: ( threatId: number ) => boolean;
	isThreatFixStale: ( threatId: number ) => boolean;
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

	const isThreatFixInProgress = useCallback(
		( threatId: number ) => {
			return fixersStatus?.threats?.[ threatId ]?.status === 'in_progress';
		},
		[ fixersStatus ]
	);

	const isThreatFixStale = useCallback(
		( threatId: number ) => {
			return fixerStatusIsStale( fixersStatus?.threats?.[ threatId ] );
		},
		[ fixersStatus ]
	);

	return {
		fixableThreatIds: status.fixableThreatIds,
		fixersStatus,
		fixThreats: fixersMutation.mutateAsync,
		isLoading: fixersMutation.isPending,
		isThreatFixInProgress,
		isThreatFixStale,
	};
}
