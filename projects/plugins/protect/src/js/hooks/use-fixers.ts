import { useMemo } from 'react';
import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';
import { FixersStatus } from '../types/fixers';

type UseFixersResult = {
	fixableThreatIds: number[];
	fixInProgressThreatIds: number[];
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

	// List of threat IDs that are currently being fixed.
	const fixInProgressThreatIds = useMemo(
		() =>
			Object.entries( fixersStatus?.threats || {} )
				.filter(
					( [ , threat ]: [ string, { status?: string } ] ) => threat.status === 'in_progress'
				)
				.map( ( [ id ] ) => parseInt( id ) ),
		[ fixersStatus ]
	);

	return {
		fixableThreatIds: status.fixableThreatIds,
		fixInProgressThreatIds,
		fixersStatus,
		fixThreats: fixersMutation.mutateAsync,
		isLoading: fixersMutation.isPending,
	};
}
