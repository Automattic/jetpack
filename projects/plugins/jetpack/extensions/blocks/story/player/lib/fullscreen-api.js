export const enabled = () =>
	document.fullscreenEnabled ||
	document.webkitFullscreenEnabled ||
	document.mozFullScreenEnabled ||
	document.msFullscreenEnabled;

export const element = () =>
	document.fullscreenElement ||
	document.webkitFullscreenElement ||
	document.mozFullScreenElement ||
	document.msFullScreenElement;

export const launch = ( rootElement, onFullscreenExit ) => {
	const requestFullscreen =
		rootElement.requestFullscreen ||
		rootElement.webkitRequestFullScreen ||
		rootElement.mozRequestFullScreen ||
		rootElement.msRequestFullscreen;

	requestFullscreen.call( rootElement );

	if ( onFullscreenExit ) {
		const onFullscreenChange = () => {
			if ( ! document.fullscreenElement ) {
				document.removeEventListener( 'fullscreenchange', onFullscreenChange );
				onFullscreenExit();
			}
		};
		document.addEventListener( 'fullscreenchange', onFullscreenChange );
	}
};

export const exit = () => {
	const exitFullscreen =
		document.exitFullscreen ||
		document.webkitExitFullscreen ||
		document.mozCancelFullScreen ||
		document.msExitFullscreen;
	return exitFullscreen.call( document );
};
