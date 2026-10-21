import { __ } from '@wordpress/i18n';
import ScanButton from './scan-button';
import { startScan, useIsScanning, useScan, useScanRequest } from './store';
import type { ScanState } from './types';

/**
 * The page header's Scan button.
 *
 * @return The button.
 */
export default function HeaderScanButton() {
	// The stage only renders this once PHP has printed the Scan state.
	const scan = useScan() as ScanState;
	const { isStarting } = useScanRequest();
	const isScanning = useIsScanning();

	return (
		<ScanButton
			scan={ scan }
			isStarting={ isStarting }
			onScan={ startScan }
			label={
				isScanning
					? __( 'Scanning…', 'jetpack-protect-pkg' )
					: __( 'Scan now', 'jetpack-protect-pkg' )
			}
			disabled={ isScanning }
			variant="outline"
			size="compact"
		/>
	);
}
