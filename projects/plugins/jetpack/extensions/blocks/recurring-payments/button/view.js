/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { initializeMembershipButtons } from '../../../shared/memberships';

/**
 * Style dependencies
 */
import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		initializeMembershipButtons( '.' + blockClassName + ' a' );

		// Thickbox isn't finished loading at this point, without a timeout the user would see an empty thickbox that
		// never gets updated with the actual payment form.
		setTimeout( () => {
			// When we have a payment plan to open we automatically display it.
			const urlParams = new URLSearchParams( window.location.search );
			if ( urlParams.has( 'recurring_payments' ) ) {
				const idOfPaymentFormToOpen = `recurring-payments-${ urlParams.get(
					'recurring_payments'
				) }`;
				document.getElementById( idOfPaymentFormToOpen )?.click();
			}
		}, 100 );
	} );
}
