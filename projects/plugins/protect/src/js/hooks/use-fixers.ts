import { useMemo } from 'react';
import useFixersMutation from '../data/scan/use-fixers-mutation';
import useFixersQuery from '../data/scan/use-fixers-query';
import useScanStatusQuery from '../data/scan/use-scan-status-query';
import { FixersStatus } from '../types/fixers';
import { Threat } from '../types/threats';

type UseFixersResult = {
	fixableThreats: Threat[];
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
		threatIds: fixableThreats.map( threat => threat.id ),
		usePolling: true,
	} );

	return {
		fixableThreats,
		fixersStatus,
		fixThreats: fixersMutation.mutateAsync,
		isLoading: fixersMutation.isPending,
	};
}
