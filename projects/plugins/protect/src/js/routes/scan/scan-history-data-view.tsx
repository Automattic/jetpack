import { ThreatsDataViews } from '@automattic/jetpack-components';
import { Threat } from '@automattic/jetpack-scan';
import { useCallback } from 'react';
import useHistoryQuery from '../../data/scan/use-history-query';
import useModal from '../../hooks/use-modal';

/**
 * Scan History Data View
 *
 * @param {object}      props        - Component props.
 * @param {JSX.Element} props.header - Header component.
 *
 * @return {JSX.Element} ScanHistoryDataView component.
 */
export default function ScanHistoryDataView( { header }: { header: JSX.Element } ) {
	const { setModal } = useModal();

	const { data: history } = useHistoryQuery();

	const onUnignoreThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'UNIGNORE_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataViews
			data={ history ? history.threats : [] }
			filters={ [] }
			onUnignoreThreats={ onUnignoreThreats }
			header={ header }
		/>
	);
}
