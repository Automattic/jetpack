import { sanitizeStatsLatestPostResponse } from '..';
import { latestPostEmptyFixture, latestPostFixture } from '../__fixtures__/latest-post';

describe( 'Stats latest post normalizer', () => {
	it( 'reduces a posts-list payload to the first post headline fields', () => {
		expect( sanitizeStatsLatestPostResponse( latestPostFixture ) ).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/2026/06/22/hello-world/',
			date: '2026-06-22T10:00:00+00:00',
			likeCount: 24,
			commentCount: 8,
		} );
	} );

	it( 'coerces stringified numeric values defensively', () => {
		expect(
			sanitizeStatsLatestPostResponse( {
				posts: [
					{
						ID: '779',
						title: 'Hello world',
						URL: 'https://example.com/hello-world/',
						date: '2026-06-22T10:00:00+00:00',
						like_count: '24',
						discussion: { comment_count: '8' },
					},
				],
			} )
		).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/hello-world/',
			date: '2026-06-22T10:00:00+00:00',
			likeCount: 24,
			commentCount: 8,
		} );
	} );

	it( 'defaults missing counts and strings without dropping the post', () => {
		expect( sanitizeStatsLatestPostResponse( { posts: [ { ID: 1 } ] } ) ).toEqual( {
			id: 1,
			title: '',
			url: '',
			date: '',
			likeCount: 0,
			commentCount: 0,
		} );
	} );

	it( 'returns null when there is no post', () => {
		expect( sanitizeStatsLatestPostResponse( latestPostEmptyFixture ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( { posts: [] } ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( null ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( [] ) ).toBeNull();
	} );
} );
