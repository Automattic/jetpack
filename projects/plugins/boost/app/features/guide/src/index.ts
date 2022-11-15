import { attachGuides } from './Attach';
import { load } from './Images';
import { measure } from './Measurements';
import AdminBarToggle from './ui/AdminBarToggle.svelte';

/**
 * Initialize the guide.
 */
window.addEventListener( 'load', async () => {
	const nodes = document.querySelectorAll( 'body *' );
	const images = await load( Array.from( nodes ) );
	const measuredImages = measure( images );
	attachGuides( measuredImages );

} );


/**
 * Initialize the admin bar toggle.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const adminBarToggle = document.getElementById( 'wp-admin-bar-jetpack-boost-image-guide' );
	const link = adminBarToggle?.querySelector( 'a' );
	if ( adminBarToggle && link ) {
		const href = link.getAttribute( 'href' );
		link.remove();
		new AdminBarToggle( {
			target: adminBarToggle,
			props: {
				href,
			},
		} );
	}
} );
