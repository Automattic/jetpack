import { renderHook } from '@testing-library/react';
import useForcedOffReason from '..';
import { PRODUCT_STATUSES } from '../../../constants';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';

const mockGetJetpackModules = jest.fn();
const mockHasFinishedResolution = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback =>
		callback( () => ( {
			getJetpackModules: mockGetJetpackModules,
			hasFinishedResolution: mockHasFinishedResolution,
		} ) ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'jetpack-modules' } ) );

jest.mock( '../../../utils/is-jetpack-plugin-active', () => ( {
	isJetpackPluginActive: jest.fn(),
} ) );

jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {} ),
} ) );

const REASON = 'Disabled by your host or site administrator';

describe( 'useForcedOffReason', () => {
	beforeEach( () => {
		( isJetpackPluginActive as jest.Mock ).mockReturnValue( true );
		mockHasFinishedResolution.mockReset().mockReturnValue( true );
		mockGetJetpackModules.mockReset().mockReturnValue( {
			stats: { module: 'stats', override: 'inactive' },
			publicize: { module: 'publicize', override: 'inactive' },
			vaultpress: { module: 'vaultpress', override: 'inactive' },
			search: { module: 'search', override: 'active' },
			videopress: { module: 'videopress', override: false },
		} );
	} );

	it.each( [
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.MODULE_DISABLED,
		PRODUCT_STATUSES.NEEDS_ACTIVATION,
		PRODUCT_STATUSES.NEEDS_PLAN,
	] )( 'gives the reason for a module forced off while the card offers it: %s', status => {
		const { result } = renderHook( () => useForcedOffReason( 'stats', status ) );

		expect( result.current ).toEqual( { reason: REASON, isPending: false } );
	} );

	it( 'reads the module a product runs under another name', () => {
		const { result } = renderHook( () =>
			useForcedOffReason( 'social', PRODUCT_STATUSES.NEEDS_ACTIVATION )
		);

		expect( result.current.reason ).toBe( REASON );
	} );

	it.each( [ 'search', 'videopress', 'boost' ] as const )(
		'gives nothing for %s, which is not forced off',
		slug => {
			const { result } = renderHook( () => useForcedOffReason( slug, PRODUCT_STATUSES.INACTIVE ) );

			expect( result.current.reason ).toBeNull();
		}
	);

	it( 'ignores vaultpress for Backup, whose status never depends on a module', () => {
		const { result } = renderHook( () =>
			useForcedOffReason( 'backup', PRODUCT_STATUSES.INACTIVE )
		);

		expect( result.current ).toEqual( { reason: null, isPending: false } );
	} );

	it.each( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.EXPIRED,
		PRODUCT_STATUSES.SITE_CONNECTION_ERROR,
	] )( 'leaves a card that is not offering activation alone: %s', status => {
		const { result } = renderHook( () => useForcedOffReason( 'stats', status ) );

		expect( result.current ).toEqual( { reason: null, isPending: false } );
		expect( mockGetJetpackModules ).not.toHaveBeenCalled();
	} );

	it( 'reports it pending until the module list has resolved', () => {
		mockHasFinishedResolution.mockReturnValue( false );
		mockGetJetpackModules.mockReturnValue( {} );

		const { result } = renderHook( () => useForcedOffReason( 'stats', PRODUCT_STATUSES.INACTIVE ) );

		expect( result.current ).toEqual( { reason: null, isPending: true } );
	} );

	it( 'does not ask for modules without the Jetpack plugin', () => {
		( isJetpackPluginActive as jest.Mock ).mockReturnValue( false );

		const { result } = renderHook( () => useForcedOffReason( 'stats', PRODUCT_STATUSES.INACTIVE ) );

		expect( result.current ).toEqual( { reason: null, isPending: false } );
		expect( mockGetJetpackModules ).not.toHaveBeenCalled();
	} );
} );
