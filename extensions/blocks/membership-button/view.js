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
	const mailchimpBlocks = Array.from( document.querySelectorAll( '.' + blockClassName ) );
	mailchimpBlocks.forEach( block => {
		const blog_id = block.getAttribute( 'data-blog-id' );
		const plan_id = block.getAttribute( 'data-plan-id' );
		const powered_text = block
			.getAttribute( 'data-powered-text' )
			.replace(
				'WordPress.com',
				'<a href="https://wordpress.com" target="_blank" rel="noreferrer noopener">WordPress.com</a>'
			);
		try {
			activateSubscription( block, blog_id, plan_id, powered_text );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem activating Membership Button ' + plan_id, err );
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
