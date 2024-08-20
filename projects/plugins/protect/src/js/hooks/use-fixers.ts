import { useCallback, useMemo } from 'react';
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

	return {
		fixableThreats,
		fixersStatus,
		fixThreats,
		isLoading: fixersMutation.isPending,
	};
}
