/**
 * Internal dependencies
 */
import { sanitizeReportSessionsByDeviceResponse } from '../sessions-by-device';

const response = ( summarySessions: string | null ) =>
	( {
		summary: { active_sessions: summarySessions },
		data: [
			{ device_type: 'desktop', active_sessions: '40' },
			{ device_type: '', active_sessions: '3' },
		],
	} ) as never;

describe( 'sanitizeReportSessionsByDeviceResponse', () => {
	it( 'keeps a row with no device and totals the sessions the report states', () => {
		const sanitized = sanitizeReportSessionsByDeviceResponse( response( '42' ) );

		expect( sanitized.data.map( row => row.device_type ) ).toEqual( [ 'desktop', '' ] );
		expect( sanitized.summary.total_sessions ).toBe( 42 );
	} );

	it( 'sums the rows when the report states no total', () => {
		expect(
			sanitizeReportSessionsByDeviceResponse( response( null ) ).summary.total_sessions
		).toBe( 43 );
	} );
} );
