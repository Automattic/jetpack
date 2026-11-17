/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { useVideoUpload } from '../use-video-upload';
import { VideoUploader } from '../video-uploader';
import type { ReactNode } from 'react';

const mockStartVideoUpload = jest.fn();
const mockUseUploadedVideo = jest.fn();
const mockCreateInfoNotice = jest.fn();
const mockCurrentUserCan = jest.fn();
let mockDroppedFiles: File[] = [];

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: ( capability: string ) => mockCurrentUserCan( capability ),
	getAdminUrl: ( path: string ) => `https://example.com/blog/wp-admin/${ path }`,
} ) );

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	Button: ( { children, onClick }: { children: ReactNode; onClick?: () => void } ) => (
		<button onClick={ onClick }>{ children }</button>
	),
	ButtonLink: ( { children, href }: { children: ReactNode; href: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Progress: {
		Root: ( { children, ...props }: { children: ReactNode } ) => (
			<div role="progressbar" { ...props }>
				{ children }
			</div>
		),
		Track: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
		Indicator: () => <div />,
	},
	Stack: ( { children, role }: { children: ReactNode; role?: string } ) => (
		<div role={ role }>{ children }</div>
	),
	Text: ( { children, className }: { children: ReactNode; className?: string } ) => (
		<span className={ className }>{ children }</span>
	),
	VisuallyHidden: ( { children }: { children: ReactNode } ) => <span>{ children }</span>,
	getVideoPosterUrl: ( poster?: string | null ) => poster ?? undefined,
} ) );

jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
// `@wordpress/components` registers stores on import, so the mock needs the store API too.
jest.mock( '@wordpress/data', () => ( {
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn( () => ( { name: 'mock-store' } ) ),
	createSelector: jest.fn( selector => selector ),
	keyedReducer: jest.fn( ( _key, reducer ) => reducer ),
	register: jest.fn(),
	select: jest.fn( () => ( {} ) ),
	dispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => ( {} ) ),
	useRegistry: jest.fn( () => ( { select: jest.fn(), dispatch: jest.fn() } ) ),
	useDispatch: () => ( { createInfoNotice: mockCreateInfoNotice } ),
} ) );

// The dropzone has its own suite; here it only hands files over.
jest.mock( '../../../../../src/dashboard/components/upload-dropzone', () => ( {
	__esModule: true,
	default: ( { onFiles, subCopy }: { onFiles: ( files: File[] ) => void; subCopy: string } ) => (
		<button onClick={ () => onFiles( mockDroppedFiles ) }>{ subCopy }</button>
	),
} ) );

jest.mock( '../../../../../src/dashboard/utils/start-video-upload', () => ( {
	startVideoUpload: ( ...args: unknown[] ) => mockStartVideoUpload( ...args ),
} ) );

jest.mock( '../../uploaded-video/use-uploaded-video', () => ( {
	useUploadedVideo: ( id: number ) => mockUseUploadedVideo( id ),
} ) );

type Callbacks = {
	onProgress: ( sent: number, total: number ) => void;
	onSuccess: ( media: { id: number; guid: string; src: string } ) => void;
	onError: ( error: unknown ) => void;
};

const videoFile = ( name: string ) => new File( [ 'x' ], name, { type: 'video/mp4' } );
const callbacks = () => mockStartVideoUpload.mock.lastCall?.[ 1 ] as Callbacks;
const dropzoneLabel = 'Upload a video to start tracking its plays here.';

/**
 * Wires the hook to the body, as the widget does.
 *
 * @param props            - Harness props.
 * @param props.onUploaded - Called once the upload lands.
 * @return The uploader.
 */
function Uploader( { onUploaded }: { onUploaded: ( media: unknown ) => void } ) {
	const { phase, upload } = useVideoUpload( onUploaded );
	return <VideoUploader phase={ phase } onUpload={ upload } />;
}

beforeEach( () => {
	jest.clearAllMocks();
	mockDroppedFiles = [];
	mockUseUploadedVideo.mockReturnValue( null );
	mockCurrentUserCan.mockReturnValue( true );
} );

describe( 'VideoUploader', () => {
	it( 'uploads the first dropped file and tells the user about the rest', async () => {
		mockDroppedFiles = [ videoFile( 'one.mp4' ), videoFile( 'two.mp4' ) ];
		render( <Uploader onUploaded={ jest.fn() } /> );

		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );

		expect( mockStartVideoUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockStartVideoUpload.mock.calls[ 0 ][ 0 ] ).toBe( mockDroppedFiles[ 0 ] );
		expect( mockCreateInfoNotice ).toHaveBeenCalledWith(
			'Uploading the first video. Add the rest from the VideoPress dashboard.',
			{ type: 'snackbar' }
		);
		expect( screen.getByText( 'one.mp4' ) ).toBeInTheDocument();
	} );

	it( 'shows the upload progress, then the finishing step', async () => {
		mockDroppedFiles = [ videoFile( 'one.mp4' ) ];
		render( <Uploader onUploaded={ jest.fn() } /> );
		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );

		act( () => callbacks().onProgress( 50, 100 ) );
		expect( screen.getByText( 'Uploading 50%' ) ).toBeInTheDocument();
		expect( mockCreateInfoNotice ).not.toHaveBeenCalled();

		act( () => callbacks().onProgress( 100, 100 ) );
		expect( screen.getByText( 'Finishing upload…' ) ).toBeInTheDocument();
	} );

	it( 'aborts the upload in flight when the widget unmounts', async () => {
		mockDroppedFiles = [ videoFile( 'one.mp4' ) ];
		const { unmount } = render( <Uploader onUploaded={ jest.fn() } /> );
		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );
		const { signal } = mockStartVideoUpload.mock.lastCall?.[ 2 ] as { signal: AbortSignal };
		expect( signal.aborted ).toBe( false );

		unmount();

		expect( signal.aborted ).toBe( true );
	} );

	it( 'offers a retry of the same file after a failure', async () => {
		mockDroppedFiles = [ videoFile( 'one.mp4' ) ];
		render( <Uploader onUploaded={ jest.fn() } /> );
		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );

		act( () => callbacks().onError( new Error( 'nope' ) ) );
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'The upload failed. Please try again.'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry upload' } ) );
		expect( mockStartVideoUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockStartVideoUpload.mock.calls[ 1 ][ 0 ] ).toBe( mockDroppedFiles[ 0 ] );
	} );

	it( 'hands the media to the parent and follows the video until it is ready', async () => {
		mockDroppedFiles = [ videoFile( 'holiday.mp4' ) ];
		const onUploaded = jest.fn();
		const { rerender } = render( <Uploader onUploaded={ onUploaded } /> );
		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );

		const media = { id: 7, guid: 'abc', src: 'https://videopress.com/v/abc' };
		act( () => callbacks().onSuccess( media ) );

		expect( onUploaded ).toHaveBeenCalledWith( media );
		expect( mockUseUploadedVideo ).toHaveBeenCalledWith( 7 );
		expect( screen.getByText( 'holiday' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'being processed' );
		expect( screen.getByRole( 'link', { name: 'View video' } ) ).toHaveAttribute(
			'href',
			'https://example.com/blog/wp-admin/admin.php?page=jetpack-videopress&p=%2Fvideo%2F7'
		);

		mockUseUploadedVideo.mockReturnValue( {
			title: 'Holiday',
			thumbnailUrl: 'https://videos.files.wordpress.com/abc/poster.jpg',
			isProcessing: false,
			conversionFailed: false,
		} );
		rerender( <Uploader onUploaded={ onUploaded } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Your video is ready.' );
		expect( screen.getByText( 'Holiday' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://videos.files.wordpress.com/abc/poster.jpg'
		);
	} );

	it( 'leaves View video out for users who cannot open the VideoPress dashboard', async () => {
		mockDroppedFiles = [ videoFile( 'holiday.mp4' ) ];
		mockCurrentUserCan.mockReturnValue( false );
		render( <Uploader onUploaded={ jest.fn() } /> );
		await userEvent.click( screen.getByRole( 'button', { name: dropzoneLabel } ) );

		act( () =>
			callbacks().onSuccess( { id: 7, guid: 'abc', src: 'https://videopress.com/v/abc' } )
		);

		expect( mockCurrentUserCan ).toHaveBeenCalledWith( 'manage_options' );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'being processed' );
		expect( screen.queryByRole( 'link', { name: 'View video' } ) ).not.toBeInTheDocument();
	} );
} );
