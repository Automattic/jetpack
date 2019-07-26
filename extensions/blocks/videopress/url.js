/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';

export const getVideoPressUrl = ( guid, { autoplay, controls, loop, muted, poster, preload } ) => {
	if ( ! guid ) {
		return null;
	}

	const options = {
		autoPlay: autoplay,
		controls,
		loop,
		muted,
		...( muted && { persistVolume: false } ),
		posterUrl: poster,
		preload,
	};
	return addQueryArgs( `https://videopress.com/v/${ guid }`, options );
};
