import { ThreatsDataViews } from '@automattic/jetpack-components';
import { type Threat, CURRENT_TABLE_FIELDS } from '@automattic/jetpack-scan';
import { useCallback } from 'react';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useModal from '../../hooks/use-modal';
import ScanToggleGroupControl from './scan-toggle-group-control';

/**
 * Scan Results Data Views
 *
 * @return {JSX.Element} ScanResultDataViews component.
 */
export default function ScanResultsDataViews() {
	const { data: status } = useScanStatusQuery( { usePolling: true } );

	const { setModal } = useModal();

	const onFixThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'FIX_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	const onIgnoreThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'IGNORE_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataViews
			data={ status ? status.threats : [] }
			initialFields={ CURRENT_TABLE_FIELDS }
			onFixThreats={ onFixThreats }
			onIgnoreThreats={ onIgnoreThreats }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
