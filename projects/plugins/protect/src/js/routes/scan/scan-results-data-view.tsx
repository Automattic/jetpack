import { ThreatsDataView } from '@automattic/jetpack-components';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';

/**
 * Scan Results Data View
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanResultsDataView() {
	const { data } = useScanStatusQuery();

	return <ThreatsDataView data={ data.threats } />;
}
