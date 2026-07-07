import { sanitizeLatestPostResponse } from '..';
import { latestPostEmptyFixture, latestPostFixture } from '../__fixtures__/latest-post';

describe( 'Latest post normalizer', () => {
	it( 'reduces a core posts payload to the first post headline fields and featured image', () => {
		expect( sanitizeLatestPostResponse( latestPostFixture ) ).toEqual( {
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
			sanitizeLatestPostResponse( [
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

	it( 'decodes HTML entities in the title', () => {
		const result = sanitizeLatestPostResponse( [
			{
				id: 5,
				title: { rendered: 'Tips &amp; tricks for &#8220;fast&#8221; sites' },
				link: 'https://example.com/tips/',
				date: '2026-06-22T10:00:00',
			},
		] );

		expect( result?.title ).toBe( 'Tips & tricks for “fast” sites' );
	} );

	it( 'defaults missing strings and image without dropping the post', () => {
		expect( sanitizeLatestPostResponse( [ { id: 1 } ] ) ).toEqual( {
			id: 1,
			title: '',
			url: '',
			date: '',
			imageUrl: '',
			imageAlt: '',
		} );
	} );

	it( 'returns null when there is no post', () => {
		expect( sanitizeLatestPostResponse( latestPostEmptyFixture ) ).toBeNull();
		expect( sanitizeLatestPostResponse( [] ) ).toBeNull();
		expect( sanitizeLatestPostResponse( [ { id: 0 } ] ) ).toBeNull();
		expect( sanitizeLatestPostResponse( null ) ).toBeNull();
		expect( sanitizeLatestPostResponse( {} ) ).toBeNull();
	} );
} );
