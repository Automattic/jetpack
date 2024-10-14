import { ThreatsDataView } from '@automattic/jetpack-components';
import useHistoryQuery from '../../../data/scan/use-history-query';

/**
 * Scan History Data View
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanHistoryDataView() {
	const { data } = useHistoryQuery();

	// const onFixThreat = useCallback( ( )

	// Return early when scan history is unavailable (i.e. user does not have the required plan)
	if ( ! data ) {
		return null;
	}

	return (
		<ThreatsDataView
			data={ data.threats }
			// onFixThreat={}
			// onIgnoreThreat={ }
			// onUnignoreThreat={ }
		/>
	);
}
