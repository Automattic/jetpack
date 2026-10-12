/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DonutSegmentInput } from '../../components/donut';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

type SessionsByDevice = ReportDataMap[ 'sessionsByDevice' ];

const DEVICE_LABELS: Record< string, string > = {
	mobile: __( 'Mobile', 'jetpack-premium-analytics-pkg' ),
	desktop: __( 'Desktop', 'jetpack-premium-analytics-pkg' ),
	tablet: __( 'Tablet', 'jetpack-premium-analytics-pkg' ),
};

function getDeviceLabel( deviceType: string ): string {
	return DEVICE_LABELS[ deviceType.toLowerCase() ] || deviceType;
}

function deviceKey( item: { device_type: string } ): string {
	return item.device_type.toLowerCase();
}

/**
 * Maps the report rows to segments, one per device seen in either period, the selected period's
 * devices first. The report lists only the devices with sessions, so a device seen in one period
 * alone counts as zero in the other.
 *
 * @param primary    - The selected period's report.
 * @param comparison - The comparison period's report; undefined while the comparison is off.
 * @return The segments, in the order the reports list the devices.
 */
export function buildSessionsByDeviceSegments(
	primary: SessionsByDevice | undefined,
	comparison: SessionsByDevice | undefined
): DonutSegmentInput[] {
	const previous = new Map(
		( comparison?.data ?? [] ).map( item => [ deviceKey( item ), item.active_sessions ] )
	);
	const segments: DonutSegmentInput[] = ( primary?.data ?? [] ).map( item => ( {
		label: getDeviceLabel( item.device_type ),
		value: item.active_sessions,
		previousValue: comparison ? ( previous.get( deviceKey( item ) ) ?? 0 ) : undefined,
	} ) );

	const seen = new Set( ( primary?.data ?? [] ).map( deviceKey ) );
	for ( const item of comparison?.data ?? [] ) {
		if ( seen.has( deviceKey( item ) ) ) {
			continue;
		}
		seen.add( deviceKey( item ) );
		segments.push( {
			label: getDeviceLabel( item.device_type ),
			value: 0,
			previousValue: item.active_sessions,
		} );
	}

	return segments;
}
