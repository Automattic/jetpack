/* global tb_show, tb_remove */

/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './view.scss';
const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

/**
 * Since "close" button is inside our checkout iframe, in order to close it, it has to pass a message to higher scope to close the modal.
 *
 * @param {event} eventFromIframe - message event that gets emmited in the checkout iframe.
 * @listens message
 */
function handleIframeResult( eventFromIframe ) {
	if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
		const data = JSON.parse( eventFromIframe.data );
		if ( data && data.action === 'close' ) {
			window.removeEventListener( 'message', handleIframeResult );
			tb_remove();
		}
	}
}

function activateSubscription( block, checkoutURL ) {
	block.addEventListener( 'click', event => {
		event.preventDefault();
		window.scrollTo( 0, 0 );
		tb_show( null, checkoutURL + '&display=alternate&TB_iframe=true', null );
		window.addEventListener( 'message', handleIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );

		// This line has to come after the Thickbox has opened otherwise Firefox doesn't scroll to the top.
		window.scrollTo( 0, 0 );
	} );
}

const initializeMembershipButtonBlocks = () => {
	const membershipButtonBlocks = Array.prototype.slice.call(
		document.querySelectorAll( '.' + blockClassName + ' a' )
	);
	membershipButtonBlocks.forEach( block => {
		const checkoutURL = block.getAttribute( 'href' );
		try {
			activateSubscription( block, checkoutURL );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem activating Recurring Payments ' + checkoutURL, err );
		}
	} );
};

if ( typeof window !== 'undefined' ) {
	domReady( initializeMembershipButtonBlocks );
}
