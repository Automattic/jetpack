// The channel My Jetpack publishes to, from PHP.
const CHANNEL = 'my-jetpack';

// The slug of the My Jetpack page.
const PAGE = 'my-jetpack';

/**
 * Show the What's new surface on the My Jetpack page, while its feature flag is on.
 *
 * Imported on demand and never awaited, so the surface stays out of the first render. A load
 * that fails leaves the page without it.
 */
export function showWhatsNew(): void {
	if ( ! window.myJetpackInitialState?.myJetpackFlags?.whatsNew ) {
		return;
	}

	// The admin shell runs this from other pages as well, ahead of showing this one.
	if ( new URLSearchParams( window.location.search ).get( 'page' ) !== PAGE ) {
		return;
	}

	import( '@automattic/jetpack-announcements' )
		.then( ( { mountWhatsNew } ) => {
			mountWhatsNew( { channels: [ CHANNEL ] } );
		} )
		.catch( () => undefined );
}
