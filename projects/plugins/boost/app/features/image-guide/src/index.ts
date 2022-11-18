import { attachGuides } from './Attach';
import { load } from './Images';
import { measure } from './Measurements';
import AdminBarToggle from './ui/AdminBarToggle.svelte';
import { state } from './ui/StateStore';

/**
 * Initialize the admin bar toggle.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const adminBarToggle = document.getElementById( 'wp-admin-bar-jetpack-boost-image-guide' );
	const link = adminBarToggle?.querySelector( 'a' );
	if ( adminBarToggle && link ) {
		const href = link.getAttribute( 'href' );
		link.remove();
		// eslint-disable-next-line no-new
		new AdminBarToggle( {
			target: adminBarToggle,
			props: {
				href,
			},
		} );
	}
} );

/**
 * Initialize the guides when window is loaded.
 */
window.addEventListener( 'load', () => {
	state.subscribe( async $state => {
		if ( $state === 'paused' ) {
			return;
		}
		const nodes = document.querySelectorAll(
			'body *:not(.jetpack-boost-guide > *):not(.jetpack-boost-guide)'
		);
		const images = await load( Array.from( nodes ) );
		const measuredImages = measure( images );
		attachGuides( measuredImages );
	} );
} );
