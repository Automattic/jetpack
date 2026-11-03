import { renderHook } from '@testing-library/react';
import useStatusAction from '../use-status-action';

let mockIsBusy = false;

jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats', status: 'module_disabled' },
	refetch: jest.fn(),
} ) );
jest.mock( '../../../../hooks/use-connect-site', () => () => ( { connectSite: jest.fn() } ) );
jest.mock( '../../../../hooks/use-my-jetpack-connection', () => () => ( { isRegistered: false } ) );
jest.mock( '../../../action-button/use-product-status-action', () => () => ( {
	action: { label: 'Activate Stats', onClick: jest.fn() },
	isBusy: mockIsBusy,
	forcedOffReason: null,
} ) );

describe( 'useStatusAction', () => {
	it.each( [ false, true ] )( 'disables the action while the card would be busy: %s', isBusy => {
		mockIsBusy = isBusy;
		const { result } = renderHook( () => useStatusAction( 'stats', 'Activate Stats' ) );

		expect( result.current.action.disabled ).toBe( isBusy );
	} );
} );
