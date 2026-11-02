/**
 * Internal dependencies
 */
import { sanitizeReportConversionRateResponse } from '../conversion-rate';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	toBucketStamp: ( raw: string ) => raw,
} ) );

const row = ( active_sessions: string | null, completed_checkout: string | null ) =>
	( {
		date_start: '2026-01-01T00:00:00+00:00',
		date_end: '2026-01-01T23:59:59+00:00',
		active_sessions,
		visitors: active_sessions,
		with_cart_addition: '0',
		reached_checkout: completed_checkout,
		completed_checkout,
	} ) as never;

describe( 'sanitizeReportConversionRateResponse', () => {
	it( 'has no rate for a period without sessions, in the summary and in each row', () => {
		const response = sanitizeReportConversionRateResponse(
			{
				summary: row( '0', '0' ),
				data: [ row( '0', '0' ), row( null, null ), row( '3', '0' ), row( '4', '1' ) ],
			},
			'UTC'
		);

		expect( response.summary.conversion_rate ).toBeNull();
		expect( response.data.map( item => item.conversion_rate ) ).toEqual( [ null, null, 0, 0.25 ] );
	} );
} );
