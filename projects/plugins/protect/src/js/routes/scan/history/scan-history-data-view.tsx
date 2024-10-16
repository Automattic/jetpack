import { ThreatsDataView } from '@automattic/jetpack-components';
import useHistoryQuery from '../../../data/scan/use-history-query';

/**
 * Scan History Data View
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanHistoryDataView() {
	const { data } = useHistoryQuery();

	return <ThreatsDataView data={ data.threats } />;
}
