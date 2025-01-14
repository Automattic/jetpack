import { useCallback } from 'react';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ScanDataViews from './scan-data-views';

/**
 * Current Threats Data Views
 *
 * @return {JSX.Element} CurrentThreatsDataViews component.
 */
export default function CurrentThreatsDataViews() {
	const { wafSupported } = useWafData();
	const { data: status } = useScanStatusQuery();

	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_threat_modal_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	return (
		<ScanDataViews
			data={ status ? status.threats : [] }
			isSupportedEnvironment={ wafSupported }
			handleUpgradeClick={ ! hasPlan ? getScan : null }
		/>
	);
}
