import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: ( mapSelect: ( select: () => object ) => unknown ) => mapSelect( () => ( {} ) ),
} ) );
jest.unstable_mockModule( '../../../state/store', () => ( { STORE_ID: 'jetpack-connection' } ) );

const useIdentityCrisisState = ( await import( '../use-identity-crisis-state' ) ).default;

describe( 'useIdentityCrisisState', () => {
	it( 'reads no Safe Mode from an older store without the selectors', () => {
		const { result } = renderHook( () => useIdentityCrisisState() );

		expect( result.current ).toEqual( { state: null, plugins: [] } );
	} );
} );
