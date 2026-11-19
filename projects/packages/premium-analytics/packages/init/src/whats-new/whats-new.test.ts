/**
 * External dependencies
 */
import { mountWhatsNew } from '@automattic/jetpack-announcements';
/**
 * Internal dependencies
 */
import { showWhatsNew } from './whats-new';

jest.mock( '@automattic/jetpack-announcements', () => ( {
	mountWhatsNew: jest.fn(),
} ) );

const setFlag = ( enabled: boolean ): void => {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { whats_new_enabled: enabled } },
	} );
};

// The router keeps the route in `p`, next to the filters of the page.
const openRoute = ( route?: string, filters = '' ): void => {
	const p = route === undefined ? '' : `&p=${ encodeURIComponent( route ) }`;
	window.history.replaceState(
		null,
		'',
		`?page=jetpack-premium-analytics-wp-admin${ p }${ filters }`
	);
};

// jsdom has no Navigation API, so a test that navigates brings its own.
const addNavigation = (): EventTarget => {
	const navigation = new EventTarget();
	Object.defineProperty( window, 'navigation', { configurable: true, value: navigation } );

	return navigation;
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

describe( 'showWhatsNew', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
		delete ( window as { navigation?: unknown } ).navigation;
		window.history.replaceState( null, '', window.location.pathname );
		jest.mocked( mountWhatsNew ).mockClear();
	} );

	it.each< [ string, string | undefined, string ] >( [
		[ 'the dashboard', undefined, 'premium-analytics/main' ],
		[ 'the dashboard, by its route', '/', 'premium-analytics/main' ],
		[ 'Settings', '/settings', 'premium-analytics/settings' ],
		[
			'a report, by the first segment of its route',
			'/reports/clicks',
			'premium-analytics/reports',
		],
	] )(
		'subscribes %s to the channel of the dashboard and to its own',
		async ( _case, route, own ) => {
			setFlag( true );
			openRoute( route );

			await showAndSettle();

			expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
			expect( mountWhatsNew ).toHaveBeenCalledWith( { channels: [ 'premium-analytics', own ] } );
		}
	);

	it( 'follows the page on screen', async () => {
		const navigation = addNavigation();
		setFlag( true );
		openRoute( '/' );
		await showAndSettle();

		openRoute( '/settings' );
		navigation.dispatchEvent( new Event( 'currententrychange' ) );

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 2 );
		expect( mountWhatsNew ).toHaveBeenLastCalledWith( {
			channels: [ 'premium-analytics', 'premium-analytics/settings' ],
		} );
	} );

	it( 'does not mount again while the page stays the same', async () => {
		const navigation = addNavigation();
		setFlag( true );
		openRoute( '/' );
		await showAndSettle();

		openRoute( '/', '&from=2026-11-01&to=2026-11-30' );
		navigation.dispatchEvent( new Event( 'currententrychange' ) );

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

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );
} );
