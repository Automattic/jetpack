/**
 * Stage 1 dispatch: chooses legacy ScanRoute or v2 based on the flag.
 * Stage 2 deletes this file and points the route directly at v2.
 */
import useScanV2Enabled from '../../hooks/use-scan-v2-enabled';
import ScanV2Route from './v2';
import ScanRoute from './index';

/**
 * Dispatches between the legacy and v2 scan routes based on the
 * `JETPACK_PROTECT_SCAN_V2` flag (or the `?protect-scan-v2=1` URL
 * override).
 *
 * @return The legacy or v2 scan route component.
 */
export default function ScanDispatchRoute() {
	return useScanV2Enabled() ? <ScanV2Route /> : <ScanRoute />;
}
