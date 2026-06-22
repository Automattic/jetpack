import {
	sanitizeStatsArchivesResponse,
	sanitizeStatsCommentFollowersResponse,
	sanitizeStatsCommentsResponse,
	sanitizeStatsDevicesResponse,
	sanitizeStatsFollowersResponse,
	sanitizeStatsGenericListResponse,
	sanitizeStatsPublicizeResponse,
	sanitizeStatsTagsResponse,
} from '..';
import {
	archivesFixture,
	commentFollowersFixture,
	commentsFixture,
	devicesFixture,
	devicesTopValuesFixture,
	followersFixture,
	genericListFixture,
	publicizeFixture,
	tagsFixture,
} from '../__fixtures__/secondary';

describe( 'Stats secondary normalizers', () => {
	it( 'keeps parsed device values when the raw payload value is a string', () => {
		expect( sanitizeStatsDevicesResponse( devicesFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Desktop',
				value: 42,
			} )
		);
	} );

	it( 'keeps devices top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesTopValuesFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'mobile',
				label: 'mobile',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'desktop',
				label: 'desktop',
				value: 4,
			} ),
		] );
	} );

	it( 'keeps parsed generic list values when the raw payload has a value field', () => {
		expect(
			sanitizeStatsGenericListResponse( genericListFixture, 'views', 'name' ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: 'Example tag',
				value: 18,
			} )
		);
	} );

	it( 'normalizes publicize service rows', () => {
		expect( sanitizeStatsPublicizeResponse( publicizeFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'mastodon',
				value: 12,
			} )
		);
	} );

	it( 'normalizes followers subscriber rows', () => {
		const result = sanitizeStatsFollowersResponse( followersFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total: 125,
				total_email: 5,
				total_wpcom: 120,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 111,
				label: 'reader@example.com',
				value: 0,
				date_subscribed: '2026-06-16T18:53:05+00:00',
			} )
		);
	} );

	it( 'normalizes tag rows', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'News',
				value: 18,
				link: 'https://example.com/category/news/',
			} )
		);
	} );

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

	it( 'normalizes archives into sorted grouped rows', () => {
		const result = sanitizeStatsArchivesResponse( archivesFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( expect.objectContaining( { total: 15 } ) );
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'tax',
				value: 8,
			} ),
			expect.objectContaining( {
				label: 'post_type',
				value: 4,
			} ),
			expect.objectContaining( {
				label: 'home',
				value: 3,
				children: null,
			} ),
		] );
	} );
} );
