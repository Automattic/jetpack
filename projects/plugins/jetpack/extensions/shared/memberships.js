import { render } from '@wordpress/element';
import MembershipsModal from './memberships-modal';

/**
 *
 * For each membership button, Create a modal that wraps the subscribe.wordpress.com site in an iframe.
 *
 * @param {*} button
 */
function setUpModal( button ) {
	render(
		<MembershipsModal text={ button.text } url={ button.getAttribute( 'href' ) } />,
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
	const membershipButtons = [ ...document.querySelectorAll( selector ) ];
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
