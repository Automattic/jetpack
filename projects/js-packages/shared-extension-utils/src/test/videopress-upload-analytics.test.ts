import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	createUploadAnalytics,
	hasReadyVideoRendition,
	observeVideoPlayability,
} from '../videopress-upload-analytics';

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
	delete ( globalThis as typeof globalThis & { __jetpackVideopressPendingReadiness?: unknown } )
		.__jetpackVideopressPendingReadiness;
} );

it( 'correlates readiness across route bundles once, with separate transfer and attempt clocks', () => {
	const clock = jest.spyOn( performance, 'now' ).mockReturnValue( 1000 );
	const tracking = createUploadAnalytics( file(), 'dashboard' );
	tracking.start();
	clock.mockReturnValue( 5000 );
	tracking.succeed( 'Abcd1234' );
	clock.mockReturnValue( 8500 );
	jest.isolateModules( () => {
		const observer = require( '../videopress-upload-analytics' ).observeVideoPlayability;
		observer( 'Abcd1234', false, 'media_rest' );
		observer( 'Oldv1234', true, 'media_rest' );
		observer( 'Abcd1234', true, 'media_rest' );
	} );
	observeVideoPlayability( 'Abcd1234', true, 'video_api' );
	expect( record ).toHaveBeenCalledTimes( 3 );
	expect( record.mock.calls[ 2 ] ).toEqual( [
		'jetpack_videopress_video_playable',
		expect.objectContaining( {
			upload_id: record.mock.calls[ 0 ][ 1 ].upload_id,
			guid: 'Abcd1234',
			attempt: 1,
			sequence: 3,
			seconds_since_upload: 3.5,
			seconds_since_upload_started: 7.5,
			clock_basis: 'upload_success_callback',
			readiness_basis: 'server_reported_mp4',
			observation_source: 'media_rest',
		} ),
	] );
} );

it.each( [
	[ {}, false ],
	[ { finished: true, poster: 'poster.jpg', files_status: { std: { mp4: 'ERROR' } } }, false ],
	[ { files: { std: { mp4: 'video.mp4' } }, files_status: { std: { mp4: 'CONVERTING' } } }, false ],
	[ { files: { std: { mp4: '' } }, files_status: { std: { mp4: 'DONE' } } }, false ],
	[ { files: { std: { mp4: 'video.mp4' } }, files_status: { std: { mp4: 'DONE' } } }, true ],
] )(
	'requires a completed MP4 instead of overall completion or a poster (%j)',
	( response, ready ) => {
		expect( hasReadyVideoRendition( response ) ).toBe( ready );
	}
);

it( 'does not turn an expired or unacknowledged upload into a playable outcome', () => {
	const clock = jest.spyOn( performance, 'now' ).mockReturnValue( 0 );
	const tracking = createUploadAnalytics( file(), 'block_editor' );
	tracking.start();
	observeVideoPlayability( 'Abcd1234', true, 'media_rest' );
	tracking.succeed( 'Abcd1234' );
	clock.mockReturnValue( 24 * 60 * 60 * 1000 );
	observeVideoPlayability( 'Abcd1234', true, 'media_rest' );
	expect( names() ).toEqual( [ 'started', 'succeeded' ] );
} );

it( 'keeps distinct logical uploads when stored-upload resumes return the same GUID', () => {
	const first = createUploadAnalytics( file(), 'dashboard' );
	const second = createUploadAnalytics( file(), 'block_editor' );
	for ( const tracking of [ first, second ] ) {
		tracking.start();
		tracking.resumedExisting();
		tracking.succeed( 'Same1234' );
	}
	observeVideoPlayability( 'Same1234', true, 'media_rest' );
	observeVideoPlayability( 'Same1234', true, 'video_api' );
	const ready = record.mock.calls.filter(
		( [ name ] ) => name === 'jetpack_videopress_video_playable'
	);
	expect( ready.map( ( [ , properties ] ) => properties.upload_id ) ).toEqual( [
		first.metadata().upload_id,
		second.metadata().upload_id,
	] );
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
