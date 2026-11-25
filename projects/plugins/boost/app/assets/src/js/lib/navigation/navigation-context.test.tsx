import { renderHook } from '@testing-library/react';
import { ModernNavigationProvider, useBoostNavigation } from './navigation-context';

describe( 'useBoostNavigation', () => {
	it( 'throws outside a provider, rather than navigating nowhere', () => {
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		expect( () => renderHook( () => useBoostNavigation() ) ).toThrow(
			'useBoostNavigation must be used inside a Boost navigation provider.'
		);

		consoleError.mockRestore();
	} );
} );

describe( 'ModernNavigationProvider', () => {
	const BASE_URL = 'http://localhost/wp-admin/admin.php?page=jetpack-boost';

	beforeEach( () => {
		window.history.replaceState( null, '', BASE_URL );
	} );

	const renderNavigation = () =>
		renderHook( () => useBoostNavigation(), { wrapper: ModernNavigationProvider } );

	it( 'sends returnToSettings to the chassis Settings route, clearing the hash', () => {
		window.history.replaceState( null, '', `${ BASE_URL }#/cache-debug-log` );

		renderNavigation().result.current.returnToSettings();

		expect( window.location.hash ).toBe( '' );
		expect( window.location.search ).toContain( 'p=%2F%3Ftab%3Dsettings' );
	} );

	it( 'offers the same destination as an href', () => {
		expect( renderNavigation().result.current.settingsHref ).toContain( 'p=%2F%3Ftab%3Dsettings' );
	} );
} );
