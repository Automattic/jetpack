import { useMemo } from 'react';
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
		const result = [];
		status.core?.threats.forEach( threat => {
			if ( threat.fixable ) {
				result.push( threat );
			}
		} );
		status.plugins?.forEach( plugin => {
			plugin.threats.forEach( threat => {
				if ( threat.fixable ) {
					result.push( threat );
				}
			} );
		} );
		status.themes?.forEach( theme => {
			theme.threats.forEach( threat => {
				if ( threat.fixable ) {
					result.push( threat );
				}
			} );
		} );
		status.files?.forEach( threat => {
			if ( threat.fixable ) {
				result.push( threat );
			}
		} );
		status.database?.forEach( threat => {
			if ( threat.fixable ) {
				result.push( threat );
			}
		} );
		return result;
	}, [ status ] );

	const { data: fixersStatus } = useFixersQuery( {
		threatIds: fixableThreats.map( threat => parseInt( threat.id ) ),
	} );

	const fixThreats = async ( threatIds: number[] ) => fixersMutation.mutateAsync( threatIds );

	return {
		fixableThreats,
		fixersStatus,
		fixThreats,
	};
}
