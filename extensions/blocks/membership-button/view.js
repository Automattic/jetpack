/* global tb_show */

/**
 * Internal dependencies
 */
import './view.scss';
const name = 'membership-button';
const blockClassName = 'wp-block-jetpack-' + name;

function activateSubscription( block, blogId, planId, poweredText ) {
	block.addEventListener( 'click', () => {
		tb_show(
			null,
			'https://subscribe.wordpress.com/memberships/?blog=' +
				blogId +
				'&plan=' +
				planId +
				'TB_iframe=true&height=600&width=400',
			null
		);
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
		const poweredText = block
			.getAttribute( 'data-powered-text' )
			.replace(
				'WordPress.com',
				'<a href="https://wordpress.com" target="_blank" rel="noreferrer noopener">WordPress.com</a>'
			);
		try {
			activateSubscription( block, blogId, planId, poweredText );
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
