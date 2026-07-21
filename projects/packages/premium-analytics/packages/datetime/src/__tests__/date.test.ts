/**
 * Internal dependencies
 */
import { formatDatePartWithTime, getDateIntervalDateParts, getDatePart } from '../date';

describe( 'date helpers', () => {
	it( 'extracts date parts from ISO datetimes', () => {
		expect( getDatePart( '2026-06-22T11:59:00+00:00' ) ).toBe( '2026-06-22' );
		expect( getDatePart( '2026-06-22' ) ).toBe( '2026-06-22' );
		expect( getDatePart( undefined ) ).toBeUndefined();
	} );

	it( 'formats date parts with a time and offset', () => {
		expect( formatDatePartWithTime( '2026-06-22', '23:59:59' ) ).toBe(
			'2026-06-22T23:59:59+00:00'
		);
		expect( formatDatePartWithTime( '2026-06-22', '00:00:00', '-05:00' ) ).toBe(
			'2026-06-22T00:00:00-05:00'
		);
	} );

	it( 'returns same-day intervals for day and hour periods', () => {
		expect( getDateIntervalDateParts( '2026-06-22', 'day' ) ).toEqual( {
			startDate: '2026-06-22',
			endDate: '2026-06-22',
		} );
		expect( getDateIntervalDateParts( '2026-06-22', 'hour' ) ).toEqual( {
			startDate: '2026-06-22',
			endDate: '2026-06-22',
		} );
	} );

	it( 'returns inclusive week intervals', () => {
		expect( getDateIntervalDateParts( '2026-06-16', 'week' ) ).toEqual( {
			startDate: '2026-06-16',
			endDate: '2026-06-22',
		} );
	} );

	it( 'returns full month intervals', () => {
		expect( getDateIntervalDateParts( '2026-02', 'month' ) ).toEqual( {
			startDate: '2026-02-01',
			endDate: '2026-02-28',
		} );
	} );

	it( 'returns full year intervals', () => {
		expect( getDateIntervalDateParts( '2026', 'year' ) ).toEqual( {
			startDate: '2026-01-01',
			endDate: '2026-12-31',
		} );
	} );
} );
