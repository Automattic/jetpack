import { useGlobalNotices } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useActivateSearchFreeProduct from '../products/use-activate-search-free-product';
import type { FC, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;
const mockUseGlobalNotices = useGlobalNotices as jest.MockedFunction< typeof useGlobalNotices >;

const createErrorNotice = jest.fn();
let sendToCheckout: jest.Mock;

// Settles pending promises without asserting on an empty act() body.
const flushPromises = () => act( () => Promise.resolve() );

const createWrapper = (): FC< { children: ReactNode } > => {
	const queryClient = new QueryClient( { defaultOptions: { mutations: { retry: false } } } );
	return ( { children } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
};

const renderActivateHook = () =>
	renderHook( () => useActivateSearchFreeProduct( { sendToCheckout } ), {
		wrapper: createWrapper(),
	} );

// api-fetch rejects with the parsed REST body, not an Error instance.
const restError = ( code: string, data: Record< string, unknown > ) => ( {
	code,
	message: 'Activation refused.',
	data,
} );

beforeEach( () => {
	jest.clearAllMocks();
	sendToCheckout = jest.fn();
	mockUseGlobalNotices.mockReturnValue( {
		createErrorNotice,
	} as unknown as ReturnType< typeof useGlobalNotices > );
} );

describe( 'useActivateSearchFreeProduct', () => {
	it( 'reports success to the caller without touching checkout', async () => {
		mockApiFetch.mockResolvedValue( { success: true, status: 'granted' } );
		const onSuccess = jest.fn();

		const { result } = renderActivateHook();
		act( () => result.current.run( { onSuccess } ) );

		await waitFor( () => expect( onSuccess ).toHaveBeenCalled() );
		expect( sendToCheckout ).not.toHaveBeenCalled();
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'falls back to checkout and keeps the product-specific redirect', async () => {
		mockApiFetch.mockRejectedValue(
			restError( 'no_connected_user', { status: 403, checkout_fallback: true } )
		);

		const { result } = renderActivateHook();
		act( () => result.current.run( { checkoutRedirect: 'https://example.org/post-checkout' } ) );

		await waitFor( () => expect( sendToCheckout ).toHaveBeenCalled() );
		expect( sendToCheckout ).toHaveBeenCalledWith( null, 'https://example.org/post-checkout' );
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'falls back to checkout when the error never reached our handler', async () => {
		// A stale nonce is answered by WordPress before the route's callback, so the error
		// carries no checkout_fallback. Checkout needs no nonce, so it is still worth trying.
		mockApiFetch.mockRejectedValue( restError( 'rest_cookie_invalid_nonce', { status: 403 } ) );

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () => expect( sendToCheckout ).toHaveBeenCalled() );
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'surfaces a refusal checkout could not resolve instead of dead-ending there', async () => {
		mockApiFetch.mockRejectedValue(
			restError( 'jetpack_search_free_disabled', { status: 403, checkout_fallback: false } )
		);

		const { result } = renderActivateHook();
		act( () => result.current.run() );

		await waitFor( () =>
			expect( createErrorNotice ).toHaveBeenCalledWith( 'Activation refused.' )
		);
		expect( sendToCheckout ).not.toHaveBeenCalled();
	} );

	it( 'retries once when WordPress.com is already granting the product', async () => {
		jest.useFakeTimers();
		mockApiFetch
			.mockRejectedValueOnce(
				restError( 'jetpack_search_free_activation_in_progress', {
					status: 409,
					checkout_fallback: false,
				} )
			)
			.mockResolvedValueOnce( { success: true, status: 'granted' } );
		const onSuccess = jest.fn();

		const { result } = renderActivateHook();
		act( () => result.current.run( { onSuccess } ) );

		await flushPromises();
		act( () => jest.runOnlyPendingTimers() );
		await flushPromises();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		expect( createErrorNotice ).not.toHaveBeenCalled();
		jest.useRealTimers();
	} );
} );
