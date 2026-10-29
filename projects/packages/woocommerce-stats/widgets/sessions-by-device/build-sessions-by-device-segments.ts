/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { DonutSegmentInput } from '@automattic/jetpack-premium-analytics-sdk';

type SessionsByDeviceRow = {
	device_type: string;
	active_sessions: number;
};

type SessionsByDeviceReport = {
	data: readonly SessionsByDeviceRow[];
};

const DEVICE_LABELS: Record< string, string > = {
	mobile: __( 'Mobile', 'jetpack-woocommerce-stats-pkg' ),
	desktop: __( 'Desktop', 'jetpack-woocommerce-stats-pkg' ),
	tablet: __( 'Tablet', 'jetpack-woocommerce-stats-pkg' ),
};

const getDeviceLabel = ( deviceType: string ): string =>
	DEVICE_LABELS[ deviceType.toLowerCase() ] ||
	deviceType ||
	__( 'Unknown', 'jetpack-woocommerce-stats-pkg' );

const deviceKey = ( row: SessionsByDeviceRow ): string => row.device_type.toLowerCase();

/**
 * Sums a report's sessions per device, in the order the report lists the devices.
 *
 * @param {SessionsByDeviceReport|undefined} report - The report.
 * @return {Map<string, SessionsByDeviceRow>} The rows by device key; rows with one key merge.
 */
function sessionsByDevice( report: SessionsByDeviceReport | undefined ) {
	const devices = new Map< string, SessionsByDeviceRow >();
	for ( const row of report?.data ?? [] ) {
		const seen = devices.get( deviceKey( row ) );
		devices.set( deviceKey( row ), {
			device_type: seen?.device_type ?? row.device_type,
			active_sessions: ( seen?.active_sessions ?? 0 ) + row.active_sessions,
		} );
	}
	return devices;
}

/**
 * Maps the report rows to segments, one per device seen in either period, the selected period's
 * devices first. The report lists only the devices with sessions, so a device seen in one period
 * alone counts as zero in the other.
 *
 * @param {SessionsByDeviceReport|undefined} primary    - The selected period's report.
 * @param {SessionsByDeviceReport|undefined} comparison - The comparison period's report; undefined while the comparison is off.
 * @return {DonutSegmentInput[]} The segments, in the order the reports list the devices.
 */
export function buildSessionsByDeviceSegments(
	primary: SessionsByDeviceReport | undefined,
	comparison: SessionsByDeviceReport | undefined
): DonutSegmentInput[] {
	const current = sessionsByDevice( primary );
	const previous = sessionsByDevice( comparison );
	const segments: DonutSegmentInput[] = [ ...current ].map( ( [ key, row ] ) => ( {
		label: getDeviceLabel( row.device_type ),
		value: row.active_sessions,
		previousValue: comparison ? ( previous.get( key )?.active_sessions ?? 0 ) : undefined,
	} ) );

	for ( const [ key, row ] of previous ) {
		if ( ! current.has( key ) ) {
			segments.push( {
				label: getDeviceLabel( row.device_type ),
				value: 0,
				previousValue: row.active_sessions,
			} );
		}
	}

	return segments;
}
