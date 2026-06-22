import { sanitizeStatsArchivesResponse } from '..';
import { archivesFixture } from '../__fixtures__/archives';

describe( 'Stats archives normalizer', () => {
	it( 'normalizes archives into sorted grouped rows', () => {
		const result = sanitizeStatsArchivesResponse( archivesFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( expect.objectContaining( { views: 15 } ) );
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'tax',
				views: 8,
			} ),
			expect.objectContaining( {
				label: 'post_type',
				views: 4,
			} ),
			expect.objectContaining( {
				label: 'home',
				views: 3,
				children: null,
			} ),
		] );
	} );
} );
