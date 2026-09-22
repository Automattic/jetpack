let mockIsWpcom = false;
const mockCreateNotice = jest.fn();
const mockActivate = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { activateSearchFreeProduct: ( ...args ) => mockActivate( ...args ) },
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createNotice: mockCreateNotice } ),
	useSelect: callback => callback( () => ( { isWpcom: () => mockIsWpcom } ) ),
	select: () => ( { getVersion: () => '1.0.0' } ),
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );
// window.location can't be mocked directly, so the reload lives in a mockable wrapper.
jest.mock( 'lib/reload-page', () => ( { reloadDashboard: jest.fn() } ) );

import { act, renderHook, waitFor } from '@testing-library/react';
import { reloadDashboard } from 'lib/reload-page';
import useActivateSearchFree from '../use-activate-search-free';

let sendToCheckout;

const renderActivateHook = () => renderHook( () => useActivateSearchFree( { sendToCheckout } ) );

const rejectWith = ( code, data ) => {
	const error = new Error( 'Activation refused.' );
	error.response = { code, message: 'Activation refused.', data };
	return Promise.reject( error );
};

beforeEach( () => {
	mockIsWpcom = false;
	sendToCheckout = jest.fn();
	mockCreateNotice.mockClear();
	mockActivate.mockReset();
	reloadDashboard.mockClear();
} );

describe( 'useActivateSearchFree', () => {
	test( 'reloads the dashboard once WordPress.com grants the product', async () => {
		mockActivate.mockResolvedValue( { success: true, status: 'granted' } );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( reloadDashboard ).toHaveBeenCalled() );
		expect( mockActivate ).toHaveBeenCalledWith( 'search-dashboard' );
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	test( 'an already entitled site is a success, not a trip to checkout', async () => {
		mockActivate.mockResolvedValue( { success: true, status: 'already_entitled' } );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( reloadDashboard ).toHaveBeenCalled() );
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	test( 'falls back to checkout when WordPress.com says checkout could still succeed', async () => {
		mockActivate.mockReturnValue(
			rejectWith( 'no_connected_user', { status: 403, checkout_fallback: true } )
		);

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( sendToCheckout ).toHaveBeenCalled() );
		expect( mockCreateNotice ).not.toHaveBeenCalled();
		expect( reloadDashboard ).not.toHaveBeenCalled();
	} );

	test( 'a spent free tier surfaces an error rather than dead-ending at checkout', async () => {
		mockActivate.mockReturnValue(
			rejectWith( 'jetpack_search_free_disabled', { status: 403, checkout_fallback: false } )
		);

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( mockCreateNotice ).toHaveBeenCalled() );
		expect( mockCreateNotice.mock.calls[ 0 ][ 0 ] ).toBe( 'error' );
		expect( mockCreateNotice.mock.calls[ 0 ][ 1 ] ).toBe( 'Activation refused.' );
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	test( 'WPCOM Simple goes straight to checkout, since the route is not registered there', () => {
		mockIsWpcom = true;

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		expect( sendToCheckout ).toHaveBeenCalled();
		expect( mockActivate ).not.toHaveBeenCalled();
	} );

	test( 'a second click while a request is in flight is ignored', async () => {
		mockActivate.mockResolvedValue( { success: true, status: 'granted' } );

		const { result } = renderActivateHook();
		act( () => result.current.run() );
		await waitFor( () => expect( result.current.isActivating ).toBe( true ) );

		act( () => result.current.run() );

		expect( mockActivate ).toHaveBeenCalledTimes( 1 );
	} );
} );
