import { render, act, waitFor } from '@testing-library/react';
import VideoPressUploader from '../index.jsx';

const mockApiFetch = jest.fn();
const mockPromoteOnSimple = jest.fn();
const mockIsSimpleSite = jest.fn();
const mockUploadFromLibrary = jest.fn();
const mockUploadHandler = jest.fn();
// Capture the props handed to child components so tests can drive the
// MediaPlaceholder's onSelect and the error screen's Retry directly.
const mockMediaPlaceholder = jest.fn( () => null );
const mockUploadError = jest.fn( () => null );
const mockUploadProgress = jest.fn( () => null );

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
jest.mock( '@wordpress/ui', () => ( {
	Link: () => null,
} ) );
jest.mock( '../../../../../../hooks/use-resumable-uploader', () => () => ( {
	uploadHandler: ( ...args ) => mockUploadHandler( ...args ),
	resumeHandler: null,
	error: null,
} ) );
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
	buildVideoPressURL: () => ( {} ),
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

const renderUploader = () =>
	render(
		<VideoPressUploader
			attributes={ {} }
			setAttributes={ jest.fn() }
			handleDoneUpload={ jest.fn() }
			fileToUpload={ null }
			isReplacing={ false }
			onReplaceCancel={ jest.fn() }
			isActive
		/>
	);

const lastProps = mock => mock.mock.calls[ mock.mock.calls.length - 1 ][ 0 ];

// A media-library attachment as the editor's media modal hands it to
// onSelect: it has an id and url but no File fields (name/size/type).
const libraryAttachment = { id: 10, url: 'https://example.test/clip.mov' };

describe( 'VideoPressUploader — media library selection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsSimpleSite.mockReturnValue( false );
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
