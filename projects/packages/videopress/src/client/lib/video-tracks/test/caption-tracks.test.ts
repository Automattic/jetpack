jest.mock( '@wordpress/api-fetch', () => jest.fn() );

import apiFetch from '@wordpress/api-fetch';
import {
	CAPTION_TRACK_META,
	deleteCaptionTrack,
	fetchCaptionTracks,
	getSourceTrackMeta,
	saveCaptionTrack,
} from '../caption-tracks';
import type { CaptionTrack } from '../caption-tracks';

const apiFetchMock = apiFetch as unknown as jest.Mock;

const baseTrack: CaptionTrack = {
	title: 'English captions',
	content: '<!-- wp:videopress/caption-cue /-->',
	status: 'draft',
	meta: {
		[ CAPTION_TRACK_META.guid ]: 'abc123',
		[ CAPTION_TRACK_META.kind ]: 'captions',
		[ CAPTION_TRACK_META.srcLang ]: 'en',
		[ CAPTION_TRACK_META.label ]: 'English',
	},
};

describe( 'caption-tracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'fetchCaptionTracks', () => {
		it( 'requests the caption tracks for a GUID', async () => {
			const tracks = [ { ...baseTrack, id: 7, status: 'publish' } ];
			apiFetchMock.mockResolvedValue( tracks );

			await expect( fetchCaptionTracks( 'abc123' ) ).resolves.toEqual( tracks );

			expect( apiFetchMock ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/videopress/caption-tracks?guid=abc123',
			} );
		} );

		it( 'encodes the GUID into the query string', async () => {
			apiFetchMock.mockResolvedValue( [] );

			await fetchCaptionTracks( 'a b&c' );

			expect( apiFetchMock ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/videopress/caption-tracks?guid=a%20b%26c',
			} );
		} );
	} );

	describe( 'saveCaptionTrack', () => {
		it( 'creates a new track with POST when it has no ID', async () => {
			apiFetchMock.mockResolvedValue( { ...baseTrack, id: 7 } );

			await expect( saveCaptionTrack( baseTrack ) ).resolves.toMatchObject( { id: 7 } );

			expect( apiFetchMock ).toHaveBeenCalledWith( {
				method: 'POST',
				path: '/wpcom/v2/videopress/caption-tracks',
				data: baseTrack,
			} );
		} );

		it( 'updates an existing track with PUT to its ID route', async () => {
			const track = { ...baseTrack, id: 7, status: 'publish' as const };
			apiFetchMock.mockResolvedValue( track );

			await expect( saveCaptionTrack( track ) ).resolves.toEqual( track );

			expect( apiFetchMock ).toHaveBeenCalledWith( {
				method: 'PUT',
				path: '/wpcom/v2/videopress/caption-tracks/7',
				data: track,
			} );
		} );
	} );

	describe( 'deleteCaptionTrack', () => {
		it( 'deletes a track by ID', async () => {
			apiFetchMock.mockResolvedValue( { deleted: true, id: 7 } );

			await expect( deleteCaptionTrack( 7 ) ).resolves.toEqual( { deleted: true, id: 7 } );

			expect( apiFetchMock ).toHaveBeenCalledWith( {
				method: 'DELETE',
				path: '/wpcom/v2/videopress/caption-tracks/7',
			} );
		} );
	} );

	describe( 'getSourceTrackMeta', () => {
		it( 'maps a source track to its meta fields', () => {
			expect(
				getSourceTrackMeta( {
					kind: 'subtitles',
					srcLang: 'auto_en',
					label: 'English (auto-generated)',
					src: 'auto_en.vtt',
				} )
			).toEqual( {
				[ CAPTION_TRACK_META.sourceTrackKind ]: 'subtitles',
				[ CAPTION_TRACK_META.sourceTrackSrcLang ]: 'auto_en',
				[ CAPTION_TRACK_META.sourceTrackSrc ]: 'auto_en.vtt',
			} );
		} );

		it( 'returns no meta when there is no source track', () => {
			expect( getSourceTrackMeta( null ) ).toEqual( {} );
		} );
	} );
} );
