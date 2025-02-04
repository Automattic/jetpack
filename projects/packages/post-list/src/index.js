import { __ } from '@wordpress/i18n';

/**
 * Closure function to copy the link to the clipboard.
 *
 * @return {Function} The click event handler.
 */
function copyLinkQuickAction() {
	let timoutId;
	/**
	 * Copy the link to the clipboard.
	 * @param {object} event - The event object.
	 */
	function onClick( event ) {
		event.preventDefault();
		clearTimeout( timoutId );
		window.navigator.clipboard.writeText( event.target.getAttribute( 'href' ) ).then( () => {
			event.target.textContent = __( 'Copied!', 'jetpack-post-list' );
			timoutId = setTimeout( () => {
				event.target.textContent = __( 'Copy link', 'jetpack-post-list' );
			}, 2000 );
		} );
	}
	return onClick;
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '.jetpack-post-list__copy-link-action' ).forEach( node => {
		node.addEventListener( 'click', copyLinkQuickAction() );
	} );
} );
