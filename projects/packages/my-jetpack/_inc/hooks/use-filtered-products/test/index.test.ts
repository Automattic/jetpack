import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook } from '@testing-library/react';
import useFilteredProducts from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

jest.mock( '../../../data/products/use-products-by-ownership', () => ( {
	__esModule: true,
	default: () => ( {
		data: { ownedProducts: [ 'search', 'stats' ], unownedProducts: [ 'backup', 'boost' ] },
		isLoading: false,
	} ),
} ) );

describe( 'useFilteredProducts', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { site: { is_multisite: false } } );
	} );

	afterEach( () => {
		delete window.myJetpackInitialState;
	} );

	it( 'drops the owned and unowned cards a host hid', () => {
		window.myJetpackInitialState = {
			canUserViewStats: true,
			hiddenFeatures: [ 'search', 'boost' ],
		} as typeof window.myJetpackInitialState;

		const { result } = renderHook( () => useFilteredProducts() );

		expect( result.current.filteredOwnedProducts ).toEqual( [ 'stats' ] );
		expect( result.current.filteredUnownedProducts ).toEqual( [ 'backup' ] );
	} );
} );
