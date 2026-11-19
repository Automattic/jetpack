/**
 * External dependencies
 */
import { mountWhatsNew } from '@automattic/jetpack-announcements';
import { getCurrentRoutePath, onLocationChange } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { showWhatsNew } from './whats-new';

jest.mock( '@automattic/jetpack-announcements', () => ( {
	mountWhatsNew: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	getCurrentRoutePath: jest.fn(),
	onLocationChange: jest.fn(),
} ) );

const setFlag = ( enabled: boolean ): void => {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { whats_new_enabled: enabled } },
	} );
};

const openRoute = ( path: string ): void => {
	jest.mocked( getCurrentRoutePath ).mockReturnValue( path );
};

// The route on screen changes first, then the listener of the location runs.
const navigateTo = ( path: string ): void => {
	openRoute( path );
	jest.mocked( onLocationChange ).mock.calls[ 0 ][ 0 ]();
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

describe( 'showWhatsNew', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
		jest.mocked( mountWhatsNew ).mockClear();
		jest.mocked( onLocationChange ).mockClear();
	} );

	it.each( [
		[ 'the dashboard', '/', 'premium-analytics/main' ],
		[ 'Settings', '/settings', 'premium-analytics/settings' ],
		[
			'a report, by the first segment of its route',
			'/reports/clicks',
			'premium-analytics/reports',
		],
	] )(
		'subscribes %s to the channel of the dashboard and to its own',
		async ( _case, path, own ) => {
			setFlag( true );
			openRoute( path );

			await showAndSettle();

			expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
			expect( mountWhatsNew ).toHaveBeenCalledWith( { channels: [ 'premium-analytics', own ] } );
		}
	);

	it( 'follows the page on screen', async () => {
		setFlag( true );
		openRoute( '/' );
		await showAndSettle();

		navigateTo( '/settings' );

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 2 );
		expect( mountWhatsNew ).toHaveBeenLastCalledWith( {
			channels: [ 'premium-analytics', 'premium-analytics/settings' ],
		} );
	} );

	it( 'does not mount again while the section stays the same', async () => {
		setFlag( true );
		openRoute( '/reports/clicks' );
		await showAndSettle();

		navigateTo( '/reports/referrers' );

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'mounts nothing while the flag is off', async () => {
		setFlag( false );

		await showAndSettle();

		expect( mountWhatsNew ).not.toHaveBeenCalled();
	} );

	// Jest fails a test that leaves a rejection unhandled.
	it( 'stays quiet when the surface fails to mount', async () => {
		jest.mocked( mountWhatsNew ).mockImplementationOnce( () => {
			throw new Error( 'mount failed' );
		} );
		setFlag( true );
		openRoute( '/' );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );
} );
