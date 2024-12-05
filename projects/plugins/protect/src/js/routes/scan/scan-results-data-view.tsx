import { ThreatsDataViews } from '@automattic/jetpack-components';
import { Threat } from '@automattic/jetpack-scan';
import { useCallback } from 'react';
import useHistoryQuery from '../../data/scan/use-history-query';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useModal from '../../hooks/use-modal';

/**
 * Scan Results Data View
 *
 * @param {object} props         - Component props.
 * @param {Array}  props.filters - Default filters to apply to the data view.
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanResultsDataView( {
	filters = [],
}: {
	filters: React.ComponentProps< typeof ThreatsDataViews >[ 'filters' ];
} ) {
	const { setModal } = useModal();

	const { data: scanStatus } = useScanStatusQuery();
	const { data: history } = useHistoryQuery();

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

	const onUnignoreThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'UNIGNORE_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataViews
			data={ [ ...scanStatus.threats, ...( history ? history.threats : [] ) ] }
			filters={ filters }
			onFixThreats={ onFixThreats }
			onIgnoreThreats={ onIgnoreThreats }
			onUnignoreThreats={ onUnignoreThreats }
		/>
	);
}
