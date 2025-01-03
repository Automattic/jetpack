import { ThreatsDataViews } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { useCallback } from 'react';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useModal from '../../hooks/use-modal';

/**
 * Scan Results Data View
 *
 * @param {object}      props        - Component props.
 * @param {JSX.Element} props.header - Header component.
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanResultsDataViews( { header }: { header: JSX.Element } ) {
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
			onFixThreats={ onFixThreats }
			onIgnoreThreats={ onIgnoreThreats }
			header={ header }
		/>
	);
}
