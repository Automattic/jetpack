import { ThreatsDataViews } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { useCallback } from 'react';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useModal from '../../../hooks/use-modal';

/**
 * Scan Results Data View
 *
 * @param {object}      props        - Component props.
 * @param {JSX.Element} props.header - Header component.
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function HistoryDataViews( { header }: { header?: JSX.Element } ) {
	const { data: history } = useHistoryQuery();

	const { setModal } = useModal();

	const onUnignoreThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'UNIGNORE_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataViews
			data={ history ? history.threats : [] }
			onUnignoreThreats={ onUnignoreThreats }
			header={ header }
		/>
	);
}
