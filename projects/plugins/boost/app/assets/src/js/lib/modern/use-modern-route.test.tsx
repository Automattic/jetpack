import { act, renderHook } from '@testing-library/react';
import { LOCATION_CHANGE_EVENT } from '../../../../../../_inc/runtime-contract';
import { useModernRoute } from './use-modern-route';

const BASE_URL = 'http://localhost/wp-admin/admin.php?page=jetpack-boost';

const goTo = ( suffix: string, event = LOCATION_CHANGE_EVENT ) => {
	act( () => {
		window.history.replaceState( null, '', `${ BASE_URL }${ suffix }` );
		window.dispatchEvent( new Event( event ) );
	} );
};

describe( 'useModernRoute', () => {
	beforeEach( () => {
		window.history.replaceState( null, '', BASE_URL );
	} );

	it( 'starts from the current URL', () => {
		window.history.replaceState( null, '', `${ BASE_URL }#/cache-debug-log` );

		expect( renderHook( () => useModernRoute() ).result.current ).toEqual( {
			subpage: 'cache-debug-log',
			tab: 'overview',
		} );
	} );

	it( 'follows a hash change', () => {
		const { result } = renderHook( () => useModernRoute() );

		goTo( '#/critical-css-advanced', 'hashchange' );

		expect( result.current.subpage ).toBe( 'critical-css-advanced' );
	} );

	it( 'follows the chassis location event and history navigation', () => {
		const { result } = renderHook( () => useModernRoute() );

		goTo( '&tab=settings' );
		expect( result.current.tab ).toBe( 'settings' );

		goTo( '', 'popstate' );
		expect( result.current.tab ).toBe( 'overview' );
	} );

	it( 'rewrites a tab carried in the hash', () => {
		const { result } = renderHook( () => useModernRoute() );

		goTo( '#/?tab=settings' );

		expect( window.location.hash ).toBe( '' );
		expect( window.location.search ).toContain( 'tab=settings' );
		expect( result.current ).toEqual( { subpage: null, tab: 'settings' } );
	} );

	it( 'keeps the same route object when the URL has not changed', () => {
		const { result } = renderHook( () => useModernRoute() );
		const first = result.current;

		goTo( '' );

		expect( result.current ).toBe( first );
	} );

	it( 'stops listening once unmounted', () => {
		const { result, unmount } = renderHook( () => useModernRoute() );
		const last = result.current;

		unmount();
		goTo( '#/getting-started' );

		expect( result.current ).toBe( last );
	} );
} );
