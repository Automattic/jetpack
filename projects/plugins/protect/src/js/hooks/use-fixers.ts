import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';

/**
 * Use Fixers Hook
 *
 * @return {object} Fixers object
 */
export default function useFixers() {
	const { data: status } = useScanStatusQuery();
	const { fixableThreats } = status;
	const fixersMutation = useFixersMutation();

	const { data: fixersStatus } = useFixersQuery( { threatIds: fixableThreats, usePolling: true } );

	const fixThreats = async ( threatIds: number[] ) => fixersMutation.mutateAsync( threatIds );

	return {
		fixableThreats,
		fixersStatus,
		fixThreats,
		isLoading: fixersMutation.isPending,
	};
}
