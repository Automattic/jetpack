/* global tb_show, tb_remove */

/**
 * Internal dependencies
 */
import './view.scss';
const name = 'membership-button';
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

function activateSubscription( block, blogId, planId, poweredText, lang ) {
	block.addEventListener( 'click', () => {
		tb_show(
			null,
			'https://subscribe.wordpress.com/memberships/?blog=' +
				blogId +
				'&plan=' +
				planId +
				'&lang=' +
				lang +
				'TB_iframe=true&height=600&width=400',
			null
		);
		window.addEventListener( 'message', handleIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );
		const footer = document.createElement( 'DIV' );
		footer.classList.add( 'TB_footer' );
		footer.innerHTML = poweredText;
		tbWindow.appendChild( footer );
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
		const poweredText = block
			.getAttribute( 'data-powered-text' )
			.replace(
				'WordPress.com',
				'<a href="https://wordpress.com" target="_blank" rel="noreferrer noopener">WordPress.com</a>'
			);
		try {
			activateSubscription( block, blogId, planId, poweredText, lang );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem activating Membership Button ' + planId, err );
		}
	} );
};

if ( typeof window !== 'undefined' && typeof document !== 'undefined' ) {
	// `DOMContentLoaded` may fire before the script has a chance to run
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initializeMembershipButtonBlocks );
	} else {
		initializeMembershipButtonBlocks();
	}
}
