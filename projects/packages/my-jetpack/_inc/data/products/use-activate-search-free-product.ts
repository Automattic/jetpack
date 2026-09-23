import { useGlobalNotices } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { QUERY_ACTIVATE_SEARCH_FREE_KEY, REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import type { MutateCallback } from '../use-simple-mutation';

// WordPress.com holds a short lock while it grants the product, so a concurrent click gets this
// back instead of a refusal. Retried once rather than surfaced as a failure.
const IN_PROGRESS_CODE = 'jetpack_search_free_activation_in_progress';
const RETRY_DELAY_MS = 2000;

// api-fetch rejects with the parsed REST body, not an Error instance.
type ActivateSearchFreeError = {
	code?: string;
	message?: string;
	data?: { checkout_fallback?: boolean };
};

type RunOptions = {
	onSuccess?: () => void;
	checkoutRedirect?: string;
};

/**
 * Grant the free Search product in place, falling back to the $0 checkout when WordPress.com
 * says checkout could still succeed — an unconnected user, or an unreachable endpoint.
 *
 * Refusals it marks otherwise (the free tier already spent, a conflicting product) would
 * dead-end at checkout too, so those surface as an error notice instead.
 *
 * @param {object}   props                - The props passed to the hook.
 * @param {Function} props.sendToCheckout - Runs the existing free-product checkout workflow.
 * @return {{run: Function, isPending: boolean}} The activation handle.
 */
const useActivateSearchFreeProduct = ( {
	sendToCheckout,
}: {
	sendToCheckout: ( event?: unknown, redirectUrl?: string ) => void;
} ) => {
	const { createErrorNotice } = useGlobalNotices();

	const { mutate, isPending } = useSimpleMutation( {
		name: QUERY_ACTIVATE_SEARCH_FREE_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/search/activate-free`,
			method: 'POST',
			data: { source: 'my-jetpack' },
		},
	} );

	const run = useCallback(
		( { onSuccess, checkoutRedirect }: RunOptions = {} ) => {
			const attempt = ( retryOnLock = true ) => {
				( mutate as MutateCallback )( undefined, {
					onSuccess: () => onSuccess?.(),
					onError: ( error: ActivateSearchFreeError ) => {
						if ( retryOnLock && error?.code === IN_PROGRESS_CODE ) {
							setTimeout( () => attempt( false ), RETRY_DELAY_MS );
							return;
						}

						/*
						 * Only our own handler sets this flag, so an error without it never
						 * reached the handler — a stale nonce, a gateway error. Checkout needs
						 * neither, so fall back rather than dead-end on someone else's error.
						 */
						const data = error?.data;
						if ( ! data || ! ( 'checkout_fallback' in data ) || data.checkout_fallback ) {
							sendToCheckout( null, checkoutRedirect );
							return;
						}

						createErrorNotice(
							error?.message || __( 'Jetpack Search could not be activated.', 'jetpack-my-jetpack' )
						);
					},
				} );
			};

			attempt();
		},
		[ createErrorNotice, mutate, sendToCheckout ]
	);

	return { run, isPending };
};

export default useActivateSearchFreeProduct;
