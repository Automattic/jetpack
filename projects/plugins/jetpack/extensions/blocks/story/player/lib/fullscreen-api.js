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

export const launch = rootElement => {
	const requestFullscreen =
		rootElement.requestFullscreen ||
		rootElement.webkitRequestFullScreen ||
		rootElement.mozRequestFullScreen ||
		rootElement.msRequestFullscreen;
	return requestFullscreen.call( rootElement );
};

export const exit = () => {
	const exitFullscreen =
		document.exitFullscreen ||
		document.webkitExitFullscreen ||
		document.mozCancelFullScreen ||
		document.msExitFullscreen;
	return exitFullscreen.call( document );
};
