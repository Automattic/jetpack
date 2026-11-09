import { getScriptData } from '@automattic/jetpack-script-data';
import { reportError, resetErrorReporterForTests } from '../report-error';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const ORIGIN = 'https://example.com/wp-content/plugins/jetpack/build/';
const START = new Date( '2026-03-01T10:00:00Z' );
const HOUR = 3_600_000;

const BUDGET_KEY = 'jetpack-premium-analytics-error-budget';
const CURRENT_HOUR = Math.floor( START.getTime() / HOUR );

const storedBudget = () => JSON.parse( window.localStorage.getItem( BUDGET_KEY ) as string );

const ERROR_REPORTING = { enabled: true, version: '1.2.3', script_origins: [ ORIGIN ] };

const scriptData = ( errorReporting = ERROR_REPORTING ) =>
	( {
		site: { wpcom: { blog_id: 42 } },
		premium_analytics: { error_reporting: errorReporting },
	} ) as ReturnType< typeof getScriptData >;

/**
 * Builds an error whose first stack frame is served from the dashboard bundle.
 *
 * @param message - The error message.
 * @param file    - The file the frame points at, below the dashboard origin.
 * @return The error.
 */
function dashboardError( message = 'boom', file = 'widgets/top-posts/render.js:10:5' ) {
	const error = new TypeError( message );
	error.stack = `TypeError: ${ message }\n    at render (${ ORIGIN }${ file })\n    at other (https://other.example/x.js:1:1)`;
	return error;
}

const foreignError = () => {
	const error = new Error( 'other plugin' );
	error.stack = 'Error: other plugin\n    at run (https://other.example/x.js:1:1)';
	return error;
};

const fetchMock = jest.fn();

/**
 * The decoded payload of one fetch call.
 *
 * @param call - Index of the call.
 * @return The parsed `error` field.
 */
function sentPayload( call = 0 ) {
	const init = fetchMock.mock.calls[ call ][ 1 ] as RequestInit;
	return JSON.parse( ( init.body as URLSearchParams ).get( 'error' ) as string );
}

const flush = async () => {
	for ( let i = 0; i < 5; i++ ) {
		await Promise.resolve();
	}
};

const failStorage = () => {
	const denied = () => {
		throw new Error( 'denied' );
	};
	return [
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( denied ),
		jest.spyOn( Storage.prototype, 'setItem' ).mockImplementation( denied ),
	];
};

describe( 'reportError', () => {
	const originalFetch = window.fetch;
	let storageSpies: jest.SpyInstance[] = [];

	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( START );
		window.localStorage.clear();
		window.history.replaceState(
			{},
			'',
			'/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=/posts&secret=1#hash'
		);
		fetchMock.mockReset();
		fetchMock.mockResolvedValue( { ok: true } );
		window.fetch = fetchMock as unknown as typeof window.fetch;
		jest.mocked( getScriptData ).mockReturnValue( scriptData() );
		resetErrorReporterForTests();
	} );

	afterEach( () => {
		storageSpies.forEach( spy => spy.mockRestore() );
		storageSpies = [];
		window.fetch = originalFetch;
		jest.useRealTimers();
	} );

	it( 'posts form-encoded JSON in a single error field with keepalive', () => {
		reportError( dashboardError(), 'error' );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		const [ url, init ] = fetchMock.mock.calls[ 0 ];
		expect( url ).toBe( 'https://public-api.wordpress.com/rest/v1.1/js-error' );
		expect( init.method ).toBe( 'POST' );
		expect( init.keepalive ).toBe( true );
		expect( init.headers ).toBeUndefined();
		expect( init.body ).toBeInstanceOf( URLSearchParams );
		expect( [ ...init.body.keys() ] ).toEqual( [ 'error' ] );
	} );

	it( 'sets feature jetpack_stats and severity error', () => {
		reportError( dashboardError(), 'error' );

		expect( sentPayload() ).toMatchObject( { feature: 'jetpack_stats', severity: 'error' } );
	} );

	it( 'sends message, trace, blog_id and jetpack_version from the script data', () => {
		const error = dashboardError( 'kaput' );

		reportError( error, 'error' );

		expect( sentPayload() ).toMatchObject( {
			message: 'kaput',
			trace: error.stack,
			blog_id: 42,
			jetpack_version: '1.2.3',
		} );
	} );

	it( 'sends url as origin plus pathname with no query string', () => {
		reportError( dashboardError(), 'error' );

		expect( sentPayload().url ).toBe( 'http://localhost/wp-admin/admin.php' );
	} );

	it( 'sends properties.source, route, module, widget, error_name and query', () => {
		reportError( dashboardError(), 'error' );

		expect( sentPayload().properties ).toEqual( {
			source: 'error',
			route: '/posts',
			module: 'widgets/top-posts/render.js',
			widget: 'top-posts',
			error_name: 'TypeError',
			query: {
				page: 'jetpack-premium-analytics-wp-admin',
				p: '/posts',
				secret: '[redacted]',
			},
		} );
	} );

	it( 'sends route / when the p parameter is absent', () => {
		window.history.replaceState(
			{},
			'',
			'/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin'
		);

		reportError( dashboardError(), 'error' );

		expect( sentPayload().properties.route ).toBe( '/' );
	} );

	it( 'sends properties.component_stack only for a boundary report', () => {
		const componentStack = '\n    at Widget\n    at Dashboard';

		reportError( dashboardError( 'one' ), 'boundary', { componentStack } );
		reportError( dashboardError( 'two' ), 'error', { componentStack } );

		expect( sentPayload( 0 ).properties.component_stack ).toBe( componentStack );
		expect( sentPayload( 1 ).properties ).not.toHaveProperty( 'component_stack' );
	} );

	it( 'strips the page query string from the message, trace and component stack', () => {
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=x&token=secret' );
		const pageUrl = 'http://localhost/wp-admin/admin.php?page=x&token=secret';
		const error = dashboardError( `failed on ${ pageUrl }` );
		error.stack += `\n    at inline (${ pageUrl }:3:4)`;

		reportError( error, 'boundary', { componentStack: `\n    at Widget (${ pageUrl }:5:6)` } );

		const { message, trace, properties } = sentPayload();
		expect( message ).toBe( 'failed on http://localhost/wp-admin/admin.php?[redacted]' );
		expect( trace ).toContain( 'admin.php?[redacted]:3:4' );
		expect( properties.component_stack ).toContain( 'admin.php?[redacted]:5:6' );
		[ message, trace, properties.component_stack ].forEach( field =>
			expect( field ).not.toContain( 'token=secret' )
		);
	} );

	it( 'strips the page hash from the message, trace and component stack', () => {
		window.history.replaceState( {}, '', '/wp-admin/admin.php#access_token=abc' );
		const error = dashboardError( 'at http://localhost/wp-admin/admin.php#access_token=abc' );
		error.stack += '\n    at inline (http://localhost/wp-admin/admin.php#access_token=abc:3:4)';

		reportError( error, 'boundary', { componentStack: 'in #access_token=abc' } );

		const { message, trace, properties } = sentPayload();
		expect( message ).toBe( 'at http://localhost/wp-admin/admin.php#[redacted]' );
		[ message, trace, properties.component_stack ].forEach( field =>
			expect( field ).not.toContain( 'access_token=abc' )
		);
	} );

	it( 'leaves text alone when the page has no query string or hash', () => {
		window.history.replaceState( {}, '', '/wp-admin/admin.php' );

		reportError( dashboardError( 'what? no #1' ), 'error' );

		const { message, trace } = sentPayload();
		expect( message ).toBe( 'what? no #1' );
		expect( trace ).not.toContain( '[redacted]' );
	} );

	it( 'truncates an oversized message, trace and component stack and still sends', () => {
		const error = dashboardError( 'm'.repeat( 5000 ) );
		error.stack += `\n${ 'x'.repeat( 20000 ) }`;

		reportError( error, 'boundary', { componentStack: 'c'.repeat( 20000 ) } );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		const { message, trace, properties } = sentPayload();
		expect( message ).toHaveLength( 1000 );
		expect( trace ).toHaveLength( 8000 );
		expect( properties.component_stack ).toHaveLength( 8000 );
	} );

	it( 'sends extra.line and extra.column of the first dashboard frame', () => {
		reportError( dashboardError( 'boom', 'widgets/top-posts/render.js:10:5' ), 'error' );

		expect( sentPayload().extra ).toEqual( { line: 10, column: 5 } );
	} );

	it( 'reports a boundary catch whose stack has no dashboard frame', () => {
		reportError( foreignError(), 'boundary' );

		const payload = sentPayload();
		expect( payload.message ).toBe( 'other plugin' );
		expect( payload ).not.toHaveProperty( 'extra' );
		expect( payload.properties ).not.toHaveProperty( 'module' );
		expect( payload.properties ).not.toHaveProperty( 'widget' );
	} );

	it.each( [ 'error', 'unhandledrejection' ] as const )(
		'does not report a %s whose stack has no dashboard frame',
		source => {
			reportError( foreignError(), source );

			expect( fetchMock ).not.toHaveBeenCalled();
		}
	);

	it.each( [
		[ 'disabled', scriptData( { ...ERROR_REPORTING, enabled: false } ) ],
		[ 'absent', { premium_analytics: {} } as ReturnType< typeof getScriptData > ],
	] )( 'does not report when the gate is %s', ( _label, data ) => {
		jest.mocked( getScriptData ).mockReturnValue( data );

		reportError( dashboardError(), 'boundary' );

		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'uses Non-error thrown for a thrown object with no message', () => {
		reportError( { code: 7 }, 'boundary' );

		const payload = sentPayload();
		expect( payload.message ).toBe( 'Non-error thrown' );
		expect( payload.properties ).not.toHaveProperty( 'error_name' );
	} );

	it( 'uses the message and name of a thrown object that has them', () => {
		reportError( { message: 'plain', name: 'Custom' }, 'boundary' );

		expect( sentPayload() ).toMatchObject( {
			message: 'plain',
			properties: { error_name: 'Custom' },
		} );
	} );

	it( 'uses Non-error thrown for an empty thrown string', () => {
		reportError( '', 'boundary' );
		resetErrorReporterForTests();
		reportError( '   ', 'boundary' );

		expect( sentPayload( 0 ).message ).toBe( 'Non-error thrown' );
		expect( sentPayload( 1 ).message ).toBe( 'Non-error thrown' );
	} );

	it( 'stringifies a thrown primitive into message', () => {
		reportError( 'just a string', 'boundary' );
		reportError( 404, 'boundary' );

		expect( sentPayload( 0 ).message ).toBe( 'just a string' );
		expect( sentPayload( 1 ).message ).toBe( '404' );
	} );

	it( 'reports the same message and frame only once per page', () => {
		reportError( dashboardError( 'again' ), 'error' );
		reportError( dashboardError( 'again' ), 'unhandledrejection' );
		reportError( dashboardError( 'again', 'widgets/top-posts/render.js:99:1' ), 'error' );

		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'stops after 10 reports in the same hour and resumes in the next hour', () => {
		for ( let i = 0; i < 12; i++ ) {
			reportError( dashboardError( `failure ${ i }` ), 'error' );
		}
		expect( fetchMock ).toHaveBeenCalledTimes( 10 );

		resetErrorReporterForTests();
		reportError( dashboardError( 'fresh page' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 10 );

		jest.advanceTimersByTime( HOUR );
		reportError( dashboardError( 'next hour' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 11 );
	} );

	it( 'allows only 3 reports per page load when localStorage throws', () => {
		storageSpies = failStorage();

		for ( let i = 0; i < 6; i++ ) {
			reportError( dashboardError( `failure ${ i }` ), 'error' );
		}

		expect( fetchMock ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'stops reporting for the rest of the hour after a non-2xx response', async () => {
		fetchMock.mockResolvedValue( { ok: false, status: 429 } );

		reportError( dashboardError( 'first' ), 'error' );
		await flush();
		reportError( dashboardError( 'second' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );

		resetErrorReporterForTests();
		reportError( dashboardError( 'fresh page' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );

		jest.advanceTimersByTime( HOUR );
		reportError( dashboardError( 'next hour' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'stops after a non-2xx response even when localStorage throws', async () => {
		storageSpies = failStorage();
		fetchMock.mockResolvedValue( { ok: false, status: 429 } );

		reportError( dashboardError( 'first' ), 'error' );
		await flush();
		reportError( dashboardError( 'second' ), 'error' );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'resumes in the next hour after a non-2xx response without a page reload', async () => {
		fetchMock.mockResolvedValue( { ok: false, status: 429 } );
		reportError( dashboardError( 'first' ), 'error' );
		await flush();
		reportError( dashboardError( 'blocked' ), 'error' );
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );

		jest.advanceTimersByTime( HOUR );
		reportError( dashboardError( 'next hour' ), 'error' );

		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not spend a budget slot on a duplicate', () => {
		reportError( dashboardError( 'same' ), 'error' );
		reportError( dashboardError( 'same' ), 'error' );
		for ( let i = 0; i < 9; i++ ) {
			reportError( dashboardError( `distinct ${ i }` ), 'error' );
		}

		expect( fetchMock ).toHaveBeenCalledTimes( 10 );
	} );

	it.each( [
		[ 'truncated JSON', '{"hour":' ],
		[ 'non-JSON text', 'garbage' ],
	] )( 'treats a %s budget record as absent and repairs it', ( _label, raw ) => {
		window.localStorage.setItem( BUDGET_KEY, raw );

		for ( let i = 0; i < 4; i++ ) {
			reportError( dashboardError( `failure ${ i }` ), 'error' );
		}

		expect( fetchMock ).toHaveBeenCalledTimes( 4 );
		expect( storedBudget() ).toEqual( { hour: CURRENT_HOUR, count: 4 } );
	} );

	it.each( [
		[ 'a string count', { hour: CURRENT_HOUR, count: '9' } ],
		[ 'a negative count', { hour: CURRENT_HOUR, count: -3 } ],
		[ 'a fractional count', { hour: CURRENT_HOUR, count: 2.5 } ],
		[ 'a previous hour', { hour: CURRENT_HOUR - 1, count: 9 } ],
	] )( 'overwrites a budget record with %s', ( _label, record ) => {
		window.localStorage.setItem( BUDGET_KEY, JSON.stringify( record ) );

		reportError( dashboardError(), 'error' );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		expect( storedBudget() ).toEqual( { hour: CURRENT_HOUR, count: 1 } );
	} );

	it( 'strips the query string and hash from other absolute URLs in the message, trace and component stack', () => {
		const restUrl = 'http://localhost/wp-json/jetpack/v4/stats?_wpnonce=abc123&x=1';
		const hashUrl = 'https://example.com/app#access_token=zzz';
		const error = dashboardError( `Request failed: ${ restUrl } (500) and ${ hashUrl }` );
		error.stack += `\n    at fetch (https://example.com/wp-admin/admin-ajax.php?_wpnonce=abc123:7:8)`;

		reportError( error, 'boundary', { componentStack: `in Loader (${ restUrl })` } );

		const { message, trace, properties } = sentPayload();
		expect( message ).toBe(
			'Request failed: http://localhost/wp-json/jetpack/v4/stats?[redacted] (500) and https://example.com/app#[redacted]'
		);
		expect( trace ).toContain( 'https://example.com/wp-admin/admin-ajax.php?[redacted]:7:8' );
		expect( properties.component_stack ).toBe(
			'in Loader (http://localhost/wp-json/jetpack/v4/stats?[redacted])'
		);
		[ message, trace, properties.component_stack ].forEach( field => {
			expect( field ).not.toContain( 'abc123' );
			expect( field ).not.toContain( 'zzz' );
		} );
	} );

	it( 'leaves an absolute URL without a query string or hash untouched', () => {
		reportError( dashboardError( 'GET https://example.com/a/b.js failed' ), 'error' );

		expect( sentPayload().message ).toBe( 'GET https://example.com/a/b.js failed' );
	} );

	it( 'reads the thrown message once per report', () => {
		const getter = jest.fn( () => 'volatile' );
		const error = dashboardError();
		Object.defineProperty( error, 'message', { get: getter } );

		reportError( error, 'error' );

		expect( getter ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'swallows a rejected fetch', async () => {
		fetchMock.mockRejectedValue( new TypeError( 'Failed to fetch' ) );

		expect( () => reportError( dashboardError(), 'error' ) ).not.toThrow();
		await flush();

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'swallows a fetch that throws synchronously', () => {
		fetchMock.mockImplementation( () => {
			throw new Error( 'blocked' );
		} );

		expect( () => reportError( dashboardError(), 'error' ) ).not.toThrow();
	} );
} );
