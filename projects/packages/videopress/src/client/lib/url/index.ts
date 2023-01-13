import { addQueryArgs } from '@wordpress/url';
import { VideoBlockAttributes, VideoGUID } from '../../block-editor/blocks/video/types';

type VideoPressUrlOptions = Pick<
	VideoBlockAttributes,
	| 'autoplay'
	| 'controls'
	| 'loop'
	| 'muted'
	| 'playsinline'
	| 'poster'
	| 'preload'
	| 'seekbarColor'
	| 'seekbarPlayedColor'
	| 'seekbarLoadingColor'
	| 'useAverageColor'
>;

export const getVideoPressUrl = (
	guid: string,
	{
		autoplay,
		controls,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarPlayedColor,
		seekbarLoadingColor,
		useAverageColor,
	}: VideoPressUrlOptions
) => {
	if ( ! guid ) {
		return null;
	}

	// In order to have a cleaner URL, we only set the options differing from the default VideoPress player settings:
	// - Autoplay: Turned off by default.
	// - Controls: Turned on by default.
	// - Loop: Turned off by default.
	// - Muted: Turned off by default.
	// - Plays Inline: Turned off by default.
	// - Poster: No image by default.
	// - Preload: Metadata by default.
	// - SeekbarColor: No color by default.
	// - SeekbarPlayerColor: No color by default.
	// - SeekbarLoadingColor: No color by default.
	// - UseAverageColor: Turned on by default.
	const options = {
		resizeToParent: true,
		cover: true,
		...( autoplay && { autoPlay: true } ),
		...( ! controls && { controls: false } ),
		...( loop && { loop: true } ),
		...( muted && { muted: true, persistVolume: false } ),
		...( playsinline && { playsinline: true } ),
		...( poster && { posterUrl: poster } ),
		...( preload !== 'none' && { preloadContent: preload } ),
		...( seekbarColor !== '' && { sbc: seekbarColor } ),
		...( seekbarPlayedColor !== '' && { sbpc: seekbarPlayedColor } ),
		...( seekbarLoadingColor !== '' && { sblc: seekbarLoadingColor } ),
		...( useAverageColor && { useAverageColor: true } ),
	};
	return addQueryArgs( `https://videopress.com/v/${ guid }`, options );
};

export const pickGUIDFromUrl: ( url: string ) => null | string = url => {
	if ( ! url ) {
		return null;
	}

	const urlParts = url.match(
		/^https?:\/\/(?<host>video(?:\.word)?press\.com)\/(?:v|embed)\/(?<guid>[a-zA-Z\d]{8})/
	);

	if ( ! urlParts?.groups?.guid ) {
		return null;
	}

	return urlParts.groups.guid;
};

/**
 * Check if a string is a valid VideoPress GUID.
 *
 * @param {string} value - The string to check.
 * @returns {boolean | VideoGUID} Video GUID if the string is valid, false otherwise.
 */
export function isVideoPressGuid( value: string ): boolean | VideoGUID {
	const guid = value.match( /^[a-zA-Z\d]{8}$/ );
	if ( ! guid ) {
		return false;
	}

	return guid[ 0 ];
}

/**
 * Build a VideoPress URL from a VideoPress GUID or a VideoPress URL.
 * The function returns an { url, guid } object, or false.
 *
 * @param {string | VideoGUID} value        - The VideoPress GUID or URL.
 * @param {VideoPressUrlOptions} attributes - The VideoPress URL options.
 * @returns {false | string}                  VideoPress URL if the string is valid, false otherwise.
 */
export function buildVideoPressURL(
	value: string | VideoGUID,
	attributes?: VideoPressUrlOptions
): false | { url: string; guid: VideoGUID } {
	const isGuidValue = isVideoPressGuid( value );
	if ( isGuidValue ) {
		if ( ! attributes ) {
			return { url: `https://videopress.com/v/${ value }`, guid: value };
		}

		return { url: getVideoPressUrl( value, attributes ), guid: value };
	}

	const isGuidFromUrl = pickGUIDFromUrl( value );
	if ( isGuidFromUrl ) {
		return { url: value, guid: isGuidFromUrl };
	}

	return false;
}
