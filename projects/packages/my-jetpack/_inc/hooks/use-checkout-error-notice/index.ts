import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useEffect } from 'react';

const CHECKOUT_ERROR_NOTICE_ID = 'my-jetpack-checkout-error';

/**
 * Show a snackbar when the checkout workflow reports an error.
 *
 * @param {string | null} checkoutError - The `checkoutError` returned by `useProductCheckoutWorkflow`.
 */
export default function useCheckoutErrorNotice( checkoutError: string | null ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( checkoutError ) {
			createErrorNotice(
				__( 'Checkout could not start. Please try again.', 'jetpack-my-jetpack' ),
				{
					id: CHECKOUT_ERROR_NOTICE_ID,
					type: 'snackbar',
				}
			);
		}
	}, [ checkoutError, createErrorNotice ] );
}
