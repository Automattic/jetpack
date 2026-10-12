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
	DEVICE_LABELS[ deviceType.toLowerCase() ] || deviceType;

const deviceKey = ( row: SessionsByDeviceRow ): string => row.device_type.toLowerCase();

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
	const previous = new Map(
		( comparison?.data ?? [] ).map( row => [ deviceKey( row ), row.active_sessions ] )
	);
	const segments: DonutSegmentInput[] = ( primary?.data ?? [] ).map( row => ( {
		label: getDeviceLabel( row.device_type ),
		value: row.active_sessions,
		previousValue: comparison ? ( previous.get( deviceKey( row ) ) ?? 0 ) : undefined,
	} ) );

	const seen = new Set( ( primary?.data ?? [] ).map( deviceKey ) );
	for ( const row of comparison?.data ?? [] ) {
		if ( seen.has( deviceKey( row ) ) ) {
			continue;
		}
		seen.add( deviceKey( row ) );
		segments.push( {
			label: getDeviceLabel( row.device_type ),
			value: 0,
			previousValue: row.active_sessions,
		} );
	}

	return segments;
}
