import { getScan, isNotScannedYet } from '../sections/scan/store';
import { recordEvent } from './tracks';
import type { ScanState } from '../sections/scan/types';

/**
 * The scan status for the page view: the Protect plugin's values, plus `not_scanned` before the first scan.
 *
 * @param scan - The latest report.
 * @return The status.
 */
function getCheckStatus( scan: ScanState ): string {
	if ( scan.error ) {
		return 'error';
	}
	if ( ! scan.scanning ) {
		// The card's failed-scan and first-scan prompts, in its order.
		if ( scan.lastScanFailed && ! scan.threats?.length ) {
			return 'error';
		}
		if ( isNotScannedYet( scan ) ) {
			return 'not_scanned';
		}
	}
	return scan.lastChecked ? 'active' : 'in_progress';
}

/**
 * Record a page view for a dashboard tab, named after the Protect plugin screen it replaces.
 *
 * @param tab     - The tab, such as "overview".
 * @param section - The Settings card the tab opened at, if any.
 */
export function recordPageView( tab: string, section?: string ): void {
	const scan = getScan();
	const plan = scan ? { has_plan: scan.hasPlan } : {};

	switch ( tab ) {
		case 'overview':
			recordEvent( 'jetpack_protect_admin_page_view', {
				...plan,
				...( scan && { check_status: getCheckStatus( scan ) } ),
			} );
			break;
		case 'history':
			recordEvent( 'jetpack_protect_scan_history_page_view' );
			break;
		case 'settings':
			recordEvent( 'jetpack_protect_settings_page_view', {
				...plan,
				...( section && { section } ),
			} );
			break;
	}
}
