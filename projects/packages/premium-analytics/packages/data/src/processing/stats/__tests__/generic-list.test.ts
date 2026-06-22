import { sanitizeStatsGenericListResponse } from '..';
import { genericListFixture } from '../__fixtures__/generic-list';

describe( 'Stats generic list normalizer', () => {
	it( 'keeps parsed generic list metrics when the raw payload has a value field', () => {
		expect(
			sanitizeStatsGenericListResponse( genericListFixture, 'views', 'name' ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: 'Example tag',
				views: 18,
			} )
		);
	} );
} );
