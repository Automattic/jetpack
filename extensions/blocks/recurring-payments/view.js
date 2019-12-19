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

function activateSubscription( block, blogId, planId, lang ) {
	block.addEventListener( 'click', () => {
		window.scrollTo( 0, 0 );
		tb_show(
			null,
			'https://subscribe.wordpress.com/memberships/?blog=' +
				blogId +
				'&plan=' +
				planId +
				'&lang=' +
				lang +
				'&display=alternate' +
				'TB_iframe=true',
			null
		);
		window.addEventListener( 'message', handleIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );
	} );
}

const initializeMembershipButtonBlocks = () => {
	const membershipButtonBlocks = Array.prototype.slice.call(
		document.querySelectorAll( '.' + blockClassName )
	);
	membershipButtonBlocks.forEach( block => {
		const blogId = block.getAttribute( 'data-blog-id' );
		const planId = block.getAttribute( 'data-plan-id' );
		const lang = block.getAttribute( 'data-lang' );
		try {
			activateSubscription( block, blogId, planId, lang );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem activating Recurring Payments ' + planId, err );
		}
	} );
};

if ( typeof window !== 'undefined' ) {
	domReady( initializeMembershipButtonBlocks );
}
