import { buildShortcode, formatBytes, formatDuration, formatWatchTime } from '../format';

describe( 'buildShortcode', () => {
	it( 'returns an empty string when the GUID is missing', () => {
		expect( buildShortcode( undefined, 640, 360 ) ).toBe( '' );
	} );

	it( 'renders the GUID alone when no dimensions are known', () => {
		expect( buildShortcode( 'abc123', undefined, undefined ) ).toBe( '[videopress abc123]' );
	} );

	it( 'appends bare w=/h= when both dimensions are present', () => {
		expect( buildShortcode( 'abc123', 640, 360 ) ).toBe( '[videopress abc123 w=640 h=360]' );
	} );

	it( 'omits a dimension that is missing or zero', () => {
		expect( buildShortcode( 'abc123', 640, undefined ) ).toBe( '[videopress abc123 w=640]' );
		expect( buildShortcode( 'abc123', 0, 360 ) ).toBe( '[videopress abc123 h=360]' );
	} );
} );

describe( 'formatDuration', () => {
	it( 'pads to mm:ss below an hour', () => {
		expect( formatDuration( 0 ) ).toBe( '00:00' );
		expect( formatDuration( 5 ) ).toBe( '00:05' );
		expect( formatDuration( 65 ) ).toBe( '01:05' );
	} );

	it( 'switches to h:mm:ss at and above an hour', () => {
		expect( formatDuration( 3600 ) ).toBe( '1:00:00' );
		expect( formatDuration( 3661 ) ).toBe( '1:01:01' );
	} );

	it( 'floors fractional seconds', () => {
		expect( formatDuration( 65.9 ) ).toBe( '01:05' );
	} );

	it( 'clamps negative input to zero', () => {
		expect( formatDuration( -10 ) ).toBe( '00:00' );
	} );
} );

describe( 'formatWatchTime', () => {
	it( 'reports whole seconds below a minute', () => {
		expect( formatWatchTime( 0 ) ).toBe( '0 s' );
		expect( formatWatchTime( 30.4 ) ).toBe( '30 s' );
	} );

	it( 'rounds to whole minutes from one minute up to an hour', () => {
		expect( formatWatchTime( 60 ) ).toBe( '1 min' );
		expect( formatWatchTime( 90 ) ).toBe( '2 min' );
		// Just shy of an hour rounds up to 60 min rather than flipping to hours.
		expect( formatWatchTime( 3599 ) ).toBe( '60 min' );
	} );

	it( 'shows one decimal place of hours at and above an hour', () => {
		expect( formatWatchTime( 3600 ) ).toBe( '1.0 h' );
		expect( formatWatchTime( 5400 ) ).toBe( '1.5 h' );
	} );
} );

describe( 'formatBytes', () => {
	it( 'renders raw bytes below 1 KiB', () => {
		expect( formatBytes( 0 ) ).toBe( '0 B' );
		expect( formatBytes( 512 ) ).toBe( '512 B' );
	} );

	it( 'scales to the largest binary unit with one decimal place', () => {
		expect( formatBytes( 1024 ) ).toBe( '1.0 KB' );
		expect( formatBytes( 1536 ) ).toBe( '1.5 KB' );
		expect( formatBytes( 1024 * 1024 ) ).toBe( '1.0 MB' );
		expect( formatBytes( 1024 ** 3 ) ).toBe( '1.0 GB' );
		expect( formatBytes( 1024 ** 4 ) ).toBe( '1.0 TB' );
	} );

	it( 'caps at TB rather than overflowing into larger units', () => {
		expect( formatBytes( 1024 ** 5 ) ).toBe( '1024.0 TB' );
	} );
} );
