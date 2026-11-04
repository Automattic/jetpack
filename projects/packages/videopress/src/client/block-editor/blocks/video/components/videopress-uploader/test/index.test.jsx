import { render, act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoPressUploader from '../index.jsx';

const mockApiFetch = jest.fn();
const mockPromoteOnSimple = jest.fn();
const mockIsSimpleSite = jest.fn();
const mockUploadFromLibrary = jest.fn();
const mockUploadHandler = jest.fn();
const mockResumableUploader = jest.fn();
const mockCreateWarningNotice = jest.fn();
const mockBuildVideoPressURL = jest.fn( () => ( {} ) );
let mockPostId = 42;
// Capture the props handed to child components so tests can drive the
// MediaPlaceholder's onSelect and the error screen's Retry directly.
const mockMediaPlaceholder = jest.fn( ( { children } ) => <div>{ children }</div> );
const mockUploadError = jest.fn( () => null );
const mockUploadProgress = jest.fn( () => null );
const mockRecordingFile = new File( [ 'recorded video' ], 'recording.mp4', { type: 'video/mp4' } );

jest.mock( '../../../../../../components/video-recording', () => ( {
	__esModule: true,
	default: ( { onRecorded } ) => (
		<button onClick={ () => onRecorded( mockRecordingFile ) }>Upload recording</button>
	),
} ) );

jest.mock(
	'@wordpress/api-fetch',
	() =>
		( ...args ) =>
			mockApiFetch( ...args )
);
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: ( ...args ) => mockIsSimpleSite( ...args ),
} ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: () => '',
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	BlockIcon: () => null,
	MediaPlaceholder: ( ...args ) => mockMediaPlaceholder( ...args ),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
	Button: () => null,
	withNotices: Component => props => (
		<Component
			{ ...props }
			noticeUI={ null }
			noticeOperations={ { removeAllNotices: () => {}, createErrorNotice: () => {} } }
		/>
	),
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: s => s,
} ) );
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: selector => selector( () => ( { getCurrentPostId: () => mockPostId } ) ),
	useDispatch: () => ( { createWarningNotice: mockCreateWarningNotice } ),
} ) );
jest.mock( '@wordpress/ui', () => ( {
	Link: () => null,
} ) );
jest.mock( '../../../../../../hooks/use-resumable-uploader', () => options => {
	mockResumableUploader( options );
	return {
		uploadHandler: ( ...args ) => mockUploadHandler( ...args ),
		resumeHandler: null,
		error: null,
	};
} );
jest.mock( '../../../../../../hooks/use-uploader', () => ( {
	uploadFromLibrary: ( ...args ) => mockUploadFromLibrary( ...args ),
} ) );
jest.mock( '../../../../../../lib/connection', () => ( {
	isSiteConnected: () => true,
} ) );
jest.mock( '../../../../../../lib/promote-on-simple', () => ( {
	promoteOnSimple: ( ...args ) => mockPromoteOnSimple( ...args ),
} ) );
jest.mock( '../../../../../../lib/url', () => ( {
	buildVideoPressURL: ( ...args ) => mockBuildVideoPressURL( ...args ),
	buildVideoPressVideoByFileName: jest.fn(),
	pickVideoBlockAttributesFromUrl: () => ( {} ),
	getVideoNameFromUrl: () => null,
} ) );
jest.mock( '../../../edit', () => ( {
	PlaceholderWrapper: ( { children } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../icons', () => ( {
	VideoPressIcon: null,
} ) );
jest.mock(
	'../uploader-error.jsx',
	() =>
		( ...args ) =>
			mockUploadError( ...args )
);
jest.mock(
	'../uploader-progress.jsx',
	() =>
		( ...args ) =>
			mockUploadProgress( ...args )
);

const renderUploader = ( props = {} ) =>
	render(
		<VideoPressUploader
			attributes={ {} }
			setAttributes={ jest.fn() }
			handleDoneUpload={ jest.fn() }
			fileToUpload={ null }
			isReplacing={ false }
			onReplaceCancel={ jest.fn() }
			isActive
			{ ...props }
		/>
	);

const lastProps = mock => mock.mock.calls[ mock.mock.calls.length - 1 ][ 0 ];

// A media-library attachment as the editor's media modal hands it to
// onSelect: it has an id and url but no File fields (name/size/type).
const libraryAttachment = { id: 10, url: 'https://example.test/clip.mov' };

describe( 'VideoPressUploader — direct uploads', () => {
	const file = new File( [ 'video' ], 'clip.mp4', { type: 'video/mp4' } );
	const media = { id: 10, guid: 'g1234567', src: 'https://example.test/clip.mp4' };

	beforeEach( () => {
		jest.clearAllMocks();
		mockPostId = 42;
		mockApiFetch.mockResolvedValue( { id: 10, post: 42 } );
		mockUploadHandler.mockImplementation( () =>
			lastProps( mockResumableUploader ).onSuccess( media )
		);
	} );

	it.each( [ true, false ] )(
		'attaches a new upload before completing (Simple: %s)',
		async simple => {
			mockIsSimpleSite.mockReturnValue( simple );
			let finishAttaching;
			mockApiFetch.mockReturnValue( new Promise( resolve => ( finishAttaching = resolve ) ) );
			renderUploader();

			await act( async () => lastProps( mockMediaPlaceholder ).onSelect( file ) );
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/media/10',
				method: 'POST',
				data: { post: 42 },
			} );
			expect( lastProps( mockUploadProgress ).uploadedVideoData ).toBe( false );

			await act( async () => finishAttaching( { id: 10, post: 42 } ) );
			expect( lastProps( mockUploadProgress ).uploadedVideoData ).toEqual( media );
			expect( mockCreateWarningNotice ).not.toHaveBeenCalled();
		}
	);

	it.each( [ undefined, 0, 'theme//template' ] )(
		'skips attaching without a numeric post ID (%s)',
		async postId => {
			mockPostId = postId;
			renderUploader();
			await act( async () => lastProps( mockMediaPlaceholder ).onSelect( file ) );

			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( lastProps( mockUploadProgress ).uploadedVideoData ).toEqual( media );
		}
	);

	it.each( [
		{ code: 'rest_cannot_edit', data: { status: 403 } },
		{ code: 'rest_post_invalid_id', data: { status: 404 } },
		new Error( 'Network error' ),
	] )( 'keeps the uploaded video and warns when attaching fails (%s)', async error => {
		mockApiFetch.mockRejectedValueOnce( error );
		renderUploader();
		await act( async () => lastProps( mockMediaPlaceholder ).onSelect( file ) );

		expect( lastProps( mockUploadProgress ).uploadedVideoData ).toEqual( media );
		expect( mockCreateWarningNotice ).toHaveBeenCalledWith(
			'Your video was uploaded, but could not be attached to this post. It may still appear as Unattached in the Media Library.'
		);
		expect( mockUploadError ).not.toHaveBeenCalled();
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'VideoPressUploader — media library selection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockPostId = 42;
		mockBuildVideoPressURL.mockReturnValue( {} );
		mockIsSimpleSite.mockReturnValue( false );
	} );

	it.each( [ 'onSelect', 'onSelectURL' ] )(
		'does not reparent an existing video selected through %s',
		async method => {
			const handleDoneUpload = jest.fn();
			mockBuildVideoPressURL.mockReturnValue( {
				guid: 'g1234567',
				url: 'https://videopress.com/v/g1234567',
			} );
			renderUploader( { handleDoneUpload } );
			await act( async () => {
				lastProps( mockMediaPlaceholder )[ method ](
					method === 'onSelect'
						? { id: 10, videopress_guid: 'g1234567' }
						: 'https://videopress.com/v/g1234567'
				);
			} );

			expect( handleDoneUpload ).toHaveBeenCalledWith(
				expect.objectContaining( { guid: 'g1234567' } )
			);
			expect( mockApiFetch ).not.toHaveBeenCalled();
		}
	);

	it( 'sends a recording through the regular resumable file upload', async () => {
		renderUploader();
		await userEvent.click( screen.getByRole( 'button', { name: 'Upload recording' } ) );
		expect( mockUploadHandler ).toHaveBeenCalledWith( mockRecordingFile );
		expect( lastProps( mockUploadProgress ).file ).toBe( mockRecordingFile );
		expect( mockUploadFromLibrary ).not.toHaveBeenCalled();
	} );

	it( 'promotes in place via wpcom/v2 on Simple instead of the videopress/v1 walker', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockPromoteOnSimple.mockResolvedValue( { guid: 'g1234567', mediaId: 10 } );

		renderUploader();
		await act( async () => {
			lastProps( mockMediaPlaceholder ).onSelect( libraryAttachment );
		} );

		expect( mockPromoteOnSimple ).toHaveBeenCalledWith( 10 );
		// The videopress/v1 probe 404s at the public-api router on Simple —
		// the whole point of the promote branch is that it never fires.
		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( mockUploadFromLibrary ).not.toHaveBeenCalled();

		// The promote result feeds the same post-upload editor flow as a
		// finished chunked upload, with the attachment URL as the source.
		await waitFor( () =>
			expect( lastProps( mockUploadProgress ).uploadedVideoData ).toEqual( {
				guid: 'g1234567',
				id: 10,
				src: 'https://example.test/clip.mov',
			} )
		);
	} );

	it( 'keeps probing videopress/v1 and walking the upload off Simple', async () => {
		mockApiFetch.mockResolvedValue( { status: 'new', file_size: 100 } );
		mockUploadFromLibrary.mockReturnValue( new Promise( () => {} ) );

		renderUploader();
		await act( async () => {
			lastProps( mockMediaPlaceholder ).onSelect( libraryAttachment );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: 'videopress/v1/upload/10', method: 'GET' } )
		);
		expect( mockUploadFromLibrary ).toHaveBeenCalledWith( 10 );
		expect( mockPromoteOnSimple ).not.toHaveBeenCalled();
	} );

	it( 'shows the promote failure and Retry re-runs the promote instead of crashing', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockPromoteOnSimple.mockRejectedValueOnce( new Error( 'Tombstoned.' ) );

		renderUploader();
		await act( async () => {
			lastProps( mockMediaPlaceholder ).onSelect( libraryAttachment );
		} );

		expect( lastProps( mockUploadError ).errorData ).toEqual( {
			data: { message: 'Tombstoned.' },
		} );

		// Before the fix Retry called startUpload( null ) and crashed
		// reading `.size`; now it re-dispatches the stored library
		// selection through the promote path.
		mockPromoteOnSimple.mockResolvedValue( { guid: 'g1234567', mediaId: 10 } );
		await act( async () => {
			lastProps( mockUploadError ).onRetry();
		} );

		expect( mockPromoteOnSimple ).toHaveBeenCalledTimes( 2 );
		expect( mockPromoteOnSimple ).toHaveBeenLastCalledWith( 10 );
	} );

	it( 'Retry with nothing stored resets to the picker instead of crashing', async () => {
		// Reach the error screen through the URL path, which stores no file:
		// the mocked url lib rejects every source, so onSelectURL errors.
		renderUploader();
		await act( async () => {
			lastProps( mockMediaPlaceholder ).onSelectURL( 'https://example.test/not-a-video' );
		} );

		expect( lastProps( mockUploadError ).errorData ).toEqual( {
			data: { message: 'Invalid VideoPress URL' },
		} );

		await act( async () => {
			lastProps( mockUploadError ).onRetry();
		} );

		// Back to the picker: the placeholder rendered again after the reset.
		expect( mockMediaPlaceholder ).toHaveBeenCalled();
		expect( mockUploadHandler ).not.toHaveBeenCalled();
	} );
} );
