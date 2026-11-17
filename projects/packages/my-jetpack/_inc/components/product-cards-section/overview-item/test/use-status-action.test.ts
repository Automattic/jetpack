import { renderHook } from '@testing-library/react';
import useConnectSite from '../../../../hooks/use-connect-site';
import useProductStatusAction from '../../../action-button/use-product-status-action';
import useStatusAction from '../use-status-action';

let mockIsBusy = false;

jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats', status: 'module_disabled' },
	refetch: jest.fn(),
} ) );
jest.mock( '../../../../hooks/use-connect-site', () =>
	jest.fn( () => ( { connectSite: jest.fn() } ) )
);
jest.mock( '../../../../hooks/use-my-jetpack-connection', () => () => ( { isRegistered: false } ) );
jest.mock( '../../../action-button/use-product-status-action', () =>
	jest.fn( () => ( {
		action: { label: 'Activate Stats', onClick: jest.fn() },
		isBusy: mockIsBusy,
		forcedOffReason: null,
	} ) )
);

describe( 'useStatusAction', () => {
	beforeEach( () => jest.clearAllMocks() );

	it.each( [ false, true ] )( 'disables the action while the card would be busy: %s', isBusy => {
		mockIsBusy = isBusy;
		const { result } = renderHook( () => useStatusAction( 'stats', 'Activate Stats' ) );

		expect( result.current.action.disabled ).toBe( isBusy );
	} );

	it( "sends the item's own name from its connect links", () => {
		renderHook( () => useStatusAction( 'stats', 'Activate Stats' ) );

		expect( useProductStatusAction ).toHaveBeenCalledWith(
			'stats',
			expect.objectContaining( { from: 'my_jetpack_overview_stats' } )
		);
		expect( useConnectSite ).toHaveBeenCalledWith(
			expect.objectContaining( {
				from: 'my_jetpack_overview_stats',
				tracksInfo: expect.objectContaining( {
					properties: { from: 'my_jetpack_overview_stats' },
				} ),
			} )
		);
	} );
} );
