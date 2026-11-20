import jetpackAnalytics from '@automattic/jetpack-analytics';
import { createUploadAnalytics } from '@automattic/jetpack-shared-extension-utils/videopress-upload-analytics';
import { Upload, defaultOptions } from 'tus-js-client';
import { resumableUploader } from '../use-uploader';

jest.mock( 'tus-js-client', () => jest.requireActual( 'tus-js-client/dist/tus.js' ) );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const record = jetpackAnalytics.tracks.recordEvent;
const names = () =>
	record.mock.calls.map( ( [ name ] ) => name.replace( 'jetpack_videopress_upload_', '' ) );
let start;

beforeEach( () => {
	jest.clearAllMocks();
	start = jest.spyOn( Upload.prototype, 'start' ).mockImplementation( () => {} );
	jest.spyOn( Upload.prototype, 'abort' ).mockResolvedValue();
	jest.spyOn( Upload.prototype, 'findPreviousUploads' ).mockResolvedValue( [] );
	jest.spyOn( Upload.prototype, 'resumeFromPreviousUpload' ).mockImplementation( () => {} );
} );

afterEach( () => jest.restoreAllMocks() );

/**
 * Start a selection with the real recorder and an intercepted tus transport.
 *
 * @param {object} analytics - Recorder from an earlier attempt, when retrying.
 * @return {object} Upload controls and observed callbacks.
 */
function begin( analytics ) {
	const file = new File( [ 'abc' ], 'private-name.mp4', { type: 'video/mp4' } );
	const tracking = analytics ?? createUploadAnalytics( file, 'block_editor' );
	tracking.start();
	const controller = new AbortController();
	const onError = jest.fn();
	const onSuccess = jest.fn();
	const controls = resumableUploader( {
		analytics: tracking,
		signal: controller.signal,
		onError,
		onSuccess,
		onProgress: jest.fn(),
		onUploadUuidRetrieved: jest.fn(),
	} )( file, { token: 'token', url: 'https://example.com/uploads/' } );
	return { controls, controller, onError, onSuccess, tracking };
}

it.each( [ 'pause', 'unmount' ] )(
	'does not start after %s during saved-upload lookup',
	async action => {
		let resolve;
		Upload.prototype.findPreviousUploads.mockReturnValueOnce(
			new Promise( done => {
				resolve = done;
			} )
		);
		const { controls, controller } = begin();
		if ( action === 'pause' ) {
			await controls.abort();
		} else {
			controller.abort();
		}
		resolve( [] );
		await Promise.resolve();
		expect( start ).not.toHaveBeenCalled();
		controls.start();
		expect( start ).toHaveBeenCalledTimes( action === 'pause' ? 1 : 0 );
		expect( names() ).toEqual(
			action === 'pause' ? [ 'started', 'canceled', 'retried' ] : [ 'started', 'canceled' ]
		);
	}
);

it( 'reports lookup failures instead of leaving an attempt pending', async () => {
	const error = new Error( 'private lookup details' );
	Upload.prototype.findPreviousUploads.mockRejectedValueOnce( error );
	const { onError } = begin();
	await Promise.resolve();
	expect( start ).not.toHaveBeenCalled();
	expect( onError ).toHaveBeenCalledWith( error );
	expect( record ).toHaveBeenLastCalledWith(
		'jetpack_videopress_upload_failed',
		expect.objectContaining( { error_code: 'resume_lookup_failed' } )
	);
} );

it( 'preserves tus retry decisions and records only performed network retries', async () => {
	begin();
	await Promise.resolve();
	const options = start.mock.instances[ 0 ].options;
	for ( const status of [ 403, 409, 423, 500 ] ) {
		const error = { originalResponse: { getStatus: () => status } };
		expect( options.onShouldRetry( error, 0, options ) ).toBe(
			defaultOptions.onShouldRetry( error, 0, options )
		);
	}
	expect( names() ).toEqual( [ 'started' ] );
	await options.onBeforeRequest( {
		_method: 'POST',
		_url: 'https://example.com/uploads/',
		_headers: {},
		_xhr: { open: jest.fn() },
		setHeader: jest.fn(),
	} );
	expect( names() ).toEqual( [ 'started', 'retried' ] );
	expect( record.mock.calls[ 1 ][ 1 ] ).toMatchObject( { retry_type: 'network' } );
} );

it( 'deduplicates acknowledgments only for analytics and isolates an earlier transport', async () => {
	const first = begin();
	await Promise.resolve();
	const options = start.mock.instances[ 0 ].options;
	const headers = {
		'x-videopress-upload-guid': 'Abcd1234',
		'x-videopress-upload-media-id': '1',
		'x-videopress-upload-src-url': 'https://example.com/video.mp4',
	};
	const response = { getStatus: () => 200, getHeader: name => headers[ name ] };
	options.onError( new Error( 'failed transfer' ) );
	first.controller.abort();
	const second = begin( first.tracking );
	await Promise.resolve();
	options.onAfterResponse( {}, response );
	options.onError( new Error( 'late old failure' ) );
	expect( names() ).toEqual( [ 'started', 'failed', 'retried', 'started' ] );
	const currentOptions = start.mock.instances[ 1 ].options;
	currentOptions.onAfterResponse( {}, response );
	currentOptions.onAfterResponse( {}, response );
	expect( second.onSuccess ).toHaveBeenCalledTimes( 2 );
	expect( names().filter( name => name === 'succeeded' ) ).toHaveLength( 1 );
	expect( currentOptions.metadata ).toMatchObject( {
		source: 'block_editor',
		upload_id: record.mock.calls[ 0 ][ 1 ].upload_id,
	} );
} );
