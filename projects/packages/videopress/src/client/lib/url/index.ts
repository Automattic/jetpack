import { addQueryArgs } from '@wordpress/url';
import { VideoBlockAttributes, VideoGUID } from '../../block-editor/blocks/video/types';

const VIDEOPRESS_URL_ARGS = [
	'autoplay',
	'controls',
	'loop',
	'muted',
	'playsinline',
	'poster',
	'preload',
	'seekbarColor',
	'seekbarPlayedColor',
	'seekbarLoadingColor',
	'useAverageColor',
] as const;

type VideoPressUrlArgsProps = typeof VIDEOPRESS_URL_ARGS;
type VideoPressUrlArgProp = VideoPressUrlArgsProps[ number ];
type VideoPressUrlOptions = Pick< VideoBlockAttributes, VideoPressUrlArgProp >;

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
		...( preload !== '' && { preloadContent: preload } ),
		...( seekbarColor !== '' && { sbc: seekbarColor } ),
		...( seekbarPlayedColor !== '' && { sbpc: seekbarPlayedColor } ),
		...( seekbarLoadingColor !== '' && { sblc: seekbarLoadingColor } ),
		...( useAverageColor && { useAverageColor: true } ),
	};
	return addQueryArgs( `https://videopress.com/v/${ guid }`, options );
};

export const pickGUIDFromUrl: ( url: string ) => null | string = url => {
	if ( ! url || typeof url !== 'string' ) {
		return null;
	}

	/*
	 * http://videopress.com/v/<guid>
	 * http://videopress.com/embed/<guid>
	 * http://video.videopress.com/v/<guid>
	 * http://video.videopress.com/embed/<guid>
	 * http://videos.files.wordpress.com/<guid>/<filename>.<extension>
	 */
	const urlParts = url.match(
		/^https?:\/\/(?<host>video(?:\.word|s\.files\.word)?press\.com)(?:\/v|\/embed)?\/(?<guid>[a-zA-Z\d]{8})/
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

type BuildVideoPressURLProps = {
	url?: string;
	guid?: VideoGUID;
};

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
): BuildVideoPressURLProps {
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

	return {};
}

export const removeFileNameExtension = ( name: string ) => {
	return name.replace( /\.[^/.]+$/, '' );
};

/**
 * Return the VideoPress video URL
 * based on the privacy of the video.
 *
 * @param {VideoGUID} guid    - The VideoPress GUID.
 * @param {boolean} isPrivate - Whether the video is private or not.
 * @returns {string}            VideoPress URL.
 */
export function getVideoUrlBasedOnPrivacy( guid: VideoGUID, isPrivate: boolean ) {
	if ( isPrivate ) {
		return `https://video.wordpress.com/v/${ guid }`;
	}

	return `https://videopress.com/v/${ guid }`;
}

/**
 * Determines if a given URL is a VideoPress URL.
 *
 * @param {string} url - The URL to check.
 * @returns {boolean}    bool True if the URL is a VideoPress URL, false otherwise.
 */
export function isVideoPressUrl( url: string ): boolean {
	const pattern =
		/^https?:\/\/(?:(?:v(?:ideo)?\.wordpress\.com|videopress\.com)\/(?:v|embed)|v\.wordpress\.com)\/([a-z\d]{8})(\/|\b)/i;
	return pattern.test( url );
}
