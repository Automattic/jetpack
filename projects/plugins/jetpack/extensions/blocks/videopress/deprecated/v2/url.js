import { addQueryArgs } from '@wordpress/url';

export const getVideoPressUrl = ( guid, { autoplay, controls, loop, muted, poster, preload } ) => {
	if ( ! guid ) {
		return null;
	}

	// In order to have a cleaner URL, we only set the options differing from the default VideoPress player settings:
	// - Autoplay: Turned off by default.
	// - Controls: Turned on by default.
	// - Loop: Turned off by default.
	// - Muted: Turned off by default.
	// - Poster: No image by default.
	// - Preload: None by default.
	const options = {
		...( autoplay && { autoPlay: true } ),
		...( ! controls && { controls: false } ),
		...( loop && { loop: true } ),
		...( muted && { muted: true, persistVolume: false } ),
		...( poster && { posterUrl: poster } ),
		...( preload !== 'none' && { preloadContent: preload } ),
	};
	return addQueryArgs( `https://videopress.com/v/${ guid }`, options );
};
