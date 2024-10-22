import { ThreatsDataView } from '@automattic/jetpack-components';
import { useCallback } from 'react';
import useHistoryQuery from '../../data/scan/use-history-query';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useModal from '../../hooks/use-modal';
import { Threat } from '../../types/threats';

/**
 * Scan Results Data View
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanResultsDataView() {
	const { data: scanStatus } = useScanStatusQuery();
	const { data: history } = useHistoryQuery();

	const { setModal } = useModal();

	const onFixThreat = useCallback(
		( items: Threat[] ) => {
			setModal( { type: 'FIX_THREAT', props: { threat: items[ 0 ] } } );
		},
		[ setModal ]
	);

	const onIgnoreThreat = useCallback(
		( items: Threat[] ) => {
			setModal( { type: 'IGNORE_THREAT', props: { threat: items[ 0 ] } } );
		},
		[ setModal ]
	);

	const onUnignoreThreat = useCallback(
		( items: Threat[] ) => {
			setModal( { type: 'UNIGNORE_THREAT', props: { threat: items[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataView
			data={ [ ...scanStatus.threats, ...( history && history.threats ) ] }
			filters={ [
				{
					field: 'status',
					value: 'current',
					operator: 'is',
				},
			] }
			onFixThreat={ onFixThreat }
			onIgnoreThreat={ onIgnoreThreat }
			onUnignoreThreat={ onUnignoreThreat }
		/>
	);
}
