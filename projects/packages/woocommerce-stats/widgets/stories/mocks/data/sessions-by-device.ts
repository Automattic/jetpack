/**
 * Internal dependencies
 */
import { ANCHOR_DAY, bucketsForWindow, windowDays } from './interval-buckets';

/** How far the report's own session count sits above the sum of its device rows. */
const SUMMARY_UPLIFT_SHARE = 0.07;

const DEVICES = [
	{ device_type: 'Mobile', share: 0.54, phase: 0 },
	{ device_type: 'Desktop', share: 0.33, phase: 1.1 },
	{ device_type: 'Tablet', share: 0.09, phase: 2.2 },
	// The live report sends a row with no device for sessions it could not classify.
	{ device_type: null, share: 0.04, phase: 3.3 },
];

const sessionsPerDay = ( dayIndex: number ) =>
	Math.max( 1, 920 + 0.9 * ( dayIndex - ANCHOR_DAY ) + 180 * Math.sin( dayIndex / 8 ) );

/**
 * The sessions-by-device report of a window: one row per device category, plus one for the
 * sessions the report could not attribute. Where there are sessions at all, the report's own count
 * reads above the rows' sum, as the live report's can.
 *
 * @param {URLSearchParams} query - The request's query params (`from`, `to`).
 * @return {unknown} The raw report response.
 */
export function buildSessionsByDeviceResponse( query: URLSearchParams ): unknown {
	const buckets = bucketsForWindow( query );
	const dayIndex = buckets[ 0 ]?.dayIndex ?? 0;
	const sessions = sessionsPerDay( dayIndex ) * windowDays( buckets );

	const rows = DEVICES.map( device => ( {
		device_type: device.device_type,
		active_sessions: String(
			Math.round( sessions * device.share * ( 1 + 0.1 * Math.sin( dayIndex / 11 + device.phase ) ) )
		),
	} ) );
	const rowTotal = rows.reduce( ( total, row ) => total + Number( row.active_sessions ), 0 );

	return {
		summary: {
			// Rounded up, so the uplift survives a row sum of 1, and additive, so a row sum of 0 stays 0.
			active_sessions: String( rowTotal + Math.ceil( rowTotal * SUMMARY_UPLIFT_SHARE ) ),
			total_orders: String( Math.round( rowTotal * 0.021 ) ),
			date_start: buckets[ 0 ]?.date_start ?? '',
			date_end: buckets[ buckets.length - 1 ]?.date_end ?? '',
		},
		data: rows,
	};
}
