export async function waitMediaReady( mediaElement ) {
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
			mediaElement.load();
		} );
	}
}

export const fullscreen = {
	enabled() {
		return (
			document.fullscreenEnabled ||
			document.webkitFullscreenEnabled ||
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled
		);
	},
	element() {
		return (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullScreenElement
		);
	},
	launch( element ) {
		const requestFullscreen =
			element.requestFullscreen ||
			element.webkitRequestFullScreen ||
			element.mozRequestFullScreen ||
			element.msRequestFullscreen;
		return requestFullscreen.call( element );
	},
	exit() {
		const exitFullscreen =
			document.exitFullscreen ||
			document.webkitExitFullscreen ||
			document.mozCancelFullScreen ||
			document.msExitFullscreen;
		return exitFullscreen.call( document );
	},
};
