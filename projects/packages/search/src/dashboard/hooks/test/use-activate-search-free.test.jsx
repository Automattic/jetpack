let mockIsWpcom = false;
const mockErrorNotice = jest.fn();
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
	useDispatch: () => ( { errorNotice: mockErrorNotice } ),
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

// Settles pending promises without asserting on an empty act() body.
const flushPromises = () => act( () => Promise.resolve() );

const renderActivateHook = () => renderHook( () => useActivateSearchFree( { sendToCheckout } ) );

const rejectWith = ( code, data ) => {
	const error = new Error( 'Activation refused.' );
	error.response = { code, message: 'Activation refused.', data };
	return Promise.reject( error );
};

beforeEach( () => {
	mockIsWpcom = false;
	sendToCheckout = jest.fn();
	mockErrorNotice.mockClear();
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
		expect( mockErrorNotice ).not.toHaveBeenCalled();
		expect( reloadDashboard ).not.toHaveBeenCalled();
	} );

	test( 'a spent free tier surfaces an error rather than dead-ending at checkout', async () => {
		mockActivate.mockReturnValue(
			rejectWith( 'jetpack_search_free_disabled', { status: 403, checkout_fallback: false } )
		);

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		// errorNotice, not createNotice: the raw action needs an `is-` prefixed status, and
		// anything else renders as a neutral notice rather than an error.
		await waitFor( () => expect( mockErrorNotice ).toHaveBeenCalled() );
		expect( mockErrorNotice.mock.calls[ 0 ][ 0 ] ).toBe( 'Activation refused.' );
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	test( 'an error raised before our handler runs falls back to checkout', async () => {
		// WordPress answers a stale nonce with this, well before the route's callback. It
		// carries no checkout_fallback because our handler never ran — and checkout, being a
		// plain navigation, works fine without a valid nonce.
		mockActivate.mockReturnValue( rejectWith( 'rest_cookie_invalid_nonce', { status: 403 } ) );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( sendToCheckout ).toHaveBeenCalled() );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	test( 'an error with no body at all still falls back to checkout', async () => {
		mockActivate.mockReturnValue( Promise.reject( new Error( 'Network down.' ) ) );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( sendToCheckout ).toHaveBeenCalled() );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	test( 'WPCOM Simple goes straight to checkout, since the route is not registered there', () => {
		mockIsWpcom = true;

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		expect( sendToCheckout ).toHaveBeenCalled();
		expect( mockActivate ).not.toHaveBeenCalled();
	} );

	test( 'two clicks in the same tick only fire one request', () => {
		mockActivate.mockResolvedValue( { success: true, status: 'granted' } );

		const { result } = renderActivateHook();

		// Both calls before any re-render, which is what a real double-click does. A state-only
		// guard would let the second through, because it reads the pre-render value.
		act( () => {
			result.current.run();
			result.current.run();
		} );

		expect( mockActivate ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'a modifier click is left to the anchor so it can open in a new tab', () => {
		const { result } = renderActivateHook();
		const event = { metaKey: true, button: 0, preventDefault: jest.fn() };

		act( () => result.current.run( event ) );

		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( mockActivate ).not.toHaveBeenCalled();
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	test( 'an in-progress lock is retried once rather than reported as a failure', async () => {
		jest.useFakeTimers();
		mockActivate
			.mockReturnValueOnce(
				rejectWith( 'jetpack_search_free_activation_in_progress', {
					status: 409,
					checkout_fallback: false,
				} )
			)
			.mockResolvedValueOnce( { success: true, status: 'granted' } );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		// Let the first rejection settle, then run the scheduled retry.
		await flushPromises();
		act( () => jest.runOnlyPendingTimers() );
		await flushPromises();

		expect( mockActivate ).toHaveBeenCalledTimes( 2 );
		expect( reloadDashboard ).toHaveBeenCalled();
		expect( mockErrorNotice ).not.toHaveBeenCalled();
		jest.useRealTimers();
	} );
} );
