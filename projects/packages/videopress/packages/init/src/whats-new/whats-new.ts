// The channel VideoPress publishes to, from PHP.
const CHANNEL = 'videopress';

// The slug of the VideoPress page.
const PAGE = 'jetpack-videopress';

/**
 * Show the What's new surface on the VideoPress pages, while its feature flag is on.
 *
 * Imported on demand and never awaited, so the surface stays out of the first render. A load
 * that fails leaves the page without it.
 */
export function showWhatsNew(): void {
	const isEnabled =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' &&
		JPVIDEOPRESS_INITIAL_STATE?.features?.whatsNew;

	if ( ! isEnabled ) {
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
