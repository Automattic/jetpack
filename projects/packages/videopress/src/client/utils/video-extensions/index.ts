const allowedVideoExtensionsAndMimetypes =
	window.jetpackVideoPressInitialState?.allowedVideoExtensions || {};

const allowedVideoExtensions = Object.keys( allowedVideoExtensionsAndMimetypes ).filter(
	// No .videopress file
	extension => extension !== 'videopress'
);

const fileInputExtensions = allowedVideoExtensions
	.map( extension => `.${ extension }` )
	.join( ',' );

export { allowedVideoExtensionsAndMimetypes, allowedVideoExtensions, fileInputExtensions };
