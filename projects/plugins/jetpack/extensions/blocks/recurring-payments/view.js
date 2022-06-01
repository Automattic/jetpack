import domReady from '@wordpress/dom-ready';
import { initializeMembershipButtons } from '../../shared/memberships';

import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		initializeMembershipButtons( '.' + blockClassName + ' a' );

		// Thickbox isn't finished loading at this point, without a timeout the user would see an empty thickbox that
		// never gets updated with the actual payment form.
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
