import { renderHook } from '@testing-library/react';
import { LegacyNavigationProvider, useBoostNavigation } from './navigation-context';

const mockNavigate = jest.fn();

jest.mock( 'react-router', () => ( {
	useNavigate: () => mockNavigate,
} ) );

describe( 'useBoostNavigation', () => {
	beforeEach( () => {
		mockNavigate.mockClear();
	} );

	it( 'throws outside a provider, rather than navigating nowhere', () => {
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		expect( () => renderHook( () => useBoostNavigation() ) ).toThrow(
			'useBoostNavigation must be used inside a Boost navigation provider.'
		);

		consoleError.mockRestore();
	} );
} );

describe( 'LegacyNavigationProvider', () => {
	beforeEach( () => {
		mockNavigate.mockClear();
	} );

	const renderNavigation = () =>
		renderHook( () => useBoostNavigation(), { wrapper: LegacyNavigationProvider } );

	it( 'sends returnToSettings to the router root', () => {
		renderNavigation().result.current.returnToSettings();

		expect( mockNavigate ).toHaveBeenCalledWith( '/', undefined );
	} );

	it( 'passes navigation options through', () => {
		renderNavigation().result.current.returnToSettings( { replace: true } );

		expect( mockNavigate ).toHaveBeenCalledWith( '/', { replace: true } );
	} );
} );
