jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '../report-error' );

type Reporter = typeof import( '../report-error' ).reportError;

/**
 * Loads a fresh copy of the installer, the mocked reporter it feeds and the script data it reads.
 *
 * @param enabled - Whether the error reporting gate is on.
 * @return The installer and the reporter mock.
 */
async function loadFresh( enabled = true ) {
	jest.resetModules();
	const { getScriptData } = await import( '@automattic/jetpack-script-data' );
	( getScriptData as jest.Mock ).mockReturnValue( {
		premium_analytics: { error_reporting: { enabled, version: '1', script_origins: [] } },
	} );
	const { installGlobalErrorHandlers: install } = await import( '../install-global-handlers' );
	const { reportError } = await import( '../report-error' );
	return { install, report: reportError as jest.MockedFunction< Reporter > };
}

const rejection = ( reason: unknown ) =>
	Object.assign( new Event( 'unhandledrejection' ), { reason } );

describe( 'installGlobalErrorHandlers', () => {
	let addSpy: jest.SpyInstance;

	beforeEach( () => {
		addSpy = jest.spyOn( window, 'addEventListener' );
	} );

	afterEach( () => {
		addSpy.mock.calls.forEach( ( [ type, listener ] ) => {
			window.removeEventListener( type, listener );
		} );
		addSpy.mockRestore();
	} );

	it( 'reports a window error event with source error', async () => {
		const { install, report } = await loadFresh();
		install();
		const error = new Error( 'boom' );

		window.dispatchEvent( new ErrorEvent( 'error', { error, message: 'boom' } ) );

		expect( report ).toHaveBeenCalledWith( error, 'error' );
	} );

	it( 'ignores a window error event with no error object', async () => {
		const { install, report } = await loadFresh();
		install();

		window.dispatchEvent( new ErrorEvent( 'error', { message: 'Script error.' } ) );

		expect( report ).not.toHaveBeenCalled();
	} );

	it( 'reports an unhandledrejection whose reason is an Error with source unhandledrejection', async () => {
		const { install, report } = await loadFresh();
		install();
		const reason = new Error( 'rejected' );

		window.dispatchEvent( rejection( reason ) );

		expect( report ).toHaveBeenCalledWith( reason, 'unhandledrejection' );
	} );

	it( 'ignores an unhandledrejection whose reason is an Error with no stack', async () => {
		const { install, report } = await loadFresh();
		install();
		const reason = new Error( 'rejected' );
		reason.stack = '';

		window.dispatchEvent( rejection( reason ) );

		expect( report ).not.toHaveBeenCalled();
	} );

	it( 'ignores an unhandledrejection whose reason is a plain object', async () => {
		const { install, report } = await loadFresh();
		install();

		window.dispatchEvent( rejection( { code: 'rest_forbidden', message: 'No' } ) );

		expect( report ).not.toHaveBeenCalled();
	} );

	it( 'ignores an unhandledrejection whose reason is a string', async () => {
		const { install, report } = await loadFresh();
		install();

		window.dispatchEvent( rejection( 'nope' ) );

		expect( report ).not.toHaveBeenCalled();
	} );

	it( 'installs no listener when the gate is disabled', async () => {
		const { install } = await loadFresh( false );

		install();

		expect( addSpy ).not.toHaveBeenCalled();
	} );

	it( 'installs the listeners only once', async () => {
		const { install } = await loadFresh();

		install();
		install();

		expect( addSpy ).toHaveBeenCalledTimes( 2 );
	} );
} );
