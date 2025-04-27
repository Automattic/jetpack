import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { VideoBlockAttributes, VideoGUID } from '../../block-editor/blocks/video/types';

const VIDEOPRESS_URL_ARGS = [
	'autoPlay',
	'cover',
	'controls',
	'hd',
	'loop',
	'muted',
	'persistVolume',
	'playsinline',
	'posterUrl',
	'preloadContent',
	'sbc',
	'sbpc',
	'sblc',
	'resizeToParent',
	'useAverageColor',
] as const;

const ARG_TO_ATTRIBUTE_MAP = {
	autoPlay: 'autoplay',
	cover: 'cover',
	controls: 'controls',
	hd: 'hd',
	loop: 'loop',
	muted: 'muted',
	persistVolume: 'persistVolume',
	playsinline: 'playsinline',
	posterUrl: 'poster',
	preloadContent: 'preload',
	sbc: 'seekbarColor',
	sbpc: 'seekbarPlayedColor',
	sblc: 'seekbarLoadingColor',
	resizeToParent: 'resizeToParent',
	useAverageColor: 'useAverageColor',
};

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
	}: VideoBlockAttributes
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
 * @return {boolean | VideoGUID} Video GUID if the string is valid, false otherwise.
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
 * @param {string | VideoGUID}   value      - The VideoPress GUID or URL.
 * @param {VideoBlockAttributes} attributes - The VideoPress URL options.
 * @return {false | string}                  VideoPress URL if the string is valid, false otherwise.
 */
export function buildVideoPressURL(
	value: string | VideoGUID,
	attributes?: VideoBlockAttributes
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

/**
 * Search for a VideoPress video by filename in the media library
 *
 * @param {string}               fileName   - The name of the video file to search for
 * @param {VideoBlockAttributes} attributes - Optional VideoPress URL attributes
 * @return {Promise<BuildVideoPressURLProps | null>} The VideoPress URL and GUID if found, null otherwise
 */
export async function buildVideoPressVideoByFileName(
	fileName: string,
	attributes: VideoBlockAttributes = {}
): Promise< BuildVideoPressURLProps | null > {
	try {
		const results = await apiFetch< Array< { jetpack_videopress_guid?: string } > >( {
			path: `/wp/v2/media?mime_type=video&search=${ encodeURIComponent( fileName ) }`,
		} );

		const videoFile = results.find( item => item.jetpack_videopress_guid );

		if ( videoFile?.jetpack_videopress_guid ) {
			return {
				url: getVideoPressUrl( videoFile.jetpack_videopress_guid, attributes ),
				guid: videoFile.jetpack_videopress_guid,
			};
		}

		return null;
	} catch {
		return null;
	}
}

export const removeFileNameExtension = ( name: string ) => {
	return name.replace( /\.[^/.]+$/, '' );
};

/**
 * Return the VideoPress video URL
 * based on the privacy of the video.
 *
 * @param {VideoGUID} guid      - The VideoPress GUID.
 * @param {boolean}   isPrivate - Whether the video is private or not.
 * @return {string}            VideoPress URL.
 */
export function getVideoUrlBasedOnPrivacy( guid: VideoGUID, isPrivate: boolean ) {
	if ( isPrivate ) {
		return `https://video.wordpress.com/v/${ guid }`;
	}

	return `https://videopress.com/v/${ guid }`;
}

/**
 * Extract the video filename with extension from a URL
 *
 * @param {string} url - The URL containing the video filename
 * @return {string}    The video filename with extension, or empty string if not found
 */
export function getVideoNameFromUrl( url: string ): string {
	try {
		const urlObj = new URL( url );

		// Split the pathname by '/' and get the last segment
		const segments = urlObj.pathname.split( '/' );
		const fileName = segments[ segments.length - 1 ];

		return fileName || '';
	} catch {
		return '';
	}
}

/**
 * Determines if a given URL is a VideoPress URL.
 *
 * @param {string} url - The URL to check.
 * @return {boolean}    bool True if the URL is a VideoPress URL, false otherwise.
 */
export function isVideoPressUrl( url: string ): boolean {
	const pattern =
		/^https?:\/\/(?:(?:v(?:ideo)?\.wordpress\.com|videopress\.com)\/(?:v|embed)|v\.wordpress\.com)\/([a-z\d]{8})(\/|\b)/i;
	return pattern.test( url );
}

/**
 * Pick and map VideoPress block attributes from a VideoPress URL.
 *
 * @param {string} url - The VideoPress URL.
 * @return {VideoBlockAttributes}   VideoPress block attributes.
 */
export function pickVideoBlockAttributesFromUrl( url: string ): VideoBlockAttributes {
	let queryParams: URLSearchParams;
	try {
		queryParams = new URLSearchParams( new URL( url ).search );
	} catch {
		return {};
	}

	const parseBoolean = value => {
		if ( value === '1' || value === 'true' ) {
			return true;
		}
		if ( value === '0' || value === 'false' ) {
			return false;
		}
		return null;
	};

	const videoParams = VIDEOPRESS_URL_ARGS.reduce( ( accumulator, key ) => {
		const value = queryParams.get( key );
		if ( value !== null ) {
			const attributeName = ARG_TO_ATTRIBUTE_MAP[ key ];
			accumulator[ attributeName ] = [
				'autoPlay',
				'cover',
				'controls',
				'hd',
				'loop',
				'muted',
				'persistVolume',
				'playsinline',
				'resizeToParent',
				'useAverageColor',
			].includes( key )
				? parseBoolean( value )
				: value;
		}
		return accumulator;
	}, {} );

	return videoParams;
}
