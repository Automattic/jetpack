import jetpackAnalytics from '@automattic/jetpack-analytics';
import { createUploadAnalytics } from '../upload-analytics';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const record = jest.mocked( jetpackAnalytics.tracks.recordEvent );
const file = () => new File( [ '0123456789' ], 'private-filename.mp4', { type: 'video/mp4' } );
const names = () =>
	record.mock.calls.map( ( [ name ] ) => name.replace( 'jetpack_videopress_upload_', '' ) );

beforeEach( () => {
	jest.restoreAllMocks();
	record.mockReset();
} );

it( 'retains logical identity through a failed attempt and retry, and deduplicates outcomes', () => {
	const tracking = createUploadAnalytics( file(), 'dashboard', {
		isFree: false,
		videoCountBefore: 0,
	} );
	tracking.start();
	tracking.start();
	tracking.fail( new Error( 'private response' ), 'token' );
	tracking.fail( new Error( 'late error' ), 'token' );
	tracking.start();
	tracking.succeed( 'Abcd1234' );
	tracking.succeed( 'Abcd1234' );
	tracking.fail( new Error( 'late transfer error' ), 'transfer' );
	tracking.pause();

	expect( names() ).toEqual( [ 'started', 'failed', 'retried', 'started', 'succeeded' ] );
	const properties = record.mock.calls.map( ( [ , value ] ) => value );
	expect( new Set( properties.map( value => value.upload_id ) ).size ).toBe( 1 );
	expect( properties.map( value => value.attempt ) ).toEqual( [ 1, 1, 2, 2, 2 ] );
	expect( properties.map( value => value.sequence ) ).toEqual( [ 1, 2, 3, 4, 5 ] );
	expect( properties[ 0 ] ).toMatchObject( {
		is_free: false,
		video_count_before: 0,
		source: 'dashboard',
	} );
	expect( properties[ 4 ] ).toMatchObject( { guid: 'Abcd1234', guid_valid: true } );
	expect( tracking.metadata() ).toEqual( {
		source: 'dashboard',
		upload_id: properties[ 0 ].upload_id,
	} );
} );

it( 'keeps pause/resume within the attempt and excludes a retry canceled before its request', () => {
	const tracking = createUploadAnalytics( file(), 'block_editor' );
	tracking.start();
	tracking.progress( 4 );
	tracking.progress( 2 );
	tracking.retryScheduled();
	tracking.pause();
	tracking.pause();
	tracking.succeed( 'Abcd1234' );
	tracking.fail( new Error(), 'transfer' );
	tracking.start();
	tracking.requestStarted();
	tracking.succeed( 'Abcd1234' );

	expect( names() ).toEqual( [ 'started', 'canceled', 'retried', 'succeeded' ] );
	expect( record.mock.calls[ 1 ][ 1 ] ).toMatchObject( { action: 'pause', progress_pct: 40 } );
	expect( record.mock.calls[ 2 ][ 1 ] ).toMatchObject( { retry_type: 'resume', attempt: 1 } );
} );

it( 'counts a network retry only when the next request starts', () => {
	const tracking = createUploadAnalytics( file(), 'dashboard' );
	tracking.start();
	tracking.retryScheduled();
	expect( names() ).toEqual( [ 'started' ] );
	tracking.requestStarted();
	tracking.requestStarted();
	expect( names() ).toEqual( [ 'started', 'retried' ] );
	expect( record.mock.calls[ 1 ][ 1 ] ).toMatchObject( {
		retry_type: 'network',
		attempt: 1,
		retry_count: 1,
	} );
} );

it( 'excludes raw filenames, types, errors and invalid identifiers while retaining unknown coverage', () => {
	const tracking = createUploadAnalytics(
		new File( [ 'x' ], 'private-name', { type: 'video/private-customer-value' } ),
		'analytics_widget',
		{ isFree: null, videoCountBefore: NaN }
	);
	tracking.start();
	tracking.fail(
		{ message: 'private-error', code: 'private-code', originalResponse: { getStatus: () => 403 } },
		'transfer'
	);
	tracking.start();
	tracking.succeed( 'private-invalid-guid' );
	const serialized = JSON.stringify( record.mock.calls );
	expect( serialized ).not.toContain( 'private-' );
	expect( record.mock.calls[ 0 ][ 1 ] ).toMatchObject( { file_type: 'other' } );
	expect( record.mock.calls[ 0 ][ 1 ] ).not.toHaveProperty( 'is_free' );
	expect( record.mock.calls[ 0 ][ 1 ] ).not.toHaveProperty( 'video_count_before' );
	expect( record.mock.calls[ 1 ][ 1 ] ).toMatchObject( {
		error_code: 'transfer_failed',
		http_status: 403,
	} );
	expect( record.mock.calls[ 4 ][ 1 ] ).toMatchObject( { guid_valid: false } );
	expect( record.mock.calls[ 4 ][ 1 ] ).not.toHaveProperty( 'guid' );
} );

it( 'does not let analytics transport failures interrupt upload callbacks', () => {
	record.mockImplementation( () => {
		throw new Error( 'tracker unavailable' );
	} );
	const tracking = createUploadAnalytics( file(), 'dashboard' );
	expect( () => {
		tracking.start();
		tracking.succeed( 'Abcd1234' );
	} ).not.toThrow();
	expect( tracking.isComplete() ).toBe( true );
} );

it( 'omits correlation and events when secure randomness is unavailable', () => {
	jest.spyOn( globalThis.crypto, 'getRandomValues' ).mockImplementationOnce( () => {
		throw new Error( 'unavailable' );
	} );
	const tracking = createUploadAnalytics( file(), 'dashboard' );
	tracking.start();
	tracking.succeed( 'Abcd1234' );
	expect( record ).not.toHaveBeenCalled();
	expect( tracking.metadata() ).toEqual( { source: 'dashboard' } );
} );
