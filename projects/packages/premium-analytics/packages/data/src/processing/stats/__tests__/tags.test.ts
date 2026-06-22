import { sanitizeStatsTagsResponse } from '..';
import { tagsFixture } from '../__fixtures__/tags';

describe( 'Stats tags normalizer', () => {
	it( 'normalizes tag rows', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'News',
				views: 18,
				link: 'https://example.com/category/news/',
			} )
		);
	} );
} );
