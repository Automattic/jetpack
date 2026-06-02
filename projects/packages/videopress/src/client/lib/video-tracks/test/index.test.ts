jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '../../get-media-token', () => jest.fn() );
jest.mock( 'debug', () => () => jest.fn() );

const getVideoTracksModule = async () => {
	Object.defineProperty( window, 'videoPressEditorState', {
		configurable: true,
		value: { siteType: 'simple' },
	} );

	return import( '..' );
};

const getApiFetchMock = async () => ( await import( '@wordpress/api-fetch' ) ).default as jest.Mock;

describe( 'video-tracks', () => {
	beforeEach( () => {
		jest.resetModules();
		jest.clearAllMocks();
	} );

	it( 'flattens legacy nested track responses', async () => {
		const { flattenVideoTracks } = await getVideoTracksModule();

		expect(
			flattenVideoTracks( {
				captions: {
					en: {
						src: 'english.vtt',
						label: 'English',
					},
				},
			} )
		).toEqual( [
			{
				kind: 'captions',
				label: 'English',
				src: 'english.vtt',
				srcLang: 'en',
			},
		] );
	} );

	it( 'flattens wpcom/v2 track list responses with track ids', async () => {
		const { flattenVideoTracks } = await getVideoTracksModule();

		expect(
			flattenVideoTracks( {
				tracks: [
					{
						track_id: 'track-1',
						kind: 'captions',
						src_lang: 'en-US',
						label: 'English',
						src: 'english.vtt',
					},
				],
			} )
		).toEqual( [
			{
				id: 'track-1',
				kind: 'captions',
				label: 'English',
				src: 'english.vtt',
				srcLang: 'en-US',
			},
		] );
	} );

	it( 'normalizes an uploaded track response with fallback metadata', async () => {
		const { normalizeVideoTextTrackResponse } = await getVideoTracksModule();

		expect(
			normalizeVideoTextTrackResponse(
				{
					data: {
						track_id: 'track-1',
						src: 'uploaded.vtt',
					},
				},
				{
					kind: 'captions',
					srcLang: 'en',
					label: 'English',
				}
			)
		).toEqual( {
			id: 'track-1',
			kind: 'captions',
			label: 'English',
			src: 'uploaded.vtt',
			srcLang: 'en',
		} );
	} );

	it( 'deletes wpcom/v2 tracks by track id', async () => {
		const apiFetch = await getApiFetchMock();
		apiFetch.mockResolvedValue( {
			text: () => Promise.resolve( '{}' ),
		} );
		const { deleteTrackForGuid } = await getVideoTracksModule();

		await deleteTrackForGuid(
			{
				id: 'track-1',
				kind: 'captions',
				srcLang: 'en',
			},
			'abc123'
		);

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				apiNamespace: 'wpcom/v2',
				global: true,
				method: 'DELETE',
				path: '/videopress/videos/abc123/tracks/track-1',
				parse: false,
			} )
		);
	} );

	it( 'updates wpcom/v2 track content by track id', async () => {
		const apiFetch = await getApiFetchMock();
		apiFetch.mockResolvedValue( {
			text: () => Promise.resolve( '{}' ),
		} );
		const { updateTrackContentForGuid } = await getVideoTracksModule();

		await updateTrackContentForGuid(
			{
				id: 'track-1',
				kind: 'captions',
				srcLang: 'en',
				label: 'English',
			},
			'abc123',
			'WEBVTT'
		);

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				apiNamespace: 'wpcom/v2',
				body: 'WEBVTT',
				global: true,
				headers: { 'Content-Type': 'text/vtt' },
				method: 'PUT',
				path: '/videopress/videos/abc123/tracks/track-1/content',
				parse: false,
			} )
		);
	} );
} );
