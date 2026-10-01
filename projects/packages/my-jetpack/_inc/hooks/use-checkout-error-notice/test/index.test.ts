import { renderHook } from '@testing-library/react';
import useCheckoutErrorNotice from '../index';

const mockCreateErrorNotice = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createErrorNotice: mockCreateErrorNotice } ),
} ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );

describe( 'useCheckoutErrorNotice', () => {
	beforeEach( () => mockCreateErrorNotice.mockClear() );

	it( 'shows a snackbar with a stable id when the checkout fails', () => {
		renderHook( () => useCheckoutErrorNotice( 'Registration failed' ) );

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'Checkout could not start. Please try again.',
			{ id: 'my-jetpack-checkout-error', type: 'snackbar' }
		);
	} );

	it( 'shows nothing without an error', () => {
		renderHook( () => useCheckoutErrorNotice( null ) );

		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );
} );
