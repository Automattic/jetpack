import * as tus from 'tus-js-client';
import resumableFileUploader from '..';

const mockFindPreviousUploads = jest.fn().mockResolvedValue( [] );
const mockResumeFromPreviousUpload = jest.fn();
const mockStart = jest.fn();

jest.mock( 'tus-js-client', () => ( {
	Upload: jest.fn().mockImplementation( () => ( {
		findPreviousUploads: mockFindPreviousUploads,
		resumeFromPreviousUpload: mockResumeFromPreviousUpload,
		start: mockStart,
	} ) ),
} ) );

const completionHeaders = {
	'x-videopress-upload-guid': 'testGUID',
	'x-videopress-upload-media-id': '123',
	'x-videopress-upload-src-url': 'https://example.com/video.mp4',
};

const response = ( headers: Record< string, string > = completionHeaders, status = 200 ) =>
	( {
		getStatus: () => status,
		getHeader: ( name: string ) => headers[ name ] ?? null,
	} ) as tus.HttpResponse;

const createUpload = () => {
	const file = new File( [ 'video' ], 'test.mp4', { type: 'video/mp4' } );
	const callbacks = { onProgress: jest.fn(), onSuccess: jest.fn(), onError: jest.fn() };
	resumableFileUploader( {
		file,
		tokenData: { token: 'test-token', url: 'https://example.com/uploads' },
		...callbacks,
	} );
	const options = jest.mocked( tus.Upload ).mock.calls.at( -1 )![ 1 ]!;
	const receive = ( res = response() ) => options.onAfterResponse!( {} as tus.HttpRequest, res );
	return { file, options, receive, ...callbacks };
};

describe( 'resumableFileUploader completion', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockFindPreviousUploads.mockResolvedValue( [] );
	} );

	it( 'notifies the caller once when completion headers are repeated', async () => {
		const { file, receive, onSuccess } = createUpload();

		await receive();
		await receive();

		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
		expect( onSuccess ).toHaveBeenCalledWith(
			{ id: 123, guid: 'testGUID', src: 'https://example.com/video.mp4' },
			file
		);
	} );

	it.each( Object.keys( completionHeaders ) )( 'waits for the %s header', async missingHeader => {
		const { receive, onSuccess } = createUpload();
		const headers = { ...completionHeaders };
		delete headers[ missingHeader ];

		await receive( response( headers ) );
		expect( onSuccess ).not.toHaveBeenCalled();
		await receive();
		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not treat an error response as completion', async () => {
		const { receive, onSuccess } = createUpload();

		await receive( response( completionHeaders, 500 ) );
		expect( onSuccess ).not.toHaveBeenCalled();
		await receive();
		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores progress and errors arriving after completion', async () => {
		const { receive, options, onProgress, onError } = createUpload();

		await receive();
		options.onProgress!( 5, 5 );
		options.onError!( new Error( 'Late transport error' ) );

		expect( onProgress ).not.toHaveBeenCalled();
		expect( onError ).not.toHaveBeenCalled();
	} );

	it( 'forwards progress and errors before a successful retry', async () => {
		const { receive, options, onProgress, onError, onSuccess } = createUpload();
		const error = new Error( 'Interrupted transfer' );

		options.onProgress!( 2, 5 );
		options.onError!( error );
		await receive();

		expect( onProgress ).toHaveBeenCalledWith( 2, 5 );
		expect( onError ).toHaveBeenCalledWith( error );
		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'allows each upload instance to complete independently', async () => {
		const first = createUpload();
		const second = createUpload();

		await first.receive();
		await second.receive();
		await first.receive();

		expect( first.onSuccess ).toHaveBeenCalledTimes( 1 );
		expect( second.onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'resumes an existing upload and reports its completion once', async () => {
		const previousUpload = { uploadUrl: 'https://example.com/uploads/previous' };
		mockFindPreviousUploads.mockResolvedValue( [ previousUpload ] );
		const { receive, onSuccess } = createUpload();

		await receive();
		await receive();

		expect( mockResumeFromPreviousUpload ).toHaveBeenCalledWith( previousUpload );
		expect( mockStart ).toHaveBeenCalledTimes( 1 );
		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not repeat a completion callback that throws', async () => {
		const { receive, onSuccess } = createUpload();
		onSuccess.mockImplementationOnce( () => {
			throw new Error( 'Consumer failure' );
		} );

		await expect( receive() ).rejects.toThrow( 'Consumer failure' );
		await receive();

		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );
} );
