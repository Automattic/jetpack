import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import ScanButton from './scan-button';
import { checkScanAgain, startScan, useIsScanning, useScan, useScanRequest } from './store';
import type { ScanState } from './types';

/**
 * The page header's Scan button, or Check again once polling a running scan gives up.
 *
 * @return The button.
 */
export default function HeaderScanButton() {
	// The stage only renders this once PHP has printed the Scan state.
	const scan = useScan() as ScanState;
	const { isStarting, hasStoppedPolling } = useScanRequest();
	const isScanning = useIsScanning();
	const [ isChecking, setIsChecking ] = useState( false );
	const checkAgain = useCallback( () => {
		setIsChecking( true );
		checkScanAgain().finally( () => setIsChecking( false ) );
	}, [] );

	if ( isScanning && hasStoppedPolling ) {
		return (
			<Button variant="minimal" size="compact" onClick={ checkAgain } loading={ isChecking }>
				{ __( 'Check again', 'jetpack-protect-pkg' ) }
			</Button>
		);
	}

	return (
		<ScanButton
			scan={ scan }
			isStarting={ isStarting }
			onScan={ startScan }
			label={
				isScanning
					? __( 'Scanning…', 'jetpack-protect-pkg' )
					: __( 'Scan site', 'jetpack-protect-pkg' )
			}
			disabled={ isScanning }
			variant="minimal"
			size="compact"
		/>
	);
}
