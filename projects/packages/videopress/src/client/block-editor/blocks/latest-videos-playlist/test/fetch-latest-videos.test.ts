import apiFetch from '@wordpress/api-fetch';
import {
	clampVideoCount,
	DEFAULT_VIDEO_COUNT,
	entriesFromMediaItems,
	fetchLatestVideos,
	MAX_VIDEO_COUNT,
} from '../fetch-latest-videos';

let mockIsSimpleSite = false;
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockIsSimpleSite,
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;

/**
 * Decode the query string of the path apiFetch was last called with.
 *
 * @return Query parameters.
 */
function lastRequestQuery(): Record< string, string > {
	const { path } = apiFetchMock.mock.calls[ 0 ][ 0 ];
	return Object.fromEntries( new URLSearchParams( path.split( '?' )[ 1 ] ) );
}

beforeEach( () => {
	jest.clearAllMocks();
	mockIsSimpleSite = false;
	apiFetchMock.mockResolvedValue( [] );
} );

describe( 'clampVideoCount', () => {
	it( 'keeps values within the supported range and falls back to the default', () => {
		expect( clampVideoCount( 3 ) ).toBe( 3 );
		expect( clampVideoCount( 0 ) ).toBe( 1 );
		expect( clampVideoCount( 999 ) ).toBe( MAX_VIDEO_COUNT );
		expect( clampVideoCount( 2.6 ) ).toBe( 3 );
		expect( clampVideoCount( undefined ) ).toBe( DEFAULT_VIDEO_COUNT );
		expect( clampVideoCount( 'many' ) ).toBe( DEFAULT_VIDEO_COUNT );
	} );
} );

describe( 'entriesFromMediaItems', () => {
	it( 'maps library items to entries in order, reading the numeric metadata', () => {
		expect(
			entriesFromMediaItems( [
				{
					id: 10,
					jetpack_videopress_guid: 'aaaaaaaa',
					media_details: { height: 1080, videopress: { duration: '724000' } },
				},
				{
					id: 9,
					jetpack_videopress_guid: 'bbbbbbbb',
					media_details: { videopress: { height: 2160 } },
				},
			] )
		).toEqual( [
			{ guid: 'aaaaaaaa', durationMs: 724000, height: 1080 },
			{ guid: 'bbbbbbbb', height: 2160 },
		] );
	} );

	it( 'skips items without a valid VideoPress GUID', () => {
		expect(
			entriesFromMediaItems( [
				{ id: 1 },
				{ id: 2, jetpack_videopress_guid: '' },
				{ id: 3, jetpack_videopress_guid: 'not a guid' },
				{ id: 4, jetpack_videopress_guid: [ 'aaaaaaaa' ] },
				{ id: 5, jetpack_videopress_guid: 'cccccccc' },
			] )
		).toEqual( [ { guid: 'cccccccc' } ] );
	} );

	it( 'falls back to the GUID in the attachment metadata', () => {
		expect(
			entriesFromMediaItems( [
				{ id: 6, jetpack_videopress_guid: [], media_details: { videopress: { guid: 'dddddddd' } } },
			] )
		).toEqual( [ { guid: 'dddddddd' } ] );
	} );
} );

describe( 'fetchLatestVideos', () => {
	it( 'asks the media library for the newest VideoPress videos', async () => {
		apiFetchMock.mockResolvedValue( [
			{ id: 3, jetpack_videopress_guid: 'aaaaaaaa' },
			{ id: 2, jetpack_videopress_guid: 'bbbbbbbb' },
		] );

		await expect( fetchLatestVideos( 2 ) ).resolves.toEqual( [
			{ guid: 'aaaaaaaa' },
			{ guid: 'bbbbbbbb' },
		] );

		expect( apiFetchMock.mock.calls[ 0 ][ 0 ].path ).toMatch( /^\/wp\/v2\/media\?/ );
		expect( lastRequestQuery() ).toEqual( {
			per_page: '2',
			orderby: 'date',
			order: 'desc',
			videopress_has_guid: '1',
		} );
	} );

	it( 'clamps the requested count', async () => {
		await fetchLatestVideos( 500 );

		expect( lastRequestQuery().per_page ).toBe( String( MAX_VIDEO_COUNT ) );
	} );

	it( 'also narrows to video attachments on WordPress.com Simple', async () => {
		mockIsSimpleSite = true;

		await fetchLatestVideos( 4 );

		expect( lastRequestQuery() ).toEqual( {
			per_page: '4',
			orderby: 'date',
			order: 'desc',
			videopress_has_guid: '1',
			videopress_only_videos: '1',
		} );
	} );

	it( 'treats a non-list response as no videos', async () => {
		apiFetchMock.mockResolvedValue( { code: 'rest_no_route' } );

		await expect( fetchLatestVideos( 3 ) ).resolves.toEqual( [] );
	} );
} );
