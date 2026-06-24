import { sanitizeStatsCommentFollowersResponse } from '..';
import { commentFollowersFixture } from '../__fixtures__/comment-followers';

describe( 'Stats comment followers normalizer', () => {
	it( 'normalizes comment follower post rows', () => {
		const result = sanitizeStatsCommentFollowersResponse( commentFollowersFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { total: 2 } ) );
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'All Posts',
				value: 20,
			} ),
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				value: 10,
				labelIcon: 'external',
			} ),
		] );
	} );
} );
