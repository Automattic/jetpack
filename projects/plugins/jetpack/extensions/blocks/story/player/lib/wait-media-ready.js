export default async function waitMediaReady( mediaElement ) {
	const elementTag = mediaElement.tagName.toLowerCase();
	if ( 'img' === elementTag ) {
		if ( mediaElement.complete ) {
			return;
		}
		await new Promise( resolve => {
			mediaElement.addEventListener( 'load', resolve, { once: true } );
		} );
	} else if ( 'video' === elementTag || 'audio' === elementTag ) {
		if ( mediaElement.HAVE_ENOUGH_DATA === mediaElement.readyState ) {
			return;
		}
		await new Promise( resolve => {
			mediaElement.addEventListener( 'canplaythrough', resolve, { once: true } );
			// `canplaythrough` may not be triggered on firefox
			mediaElement.addEventListener( 'load', resolve, { once: true } );
			// In case the media has stopped loading, force a reload
			if (
				mediaElement.HAVE_NOTHING === mediaElement.readyState &&
				mediaElement.networkState !== mediaElement.NETWORK_LOADING
			) {
				mediaElement.load();
			}
		} );
	}
}
