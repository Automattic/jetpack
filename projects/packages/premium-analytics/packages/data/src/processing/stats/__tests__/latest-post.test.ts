import { sanitizeStatsLatestPostResponse } from '..';
import { latestPostEmptyFixture, latestPostFixture } from '../__fixtures__/latest-post';

describe( 'Stats latest post normalizer', () => {
	it( 'reduces a core posts payload to the first post headline fields', () => {
		expect( sanitizeStatsLatestPostResponse( latestPostFixture ) ).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/2026/06/22/hello-world/',
			date: '2026-06-22T10:00:00',
		} );
	} );

	it( 'coerces a stringified id defensively', () => {
		expect(
			sanitizeStatsLatestPostResponse( [
				{
					id: '779',
					title: { rendered: 'Hello world' },
					link: 'https://example.com/hello-world/',
					date: '2026-06-22T10:00:00',
				},
			] )
		).toEqual( {
			id: 779,
			title: 'Hello world',
			url: 'https://example.com/hello-world/',
			date: '2026-06-22T10:00:00',
		} );
	} );

	it( 'defaults missing strings without dropping the post', () => {
		expect( sanitizeStatsLatestPostResponse( [ { id: 1 } ] ) ).toEqual( {
			id: 1,
			title: '',
			url: '',
			date: '',
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
