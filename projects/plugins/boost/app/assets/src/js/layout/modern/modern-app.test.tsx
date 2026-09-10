/* This project does not load jest-dom, so its matchers are not available here. */
/* eslint-disable jest-dom/prefer-in-document */
import { act, render, within } from '@testing-library/react';
import {
	LOCATION_CHANGE_EVENT,
	SETTINGS_SLOT_ID,
	SUBPAGE_SLOT_ID,
} from '../../../../../../_inc/runtime-contract';
import ModernApp from './modern-app';

const mockRecordBoostEvent = jest.fn();
let mockShouldGetStarted = false;

jest.mock( '$lib/utils/analytics', () => ( {
	...jest.requireActual( '$lib/utils/analytics' ),
	recordBoostEvent: ( ...args: unknown[] ) => mockRecordBoostEvent( ...args ),
} ) );
jest.mock( '$lib/stores/getting-started', () => ( {
	useGettingStarted: () => ( {
		shouldGetStarted: mockShouldGetStarted,
		markGettingStartedComplete: jest.fn(),
	} ),
} ) );
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	DataSyncProvider: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.mock( '$features/critical-css/critical-css-context/critical-css-context-provider', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.mock( './modern-settings', () => ( {
	__esModule: true,
	default: ( { hidden }: { hidden?: boolean } ) => <div data-testid="settings" hidden={ hidden } />,
} ) );
jest.mock( './modern-subpage', () => ( {
	__esModule: true,
	default: ( { subpage }: { subpage: string } ) => <div data-testid="subpage">{ subpage }</div>,
} ) );

const BASE_URL = 'http://localhost/wp-admin/admin.php?page=jetpack-boost';

/** The route arg as the chassis writes it. */
const SETTINGS_ARG = '&p=%2F%3Ftab%3Dsettings';

const goTo = ( suffix: string ) => {
	act( () => {
		window.history.replaceState( null, '', `${ BASE_URL }${ suffix }` );
		window.dispatchEvent( new Event( LOCATION_CHANGE_EVENT ) );
	} );
};

const renderApp = () => {
	const slots = {
		settings: document.createElement( 'div' ),
		subpage: document.createElement( 'div' ),
	};
	slots.settings.id = SETTINGS_SLOT_ID;
	slots.subpage.id = SUBPAGE_SLOT_ID;
	document.body.append( slots.settings, slots.subpage );

	return {
		slots,
		...render( <ModernApp subpageSlot={ slots.subpage } />, { container: slots.settings } ),
	};
};

describe( 'ModernApp', () => {
	beforeEach( () => {
		mockShouldGetStarted = false;
		mockRecordBoostEvent.mockClear();
		window.history.replaceState( null, '', BASE_URL );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'renders Settings in the slot it mounts into, leaving the sub-page slot empty', () => {
		const { slots } = renderApp();

		expect( within( slots.settings ).getByTestId( 'settings' ) ).toBeTruthy();
		expect( within( slots.subpage ).queryByTestId( 'subpage' ) ).toBeNull();
	} );

	it( 'keeps the Settings tree mounted while a sub-page shows', () => {
		const { slots } = renderApp();
		const settingsNode = within( slots.settings ).getByTestId( 'settings' );

		goTo( '#/cache-debug-log' );

		expect( within( slots.subpage ).getByText( 'cache-debug-log' ) ).toBeTruthy();
		expect( within( slots.settings ).getByTestId( 'settings' ) ).toBe( settingsNode );
	} );

	it( 'renders one sub-page at a time', () => {
		const { slots } = renderApp();

		goTo( '#/cache-debug-log' );
		goTo( '#/critical-css-advanced' );

		expect( within( slots.subpage ).getAllByTestId( 'subpage' ) ).toHaveLength( 1 );
		expect( within( slots.subpage ).getByText( 'critical-css-advanced' ) ).toBeTruthy();
	} );

	it( 'records one page view per visible route activation', () => {
		renderApp();
		goTo( SETTINGS_ARG );
		goTo( '#/cache-debug-log' );

		expect( mockRecordBoostEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'page_view_overview',
			'page_view_settings',
			'page_view_cache_debug_log',
		] );
	} );

	it( 'records Settings on a cold load of the chassis Settings route', () => {
		window.history.replaceState( null, '', `${ BASE_URL }${ SETTINGS_ARG }` );

		renderApp();

		expect( mockRecordBoostEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'page_view_settings',
		] );
	} );

	it( 'records Settings when the chassis switches tab', () => {
		renderApp();

		goTo( SETTINGS_ARG );

		expect( mockRecordBoostEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'page_view_overview',
			'page_view_settings',
		] );
	} );

	it( 'records Settings again on the way back from a sub-page', () => {
		renderApp();

		goTo( '#/cache-debug-log' );
		goTo( SETTINGS_ARG );

		expect( mockRecordBoostEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'page_view_overview',
			'page_view_cache_debug_log',
			'page_view_settings',
		] );
	} );

	it( 'does not record a second view for a repeated location event', () => {
		renderApp();
		goTo( '#/cache-debug-log' );
		goTo( '#/cache-debug-log' );

		expect( mockRecordBoostEvent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'promotes a tab carried in the hash and records it once as Settings', () => {
		renderApp();
		goTo( '#/?tab=settings' );

		expect( window.location.hash ).toBe( '' );
		expect( window.location.search ).toContain( 'p=%2F%3Ftab%3Dsettings' );
		expect( mockRecordBoostEvent ).toHaveBeenLastCalledWith( 'page_view_settings', { path: '/' } );
	} );

	it( 'redirects an onboarding user off a guarded route without recording it', () => {
		mockShouldGetStarted = true;
		const { slots } = renderApp();

		expect( window.location.hash ).toBe( '#/getting-started' );
		expect( within( slots.subpage ).getByText( 'getting-started' ) ).toBeTruthy();
		expect( mockRecordBoostEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'page_view_getting_started',
		] );
	} );

	it( 'leaves the onboarding page itself alone', () => {
		mockShouldGetStarted = true;
		window.history.replaceState( null, '', `${ BASE_URL }#/purchase-successful` );
		const { slots } = renderApp();

		expect( within( slots.subpage ).getByText( 'purchase-successful' ) ).toBeTruthy();
	} );
} );
