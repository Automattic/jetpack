/* global tb_show, tb_remove */

import { Modal } from '@wordpress/components';
import { render, useState } from '@wordpress/element';

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

const MyModal = (props) => {
	console.info( props );

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			<button onClick={ openModal }>hi</button>
			{ isOpen && (
				<Modal title='title' onRequestClose={ closeModal }>
					<button onClick={ closeModal }>close</button>
				</Modal>
			) }
			{/* { isOpen && (
				<button onClick={ closeModal }>close it</button>
			) } */}
		</>
	);
}

/**
 *
 * For each membership button, Create a modal that wraps the subscribe.wordpress.com site in an iframe.
 *
 * @param {*} button
 */
function setUpModal( button ) {
	console.log('loading modal');
	// Puts the modal in a temporary div so we can replace the existing button with our modal button.
	const temp = document.createElement( 'div' );
	temp.classList.add( 'n3f' );
	const modal = render(
		<MyModal/>,
		button.parentNode,
		() => {
			console.log('here');
			button.remove();
			// `replaceWith` doesn't work because the event listeners (e.g. onClick) are removed.
			// button.replaceWith(...Array.from( temp.childNodes ) )
 		}
	);
	console.log(modal);
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
			console.error( 'Problem setting up Thickbox', err );
		}

		button.setAttribute( 'data-jetpack-memberships-button-initialized', 'true' );
	} );
};
