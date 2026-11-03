import getMediaToken from '../../../client/lib/get-media-token';
import resumableFileUploader from '../../../client/lib/resumable-file-uploader';
import { startVideoUpload } from '../start-video-upload';
import { createUploadAnalytics } from '../../../client/lib/upload-analytics';
import jetpackAnalytics from '@automattic/jetpack-analytics';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '../../../client/lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '../../../client/lib/resumable-file-uploader', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockToken = jest.mocked( getMediaToken );
const mockUploader = jest.mocked( resumableFileUploader );
const file = new File( [ 'x' ], 'holiday.mp4', { type: 'video/mp4' } );
const token = { token: 'token', url: 'https://example.com/upload', blogId: '1' };
const callbacks = () => ( { onProgress: jest.fn(), onSuccess: jest.fn(), onError: jest.fn() } );

beforeEach( () => {
	jest.clearAllMocks();
} );

it( 'hands the signal to the uploader', async () => {
	mockToken.mockResolvedValue( token );
	const { signal } = new AbortController();

	await startVideoUpload( file, callbacks(), { signal } );

	expect( mockUploader ).toHaveBeenCalledWith( expect.objectContaining( { file, signal } ) );
} );

it.each( [
	[ 'arrives', () => mockToken.mockResolvedValue( token ) ],
	[ 'fails', () => mockToken.mockRejectedValue( new Error( 'Offline' ) ) ],
] )( 'stays quiet when the signal aborts before the token %s', async ( _, answerToken ) => {
	answerToken();
	const controller = new AbortController();
	const handlers = callbacks();

	const started = startVideoUpload( file, handlers, { signal: controller.signal } );
	controller.abort();
	await started;

	expect( mockUploader ).not.toHaveBeenCalled();
	expect( handlers.onError ).not.toHaveBeenCalled();
} );

it( 'records a token failure and retry with the same logical upload before tus exists', async () => {
	const analytics = createUploadAnalytics( file, 'dashboard' );
	mockToken.mockRejectedValueOnce( new Error( 'private-token-error' ) );
	const handlers = callbacks();
	await startVideoUpload( file, handlers, { analytics } );
	expect( mockUploader ).not.toHaveBeenCalled();
	expect( handlers.onError ).toHaveBeenCalledTimes( 1 );
	mockToken.mockResolvedValueOnce( token );
	await startVideoUpload( file, handlers, { analytics } );
	expect( mockUploader ).toHaveBeenCalledWith( expect.objectContaining( { analytics } ) );
	expect(
		jest.mocked( jetpackAnalytics.tracks.recordEvent ).mock.calls.map( ( [ name ] ) => name )
	).toEqual( [
		'jetpack_videopress_upload_started',
		'jetpack_videopress_upload_failed',
		'jetpack_videopress_upload_retried',
		'jetpack_videopress_upload_started',
	] );
} );

it( 'records a pause while token acquisition is pending without starting tus', async () => {
	const analytics = createUploadAnalytics( file, 'analytics_widget' );
	const controller = new AbortController();
	mockToken.mockResolvedValueOnce( token );
	const started = startVideoUpload( file, callbacks(), { analytics, signal: controller.signal } );
	controller.abort();
	await started;
	expect( mockUploader ).not.toHaveBeenCalled();
	expect( jetpackAnalytics.tracks.recordEvent ).toHaveBeenLastCalledWith(
		'jetpack_videopress_upload_canceled',
		expect.objectContaining( { action: 'pause', source: 'analytics_widget' } )
	);
} );
