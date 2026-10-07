/**
 * Internal dependencies
 */
import { StatsResponseShapeError } from '../../../utils/api-error';
import { sanitizeStatsHourOfDayResponse } from '../hour-of-day';

function response( overrides: Record< string, unknown > = {} ) {
	return {
		date: '2026-08-12',
		start_date: '2026-07-14',
		days: 30,
		dimension: 'hour-of-day',
		utc_offset: '+09:00',
		fields: [ 'period', 'views' ],
		data: Array.from( { length: 24 }, ( _, hour ) => [
			String( hour ).padStart( 2, '0' ),
			hour * 10,
		] ),
		...overrides,
	};
}

describe( 'sanitizeStatsHourOfDayResponse', () => {
	it( 'returns 24 buckets in hour order with the echoed range', () => {
		const report = sanitizeStatsHourOfDayResponse( response() );

		expect( report.days ).toBe( 30 );
		expect( report.buckets ).toHaveLength( 24 );
		expect( report.buckets[ 0 ] ).toEqual( { hour: 0, views: 0 } );
		expect( report.buckets[ 23 ] ).toEqual( { hour: 23, views: 230 } );
		expect( report ).toMatchObject( {
			startDate: '2026-07-14',
			date: '2026-08-12',
		} );
	} );

	it( 'zero-fills hours the payload omits, so the chart keeps a fixed shape', () => {
		const report = sanitizeStatsHourOfDayResponse(
			response( {
				data: [
					[ '07', 40 ],
					[ '19', 90 ],
				],
			} )
		);

		expect( report.buckets ).toHaveLength( 24 );
		expect( report.buckets[ 7 ].views ).toBe( 40 );
		expect( report.buckets[ 19 ].views ).toBe( 90 );
		expect( report.buckets[ 12 ].views ).toBe( 0 );
	} );

	it( 'reads views by field name, not by column index', () => {
		const report = sanitizeStatsHourOfDayResponse(
			response( {
				fields: [ 'period', 'visitors', 'views' ],
				data: [ [ '07', 5, 40 ] ],
			} )
		);

		expect( report.buckets[ 7 ].views ).toBe( 40 );
	} );

	it( 'coerces non-numeric views to zero instead of NaN', () => {
		const report = sanitizeStatsHourOfDayResponse(
			response( {
				data: [
					[ '07', null ],
					[ '08', 'x' ],
				],
			} )
		);

		expect( report.buckets[ 7 ].views ).toBe( 0 );
		expect( report.buckets[ 8 ].views ).toBe( 0 );
	} );

	it( 'ignores period labels that are not an hour from 00 to 23', () => {
		const report = sanitizeStatsHourOfDayResponse(
			response( {
				data: [
					[ '24', 99 ],
					[ '-1', 99 ],
					[ 'noon', 99 ],
					// `Number('')` and `Number(null)` are both 0, so these would land in hour 0.
					[ '', 99 ],
					[ null, 99 ],
				],
			} )
		);

		expect( report.buckets.every( bucket => bucket.views === 0 ) ).toBe( true );
	} );

	// A StatsResponseShapeError tells callers to skip auto-retrying the request.
	it.each( [
		[
			'the payload folds views into another dimension',
			response( { dimension: 'day-of-week', data: [ [ 'Mon', 100 ] ] } ),
			/hour-of-day/,
		],
		[
			'required fields are missing',
			response( { fields: [ 'period', 'postviews' ] } ),
			/Expected fields \[period, views\]/,
		],
		[
			'the day count is missing, since the averages divide by it',
			response( { days: undefined } ),
			/positive day count/,
		],
		[
			'data is not an array',
			response( { data: {} } ),
			/Expected hour-of-day data to be an array/,
		],
		[ 'the payload is not an object at all', null, /hour-of-day/ ],
	] )( 'throws a StatsResponseShapeError when %s', ( _case, payload, message ) => {
		expect( () => sanitizeStatsHourOfDayResponse( payload ) ).toThrow( StatsResponseShapeError );
		expect( () => sanitizeStatsHourOfDayResponse( payload ) ).toThrow( message );
	} );

	describe( 'the queried range', () => {
		it( 'prefers the range the endpoint echoes back over what was requested', () => {
			const report = sanitizeStatsHourOfDayResponse(
				response( { start_date: '2026-07-14', date: '2026-08-12' } ),
				{ start_date: '2026-01-01', date: '2026-01-31' }
			);

			expect( report.startDate ).toBe( '2026-07-14' );
			expect( report.date ).toBe( '2026-08-12' );
		} );

		it( 'falls back to the requested range when the response omits it', () => {
			const report = sanitizeStatsHourOfDayResponse(
				response( { start_date: undefined, date: undefined } ),
				{ start_date: '2026-01-01', date: '2026-01-31' }
			);

			expect( report.startDate ).toBe( '2026-01-01' );
			expect( report.date ).toBe( '2026-01-31' );
		} );

		it( 'falls back to the requested range when the response echoes empty values', () => {
			const report = sanitizeStatsHourOfDayResponse( response( { start_date: '', date: '' } ), {
				start_date: '2026-01-01',
				date: '2026-01-31',
			} );

			expect( report.startDate ).toBe( '2026-01-01' );
			expect( report.date ).toBe( '2026-01-31' );
		} );

		it( 'normalizes a datetime-shaped echo to its date part instead of leaving it unparsable', () => {
			const report = sanitizeStatsHourOfDayResponse(
				response( {
					start_date: '2026-07-14T00:00:00+00:00',
					date: '2026-08-12T23:59:59+00:00',
				} )
			);

			expect( report.startDate ).toBe( '2026-07-14' );
			expect( report.date ).toBe( '2026-08-12' );
		} );

		it( 'has no range when both the response and the request omit it', () => {
			const report = sanitizeStatsHourOfDayResponse(
				response( { start_date: undefined, date: undefined } )
			);

			expect( report.startDate ).toBeUndefined();
			expect( report.date ).toBeUndefined();
		} );
	} );
} );
