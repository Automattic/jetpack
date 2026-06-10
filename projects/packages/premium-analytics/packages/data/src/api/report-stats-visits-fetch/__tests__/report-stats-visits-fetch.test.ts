/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchReportStatsVisits } from '../report-stats-visits-fetch';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'fetchReportStatsVisits', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-10', unit: 'day', fields: [], data: [] } );
		window.jpaConfig = {
			siteId: 123,
			apiRoot: 'https://example.com/wp-json/',
			nonce: 'abc',
		};
	} );

	afterEach( () => {
		delete window.jpaConfig;
	} );

	it( 'composes the stats proxy URL from the boot config site ID', async () => {
		await fetchReportStatsVisits( {
			unit: 'day',
			quantity: 30,
			date: '2026-06-10',
			statFields: [ 'views', 'visitors' ],
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/stats-app/sites/123/stats/visits?unit=day&quantity=30&stat_fields=views%2Cvisitors&date=2026-06-10',
		} );
	} );

	it( 'omits date when not provided', async () => {
		await fetchReportStatsVisits( {
			unit: 'week',
			quantity: 12,
			statFields: [ 'views' ],
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/stats-app/sites/123/stats/visits?unit=week&quantity=12&stat_fields=views',
		} );
	} );

	it( 'throws a clear error when the boot config is missing', async () => {
		delete window.jpaConfig;

		await expect(
			fetchReportStatsVisits( { unit: 'day', quantity: 30, statFields: [ 'views' ] } )
		).rejects.toThrow( 'window.jpaConfig is not available' );
	} );
} );
