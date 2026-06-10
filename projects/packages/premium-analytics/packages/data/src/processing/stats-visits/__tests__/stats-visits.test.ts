/**
 * Internal dependencies
 */
import { sanitizeReportStatsVisitsResponse } from '../index';
import type { StatsVisitsResponse } from '../../../api/report-stats-visits-fetch';

describe( 'sanitizeReportStatsVisitsResponse', () => {
	it( 'zips fields and rows into typed period items with numeric metrics', () => {
		const response: StatsVisitsResponse = {
			date: '2026-06-10',
			unit: 'day',
			fields: [ 'period', 'views', 'visitors' ],
			data: [
				[ '2026-06-09', '10', '4' ],
				[ '2026-06-10', 25, 9 ],
			],
		};

		const { data, summary } = sanitizeReportStatsVisitsResponse( response );

		expect( data ).toEqual( [
			{ period: '2026-06-09', date_start: '2026-06-09', views: 10, visitors: 4 },
			{ period: '2026-06-10', date_start: '2026-06-10', views: 25, visitors: 9 },
		] );
		expect( summary ).toEqual( { date_start: '2026-06-09', date_end: '2026-06-10' } );
	} );

	it( 'normalizes week periods by dropping the W separator', () => {
		const response: StatsVisitsResponse = {
			date: '2026-06-10',
			unit: 'week',
			fields: [ 'period', 'views' ],
			data: [ [ '2026W24', 100 ] ],
		};

		const { data } = sanitizeReportStatsVisitsResponse( response );

		expect( data[ 0 ] ).toEqual( { period: '2026-24', date_start: '2026-24', views: 100 } );
	} );

	it( 'coerces missing metric values to zero', () => {
		const response: StatsVisitsResponse = {
			date: '2026-06-10',
			unit: 'day',
			fields: [ 'period', 'views' ],
			data: [ [ '2026-06-10', null ] ],
		};

		const { data } = sanitizeReportStatsVisitsResponse( response );

		expect( data[ 0 ].views ).toBe( 0 );
	} );

	it( 'returns an empty result for an empty response', () => {
		const { data, summary } = sanitizeReportStatsVisitsResponse( {
			date: '',
			unit: 'day',
			fields: [],
			data: [],
		} );

		expect( data ).toEqual( [] );
		expect( summary ).toEqual( { date_start: '', date_end: '' } );
	} );
} );
