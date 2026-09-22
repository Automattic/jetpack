import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { useDispatch, useSelect, select as syncSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { reloadDashboard } from 'lib/reload-page';
import { STORE_ID } from 'store';

/**
 * Activate the free Search product in place, falling back to the $0 checkout when it can't be.
 *
 * WordPress.com grants the product and configures Search on this site within the request, so a
 * success is followed by a reload rather than a redirect: the dashboard re-renders from the
 * server with the new plan. Checkout remains the path for sites this can't serve — WPCOM Simple
 * (where the route isn't registered), plugin versions that predate the endpoint, and every
 * refusal WordPress.com marks `checkout_fallback`.
 *
 * @param {object}   props                - The props passed to the hook.
 * @param {Function} props.sendToCheckout - Runs the existing free-product checkout workflow.
 * @return {{run: Function, isActivating: boolean}} The activation handle.
 */
export default function useActivateSearchFree( { sendToCheckout } ) {
	const [ isActivating, setIsActivating ] = useState( false );
	const { createNotice } = useDispatch( STORE_ID );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	const run = useCallback(
		event => {
			event && event.preventDefault();

			if ( isActivating ) {
				return;
			}

			analytics.tracks.recordEvent( 'jetpack_search_free_activation_click', {
				isWpcom,
				current_version: syncSelect( STORE_ID ).getVersion(),
			} );

			if ( isWpcom ) {
				sendToCheckout();
				return;
			}

			setIsActivating( true );

			restApi
				.activateSearchFreeProduct( 'search-dashboard' )
				.then( reloadDashboard )
				.catch( error => {
					if ( error?.response?.data?.checkout_fallback ) {
						// Leaves isActivating set: checkout navigates away from this page.
						sendToCheckout();
						return;
					}

					setIsActivating( false );
					createNotice(
						'error',
						error?.response?.message ||
							__( 'Jetpack Search could not be activated.', 'jetpack-search-pkg' ),
						{ duration: 0 }
					);
				} );
		},
		[ createNotice, isActivating, isWpcom, sendToCheckout ]
	);

	return { run, isActivating };
}
