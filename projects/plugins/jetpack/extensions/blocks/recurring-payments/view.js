import domReady from '@wordpress/dom-ready';
import { initializeMembershipButtons } from '../../shared/memberships';

import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		initializeMembershipButtons( '.' + blockClassName + ' a' );

		// TODO: When the url has a recurring_payments parameter we automatically open the payment
		// plan, by programmatically clicking on the button. Move to memberships modal?
		setTimeout( () => {
			const url = new URL( window.location.href );
			// When we have a payment plan to open we automatically display it.
			if ( url.searchParams.has( 'recurring_payments' ) && window.history.replaceState ) {
				const idOfPaymentFormToOpen = `recurring-payments-${ url.searchParams.get(
					'recurring_payments'
				) }`;

				url.searchParams.delete( 'recurring_payments' );
				window.history.replaceState( {}, '', url );
				document.getElementById( idOfPaymentFormToOpen )?.click();
			}
		}, 100 );
	} );
}
