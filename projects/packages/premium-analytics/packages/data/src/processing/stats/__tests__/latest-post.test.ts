import { sanitizeStatsLatestPostResponse } from '..';
import { latestPostEmptyFixture, latestPostFixture } from '../__fixtures__/latest-post';

describe( 'Stats latest post normalizer', () => {
	it( 'reduces a core posts payload to the first post headline fields and featured image', () => {
		expect( sanitizeStatsLatestPostResponse( latestPostFixture ) ).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/2026/06/22/hello-world/',
			date: '2026-06-22T10:00:00',
			imageUrl: 'https://example.com/wp-content/uploads/hello-world-medium.jpg',
			imageAlt: 'A cheerful greeting',
		} );
	} );

	it( 'coerces a stringified id and falls back to the full-size image', () => {
		expect(
			sanitizeStatsLatestPostResponse( [
				{
					id: '779',
					title: { rendered: 'Hello world' },
					link: 'https://example.com/hello-world/',
					date: '2026-06-22T10:00:00',
					_embedded: {
						'wp:featuredmedia': [ { source_url: 'https://example.com/full.jpg', alt_text: 'Alt' } ],
					},
				},
			] )
		).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/hello-world/',
			date: '2026-06-22T10:00:00',
			imageUrl: 'https://example.com/full.jpg',
			imageAlt: 'Alt',
		} );
	} );

	it( 'defaults missing strings and image without dropping the post', () => {
		expect( sanitizeStatsLatestPostResponse( [ { id: 1 } ] ) ).toEqual( {
			id: 1,
			title: '',
			url: '',
			date: '',
			imageUrl: '',
			imageAlt: '',
		} );
	} );

	it( 'returns null when there is no post', () => {
		expect( sanitizeStatsLatestPostResponse( latestPostEmptyFixture ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( [] ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( [ { id: 0 } ] ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( null ) ).toBeNull();
		expect( sanitizeStatsLatestPostResponse( {} ) ).toBeNull();
	} );
} );
