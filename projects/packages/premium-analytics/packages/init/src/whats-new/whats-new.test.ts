/**
 * External dependencies
 */
import { mountWhatsNew } from '@automattic/jetpack-announcements';
import {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_STORE_ONBOARDING_KEY,
} from '@jetpack-premium-analytics/data';
import { getCurrentRoutePath, onLocationChange } from '@jetpack-premium-analytics/routing';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { showWhatsNew } from './whats-new';

// Marked as a module, so a test can take an export away from the copy the code imports.
jest.mock( '@automattic/jetpack-announcements', () => ( {
	__esModule: true,
	mountWhatsNew: jest.fn(),
	trackWhatsNew: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	getCurrentRoutePath: jest.fn(),
	onLocationChange: jest.fn(),
} ) );

const SEEN = '2026-11-01T00:00:00.000Z';

const unmount = jest.fn();

const announcementsModule: { trackWhatsNew?: jest.Mock } = jest.requireMock(
	'@automattic/jetpack-announcements'
);
const trackWhatsNew = announcementsModule.trackWhatsNew as jest.Mock;

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | undefined ) => unknown;
};

const setPreference = ( key: string, value: string | undefined ): void => {
	void ( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		key,
		value
	);
};

const setFlag = ( enabled: boolean, sections?: string[] ): void => {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { whats_new_enabled: enabled, sections } },
	} );
};

// No path while another page is on screen, as under the admin shell.
const openRoute = ( path: string | null ): void => {
	jest.mocked( getCurrentRoutePath ).mockReturnValue( path );
};

// The route on screen changes first, then the listener of the location runs.
const navigateTo = ( path: string | null ): void => {
	openRoute( path );
	jest.mocked( onLocationChange ).mock.calls[ 0 ][ 0 ]();
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

describe( 'showWhatsNew', () => {
	// A reader who knows Stats, unless a test says otherwise.
	beforeEach( () => {
		jest.mocked( mountWhatsNew ).mockReturnValue( unmount );
		setPreference( DASHBOARD_ONBOARDING_KEY, SEEN );
	} );

	afterEach( () => {
		setPreference( DASHBOARD_ONBOARDING_KEY, undefined );
		setPreference( DASHBOARD_STORE_ONBOARDING_KEY, undefined );
		delete window.JetpackScriptData;
		jest.mocked( mountWhatsNew ).mockReset();
		jest.mocked( onLocationChange ).mockClear();
		unmount.mockClear();
		trackWhatsNew.mockClear();
		announcementsModule.trackWhatsNew = trackWhatsNew;
	} );

	it( 'asks the surface to record what the reader does with it', async () => {
		setFlag( true );
		openRoute( '/' );

		await showAndSettle();

		expect( trackWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'mounts with an older copy of the module, which has no tracking', async () => {
		delete announcementsModule.trackWhatsNew;
		setFlag( true );
		openRoute( '/' );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
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

	it( 'mounts nothing while another page is on screen', async () => {
		setFlag( true );
		openRoute( null );

		await showAndSettle();

		expect( mountWhatsNew ).not.toHaveBeenCalled();
	} );

	it( 'leaves the screen with the dashboard, and comes back with it', async () => {
		setFlag( true );
		openRoute( '/' );
		await showAndSettle();

		navigateTo( null );

		expect( unmount ).toHaveBeenCalledTimes( 1 );

		navigateTo( '/' );

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 2 );
	} );

	it.each< [ string, string | undefined, string | undefined, string[] | undefined, number ] >( [
		[ 'holds for a reader who has seen nothing', undefined, undefined, [ 'traffic' ], 0 ],
		[
			'holds while the WooCommerce tab is still to be introduced',
			SEEN,
			undefined,
			[ 'traffic', 'woocommerce' ],
			0,
		],
		[ 'holds for that tab under its older `store` slug', SEEN, undefined, [ 'store' ], 0 ],
		[ 'mounts once both journeys are done', SEEN, SEEN, [ 'traffic', 'woocommerce' ], 1 ],
		[ 'mounts when no list of tabs was published', SEEN, undefined, undefined, 1 ],
	] )( '%s', async ( _case, statsSeen, storeSeen, sections, mounts ) => {
		setPreference( DASHBOARD_ONBOARDING_KEY, statsSeen );
		setPreference( DASHBOARD_STORE_ONBOARDING_KEY, storeSeen );
		setFlag( true, sections );
		openRoute( '/' );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( mounts );
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
