import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { useDispatch, useSelect, select as syncSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useRef, useState } from 'react';
import { reloadDashboard } from 'lib/reload-page';
import { STORE_ID } from 'store';

// WordPress.com holds a short lock while it grants the product, so a concurrent click gets
// this back instead of a refusal. Retried once rather than surfaced as a failure.
const IN_PROGRESS_CODE = 'jetpack_search_free_activation_in_progress';
const RETRY_DELAY_MS = 2000;

/**
 * Whether a click should activate in place rather than follow the anchor.
 *
 * @param {Event} event - The click event, when the caller had one.
 * @return {boolean} True for a plain primary click.
 */
const isPlainClick = event =>
	! event || ( ! event.button && ! event.metaKey && ! event.ctrlKey && ! event.shiftKey );

/**
 * Activate the free Search product in place, falling back to the $0 checkout when it can't be.
 *
 * WordPress.com configures Search on this site inside the request, so a success is followed by
 * a reload: the dashboard re-renders from the server with the new plan. Checkout remains the
 * path for sites this can't serve — WPCOM Simple (where the route isn't registered), plugin
 * versions predating the endpoint, and every refusal WordPress.com marks `checkout_fallback`.
 *
 * @param {object}   props                - The props passed to the hook.
 * @param {Function} props.sendToCheckout - Runs the existing free-product checkout workflow.
 * @return {{run: Function, isActivating: boolean}} The activation handle.
 */
export default function useActivateSearchFree( { sendToCheckout } ) {
	const [ isActivating, setIsActivating ] = useState( false );
	// A ref, not the state above: two clicks in the same tick both read the pre-render value.
	const inFlight = useRef( false );
	const { errorNotice } = useDispatch( STORE_ID );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	const run = useCallback(
		event => {
			// Modifier and middle clicks keep the anchor's native "open in new tab" behavior.
			if ( ! isPlainClick( event ) ) {
				return;
			}
			event && event.preventDefault();

			if ( inFlight.current ) {
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

			inFlight.current = true;
			setIsActivating( true );

			const fail = error => {
				if ( error?.response?.data?.checkout_fallback ) {
					// Leaves the in-flight flags set: checkout navigates away from this page.
					sendToCheckout();
					return;
				}

				inFlight.current = false;
				setIsActivating( false );
				errorNotice(
					error?.response?.message ||
						__( 'Jetpack Search could not be activated.', 'jetpack-search-pkg' ),
					{ duration: 0 }
				);
			};

			const attempt = ( retryOnLock = true ) =>
				restApi
					.activateSearchFreeProduct( 'search-dashboard' )
					.then( reloadDashboard )
					.catch( error => {
						if ( retryOnLock && error?.response?.code === IN_PROGRESS_CODE ) {
							setTimeout( () => attempt( false ), RETRY_DELAY_MS );
							return;
						}
						fail( error );
					} );

			attempt();
		},
		[ errorNotice, isWpcom, sendToCheckout ]
	);

	return { run, isActivating };
}
