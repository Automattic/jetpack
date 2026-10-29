import getMediaToken from '../../../client/lib/get-media-token';
import resumableFileUploader from '../../../client/lib/resumable-file-uploader';
import { startVideoUpload } from '../start-video-upload';

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
