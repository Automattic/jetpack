export default async function waitMediaReady( mediaElement, fullLoad = false ) {
	const elementTag = mediaElement.tagName.toLowerCase();
	if ( 'img' === elementTag ) {
		if ( mediaElement.complete ) {
			return;
		}
		await new Promise( resolve => {
			mediaElement.addEventListener( 'load', resolve, { once: true } );
		} );
	} else if ( 'video' === elementTag && mediaElement.poster ) {
		await new Promise( resolve => {
			mediaElement.addEventListener( 'loadeddata', resolve, { once: true } );
			mediaElement.load();
		} );
	} else if ( 'video' === elementTag || 'audio' === elementTag ) {
		const src = mediaElement.src;

		// only load the full video if it's on the same origin
		if ( fullLoad && src && src.startsWith( window.location.origin ) ) {
			mediaElement.src = '';
			const videoRequest = new Request( src );
			const requestHeaders = new Headers();
			if ( mediaElement.type ) {
				requestHeaders.append( 'Content-Type', mediaElement.type );
			}
			const response = await fetch( videoRequest, {
				method: 'GET',
				headers: requestHeaders,
				mode: 'no-cors',
				cache: 'default',
			} );
			const videoAsBlob = await response.blob();
			mediaElement.src = URL.createObjectURL( videoAsBlob );
		}
		if ( mediaElement.HAVE_ENOUGH_DATA === mediaElement.readyState ) {
			return;
		}
		await new Promise( resolve => {
			mediaElement.addEventListener( 'canplaythrough', resolve, { once: true } );
			mediaElement.load();
		} );
	}
}
