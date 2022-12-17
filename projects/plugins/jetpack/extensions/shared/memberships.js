/* global tb_show, tb_remove */

import { render } from '@wordpress/element';
import MembershipsModal from './memberships-modal';

/**
 * Since "close" button is inside our checkout iframe, in order to close it, it has to pass a message to higher scope to close the modal.
 *
 * @param {event} eventFromIframe - message event that gets emmited in the checkout iframe.
 * @listens message
 */
function handleIframeResult( eventFromIframe ) {
	console.error( 'handling iframe result --> move to modal', eventFromIframe );
	// if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
	// 	const data = JSON.parse( eventFromIframe.data );
	// 	if ( data && data.action === 'close' ) {
	// 		window.removeEventListener( 'message', handleIframeResult );
	// 		// tb_remove();
	// 	}
	// }
}

/**
 *
 * For each membership button, Create a modal that wraps the subscribe.wordpress.com site in an iframe.
 *
 * @param {*} button
 */
function setUpModal( button ) {
	console.log('loading modal');
	const modal = render(
		<MembershipsModal
			text={ button.text }
			url={ button.getAttribute( 'href' ) }
		/>,
		button.parentNode,
		() => {
			// `replaceWith` doesn't work because the event listeners (e.g. onClick) are removed.
			// button.replaceWith(...Array.from( temp.childNodes ) )
			button.remove();
 		}
	);
}

/**
 *
 * This loops through all the membership buttons on the page and initializes them.
 *
 * @param {*} selector
 */
export const initializeMembershipButtons = selector => {
	const membershipButtons =[ ... document.querySelectorAll( selector ) ];
	membershipButtons.forEach( button => {
		if ( button.getAttribute( 'data-jetpack-memberships-button-initialized' ) === 'true' ) {
			return;
		}

		try {
			setUpModal( button );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem setting up modal overlay', err );
		}

		button.setAttribute( 'data-jetpack-memberships-button-initialized', 'true' );
	} );
};
