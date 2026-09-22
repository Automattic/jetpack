import { useGlobalNotices } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { QUERY_ACTIVATE_SEARCH_FREE_KEY, REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import type { MutateCallback } from '../use-simple-mutation';

type ActivateSearchFreeError = Error & {
	data?: { checkout_fallback?: boolean };
};

/**
 * Grant the free Search product in place, falling back to the $0 checkout when WordPress.com
 * says checkout could still succeed — an unconnected user, or a transport failure.
 *
 * Refusals it marks otherwise (the free tier already spent, a conflicting product) would
 * dead-end at checkout too, so those surface as an error notice instead.
 *
 * @param {object}   props                - The props passed to the hook.
 * @param {Function} props.sendToCheckout - Runs the existing free-product checkout workflow.
 * @return {{run: Function, isPending: boolean}} The activation handle.
 */
const useActivateSearchFree = ( { sendToCheckout }: { sendToCheckout: () => void } ) => {
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
		( { onSuccess }: { onSuccess?: () => void } = {} ) => {
			( mutate as MutateCallback )( undefined, {
				onSuccess: () => onSuccess?.(),
				onError: ( error: ActivateSearchFreeError ) => {
					if ( error?.data?.checkout_fallback ) {
						sendToCheckout();
						return;
					}

					createErrorNotice(
						error?.message || __( 'Jetpack Search could not be activated.', 'jetpack-my-jetpack' )
					);
				},
			} );
		},
		[ createErrorNotice, mutate, sendToCheckout ]
	);

	return { run, isPending };
};

export default useActivateSearchFree;
