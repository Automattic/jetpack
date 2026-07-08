import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useYouTubeVideos } from '../use-youtube-videos';

const VIDEOS_PATH = '/jetpack/v4/videopress/import/youtube/videos';

const RAW_VIDEO_A = {
	external_id: 'vid-a',
	title: 'Video A',
	description: 'First video',
	tags: [ 'travel', 'gear' ],
	duration_seconds: 120,
	privacy: 'public',
	published_at: '2026-05-18T14:00:00Z',
	thumbnails: {
		default: 'https://i.ytimg.com/vi/vid-a/default.jpg',
		high: 'https://i.ytimg.com/vi/vid-a/hqdefault.jpg',
		maxres: 'https://i.ytimg.com/vi/vid-a/maxresdefault.jpg',
	},
	already_imported: false,
	attachment_id: null,
};

const RAW_VIDEO_B = {
	external_id: 'vid-b',
	title: 'Video B',
	description: '',
	tags: [],
	duration_seconds: 60,
	privacy: 'unlisted',
	published_at: '2026-04-01T10:00:00Z',
	// maxres missing: the real API omits it for low-resolution sources.
	thumbnails: {
		default: 'https://i.ytimg.com/vi/vid-b/default.jpg',
		high: 'https://i.ytimg.com/vi/vid-b/hqdefault.jpg',
		maxres: null,
	},
	already_imported: true,
	attachment_id: 987,
};

const RAW_VIDEO_C = {
	external_id: 'vid-c',
	title: 'Video C',
	duration_seconds: 30,
	privacy: 'private',
	published_at: '2026-03-01T09:00:00Z',
};

describe( 'useYouTubeVideos', () => {
	it( 'fetches the first page without a page_token and normalizes items', async () => {
		const mock = mockApiFetch( ( { path } ) => {
			expect( path ).toBe( `${ VIDEOS_PATH }?number=20` );
			return { videos: [ RAW_VIDEO_A, RAW_VIDEO_B ], next_page_token: null };
		} );

		const { result } = renderHook( () => useYouTubeVideos(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( mock ).toHaveBeenCalledTimes( 1 );
		expect( result.current.videos ).toEqual( [
			{
				externalId: 'vid-a',
				title: 'Video A',
				description: 'First video',
				tags: [ 'travel', 'gear' ],
				durationSeconds: 120,
				privacy: 'public',
				publishedAt: '2026-05-18T14:00:00Z',
				thumbnailUrl: 'https://i.ytimg.com/vi/vid-a/maxresdefault.jpg',
				alreadyImported: false,
				attachmentId: null,
			},
			{
				externalId: 'vid-b',
				title: 'Video B',
				description: '',
				tags: [],
				durationSeconds: 60,
				privacy: 'unlisted',
				publishedAt: '2026-04-01T10:00:00Z',
				// maxres is null, so the high variant wins.
				thumbnailUrl: 'https://i.ytimg.com/vi/vid-b/hqdefault.jpg',
				alreadyImported: true,
				attachmentId: 987,
			},
		] );
		expect( result.current.hasNextPage ).toBe( false );
	} );

	it( 'passes the requested page size and cursors through pages with page_token', async () => {
		const paths: string[] = [];
		mockApiFetch( ( { path } ) => {
			paths.push( path ?? '' );
			if ( path?.includes( 'page_token=mock-page-2' ) ) {
				return { videos: [ RAW_VIDEO_C ], next_page_token: null };
			}
			return { videos: [ RAW_VIDEO_A, RAW_VIDEO_B ], next_page_token: 'mock-page-2' };
		} );

		const { result } = renderHook( () => useYouTubeVideos( { number: 2 } ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.videos ).toHaveLength( 2 );
		expect( result.current.hasNextPage ).toBe( true );

		await act( async () => {
			await result.current.fetchNextPage();
		} );

		expect( paths ).toEqual( [
			`${ VIDEOS_PATH }?number=2`,
			`${ VIDEOS_PATH }?number=2&page_token=mock-page-2`,
		] );
		// Pages are flattened in order.
		await waitFor( () =>
			expect( result.current.videos.map( v => v.externalId ) ).toEqual( [
				'vid-a',
				'vid-b',
				'vid-c',
			] )
		);
		expect( result.current.hasNextPage ).toBe( false );
	} );

	it( 'tolerates missing optional fields (no thumbnails → null URL)', async () => {
		mockApiFetch( () => ( { videos: [ RAW_VIDEO_C ], next_page_token: null } ) );

		const { result } = renderHook( () => useYouTubeVideos(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.videos[ 0 ] ).toEqual( {
			externalId: 'vid-c',
			title: 'Video C',
			description: '',
			tags: [],
			durationSeconds: 30,
			privacy: 'private',
			publishedAt: '2026-03-01T09:00:00Z',
			thumbnailUrl: null,
			alreadyImported: false,
			attachmentId: null,
		} );
	} );

	it( 'surfaces a fetch failure as isError', async () => {
		mockApiFetch( () => {
			throw new Error( 'listing exploded' );
		} );

		const { result } = renderHook( () => useYouTubeVideos(), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.videos ).toEqual( [] );
		expect( ( result.current.error as Error ).message ).toBe( 'listing exploded' );
	} );

	it( 'does not fetch when enabled is false', async () => {
		const mock = mockApiFetch( () => ( { videos: [], next_page_token: null } ) );

		renderHook( () => useYouTubeVideos( { enabled: false } ), { wrapper: createTestWrapper() } );

		// Give a fetch every chance to run before asserting it never did.
		await act( async () => {
			await Promise.resolve();
		} );
		expect( mock ).not.toHaveBeenCalled();
	} );
} );
