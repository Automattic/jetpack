import domReady from '@wordpress/dom-ready';
import { initializeMembershipButtons } from '../../shared/memberships';

import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;
const querySelectorBlockTypeMapping = [
	{
		querySelector: '.wp-block-premium-content-container',
		blockType: 'paid-content',
	},
	{
		querySelector: '.wp-block-jetpack-payment-buttons',
		blockType: 'payment-button',
	},
	{
		querySelector: '.jetpack-subscribe-paywall',
		blockType: 'paywall',
	},
	{
		querySelector: '.wp-block-jetpack-donations',
		blockType: 'donations',
	},
];

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		initializeMembershipButtons( '.' + blockClassName + ' a' );

		// Thickbox isn't finished loading at this point, without a timeout the user would see an empty thickbox that
		// never gets updated with the actual payment form.
		setTimeout( () => {
			const url = new URL( window.location.href );

			// Modify the button links for membership buttons to include the button type for analytics purposes.
			document.querySelectorAll( '.wp-block-button__link' ).forEach( button => {
				if ( button.href ) {
					const buttonUrl = new URL( button.href );

					const foundMapping = querySelectorBlockTypeMapping.filter( mapping =>
						button.closest( mapping.querySelector )?.contains( button )
					);

					if ( foundMapping.length === 1 ) {
						buttonUrl.searchParams.set( 'block_type', foundMapping[ 0 ].blockType );
						button.href = buttonUrl.toString();
					}
				}
			} );

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
