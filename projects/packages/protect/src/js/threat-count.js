/**
 * Refreshes the Protect threat count after the page loads, so rendering never waits on WordPress.com.
 *
 * Updates the Protect menu badge, then fires the configured document event for the admin bar notice.
 */
/* eslint-disable no-var -- shipped as-is with no build step, so it stays ES5-compatible */
( function ( config ) {
	if ( ! config || ! window.wp || ! window.wp.apiFetch ) {
		return;
	}

	window.wp
		.apiFetch( { path: config.path } )
		.then( function ( response ) {
			var count = response && typeof response.count === 'number' ? response.count : null;
			if ( null === count ) {
				return;
			}

			if ( window.jetpackMenuBadges && typeof window.jetpackMenuBadges.setCount === 'function' ) {
				window.jetpackMenuBadges.setCount( config.menuSlug, count );
			}

			// Kept on window too, for a listener that attaches after the event fired.
			window.jetpackProtectThreatCount = count;
			document.dispatchEvent( new CustomEvent( config.event, { detail: { count: count } } ) );
		} )
		.catch( function () {
			// The stored count stays on screen; the server backs off before trying again.
		} );
} )( window.jetpackProtectThreatCountConfig );
