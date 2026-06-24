import { sanitizeStatsCommentsResponse } from '..';
import { commentsFixture } from '../__fixtures__/comments';

describe( 'Stats comments normalizer', () => {
	it( 'normalizes comments into author and post groups', () => {
		const result = sanitizeStatsCommentsResponse( commentsFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_comments: 22,
				most_active_day: 'Monday',
				most_active_time: '17:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'authors',
				value: 12,
			} ),
			expect.objectContaining( {
				label: 'posts',
				value: 10,
			} ),
		] );
	} );
} );
