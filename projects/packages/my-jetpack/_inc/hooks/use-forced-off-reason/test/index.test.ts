import { renderHook } from '@testing-library/react';
import useForcedOffReason from '..';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';

const mockGetJetpackModules = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => ( { getJetpackModules: mockGetJetpackModules } ) ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'jetpack-modules' } ) );

jest.mock( '../../../utils/is-jetpack-plugin-active', () => ( {
	isJetpackPluginActive: jest.fn(),
} ) );

jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {} ),
} ) );

describe( 'useForcedOffReason', () => {
	beforeEach( () => {
		( isJetpackPluginActive as jest.Mock ).mockReturnValue( true );
		mockGetJetpackModules.mockReset().mockReturnValue( {
			stats: { module: 'stats', override: 'inactive' },
			publicize: { module: 'publicize', override: 'inactive' },
			search: { module: 'search', override: 'active' },
			videopress: { module: 'videopress', override: false },
		} );
	} );

	it( 'gives the reason for a module forced off', () => {
		const { result } = renderHook( () => useForcedOffReason( 'stats' ) );

		expect( result.current ).toBe( 'Disabled by your host or site administrator' );
	} );

	it( 'reads the module a product runs under another name', () => {
		const { result } = renderHook( () => useForcedOffReason( 'social' ) );

		expect( result.current ).toBe( 'Disabled by your host or site administrator' );
	} );

	it.each( [ 'search', 'videopress', 'boost' ] as const )(
		'gives nothing for %s, which is not forced off',
		slug => {
			const { result } = renderHook( () => useForcedOffReason( slug ) );

			expect( result.current ).toBeNull();
		}
	);

	it( 'does not ask for modules without the Jetpack plugin', () => {
		( isJetpackPluginActive as jest.Mock ).mockReturnValue( false );

		const { result } = renderHook( () => useForcedOffReason( 'stats' ) );

		expect( result.current ).toBeNull();
		expect( mockGetJetpackModules ).not.toHaveBeenCalled();
	} );
} );
