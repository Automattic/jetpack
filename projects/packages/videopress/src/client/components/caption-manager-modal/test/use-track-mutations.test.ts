import analytics from '@automattic/jetpack-analytics';
import { act, renderHook } from '@testing-library/react';
import { deleteTrackForGuid, uploadTrackForGuid } from '../../../lib/video-tracks';
import { CAPTION_TRACK_META, saveCaptionTrack } from '../../../lib/video-tracks/caption-tracks';
import { useTrackMutations } from '../use-track-mutations';
import type { CaptionTrack } from '../../../lib/video-tracks/caption-tracks';
import type { UploadTrackDataProps, VideoTextTrack } from '../../../lib/video-tracks/types';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '../../../lib/video-tracks', () => ( {
	...jest.requireActual( '../../../lib/video-tracks' ),
	uploadTrackForGuid: jest.fn(),
	deleteTrackForGuid: jest.fn(),
} ) );
jest.mock( '../../../lib/video-tracks/caption-tracks', () => ( {
	...jest.requireActual( '../../../lib/video-tracks/caption-tracks' ),
	saveCaptionTrack: jest.fn(),
} ) );

const recordEvent = analytics.tracks.recordEvent as jest.Mock;
const uploadTrack = uploadTrackForGuid as jest.Mock;
const saveDraft = saveCaptionTrack as jest.Mock;
const upload: UploadTrackDataProps = {
	kind: 'subtitles',
	srcLang: 'en',
	label: 'Private label',
	tmpFile: new File( [ 'Private caption content' ], 'private-filename.vtt' ),
};
const draft: CaptionTrack = {
	title: 'Private title',
	content: 'Private caption content',
	status: 'draft',
	meta: {
		[ CAPTION_TRACK_META.guid ]: 'private-guid',
		[ CAPTION_TRACK_META.kind ]: 'subtitles',
		[ CAPTION_TRACK_META.srcLang ]: 'en',
		[ CAPTION_TRACK_META.label ]: 'Private label',
	},
};

const renderMutations = (
	overrides: Partial< Parameters< typeof useTrackMutations >[ 0 ] > = {}
) =>
	renderHook( () =>
		useTrackMutations( {
			guid: 'private-guid',
			managedTracks: [],
			setManagedTracks: jest.fn(),
			setCaptionTracks: jest.fn(),
			onTracksChange: jest.fn(),
			notify: jest.fn(),
			...overrides,
		} )
	);

describe( 'caption save metrics', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		uploadTrack.mockResolvedValue( 'uploaded.vtt' );
		( deleteTrackForGuid as jest.Mock ).mockResolvedValue( true );
		saveDraft.mockImplementation( async payload => ( { ...payload, id: 123 } ) );
	} );

	it( 'distinguishes an editable draft from a published track without counting the editable copy twice', async () => {
		const { result, rerender } = renderMutations();
		await act( async () => {
			await result.current.saveCaptionTrackRecord( draft );
			await result.current.publishManualTrack( {
				trackToUpload: upload,
				trackToUpdate: null,
				captionTrackPayload: { ...draft, status: 'publish' },
			} );
		} );
		rerender();
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_videopress_captions_saved', { track_count: 1, is_auto: false, action: 'draft' } ],
			[
				'jetpack_videopress_captions_saved',
				{ track_count: 1, is_auto: false, action: 'publish' },
			],
		] );
	} );

	it.each( [ 'subtitles', 'captions' ] as const )(
		'counts an acknowledged %s file upload once',
		async kind => {
			const { result } = renderMutations();
			await act( async () => {
				await result.current.uploadSubtitleFile( {
					trackToUpload: { ...upload, kind },
					trackToUpdate: null,
				} );
			} );
			expect( recordEvent.mock.calls ).toEqual( [
				[
					'jetpack_videopress_captions_saved',
					{ track_count: 1, is_auto: false, action: 'file_upload' },
				],
			] );
		}
	);

	it.each( [
		undefined,
		null,
		{},
		true,
		'',
		'  ',
		{ error: 'upload_failed' },
		new Error( 'offline' ),
	] )(
		'does not treat a fallback track or failed response as a persisted upload: %p',
		async response => {
			uploadTrack.mockImplementationOnce( async () => {
				if ( response instanceof Error ) {
					throw response;
				}
				return response;
			} );
			const { result } = renderMutations();
			await act( async () => {
				await result.current.uploadSubtitleFile( { trackToUpload: upload, trackToUpdate: null } );
			} );
			expect( recordEvent ).not.toHaveBeenCalled();
		}
	);

	it.each( [ 'chapters', 'metadata' ] as const )( 'excludes the %s track kind', async kind => {
		const { result } = renderMutations();
		await act( async () => {
			await result.current.uploadSubtitleFile( {
				trackToUpload: { ...upload, kind },
				trackToUpdate: null,
			} );
			await result.current.saveCaptionTrackRecord( {
				...draft,
				meta: { ...draft.meta, [ CAPTION_TRACK_META.kind ]: kind },
			} );
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [ { id: 0 }, { id: 1.5 }, { status: 'publish' }, { meta: {} } ] )(
		'requires an acknowledged draft record: %p',
		async response => {
			saveDraft.mockResolvedValueOnce( { ...draft, id: 123, ...response } );
			const { result } = renderMutations();
			await act( async () => {
				await result.current.saveCaptionTrackRecord( draft );
			} );
			expect( recordEvent ).not.toHaveBeenCalled();
		}
	);

	it( 'does not count a rejected draft save', async () => {
		saveDraft.mockRejectedValueOnce( new Error( 'save failed' ) );
		const { result } = renderMutations();
		await act( async () => {
			await result.current.saveCaptionTrackRecord( draft );
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [ 'cleanup', 'editable copy', 'host callback' ] )(
		'counts a published track even when %s fails afterward',
		async failure => {
			const oldTrack: VideoTextTrack = {
				kind: 'subtitles',
				srcLang: 'fr',
				label: 'French',
				src: 'previous.vtt',
				source: 'manual',
			};
			if ( failure === 'cleanup' ) {
				( deleteTrackForGuid as jest.Mock ).mockRejectedValueOnce( new Error( 'cleanup failed' ) );
			}
			if ( failure === 'editable copy' ) {
				saveDraft.mockRejectedValueOnce( new Error( 'save failed' ) );
			}
			const { result } = renderMutations( {
				managedTracks: [ oldTrack ],
				onTracksChange: () => {
					if ( failure === 'host callback' ) {
						throw new Error( 'host callback failed' );
					}
				},
			} );
			await act( async () => {
				await result.current.publishManualTrack( {
					trackToUpload: upload,
					trackToUpdate: oldTrack,
					captionTrackPayload: { ...draft, status: 'publish' },
				} );
			} );
			expect( recordEvent.mock.calls ).toEqual( [
				[
					'jetpack_videopress_captions_saved',
					{ track_count: 1, is_auto: false, action: 'publish' },
				],
			] );
		}
	);

	it( 'waits for acknowledgment and still counts the upload after unmount', async () => {
		let resolveUpload: ( value: string ) => void;
		uploadTrack.mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveUpload = resolve;
				} )
		);
		const { result, unmount } = renderMutations();
		let pending: ReturnType< typeof result.current.uploadSubtitleFile >;
		await act( async () => {
			pending = result.current.uploadSubtitleFile( { trackToUpload: upload, trackToUpdate: null } );
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
		unmount();
		await act( async () => {
			resolveUpload( 'uploaded.vtt' );
			await pending;
		} );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );
} );
