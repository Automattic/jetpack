/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Platform } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import getMediaToken from '../get-media-token';
/**
 * Types
 */
import type { VideoGUID } from '../../block-editor/blocks/video/types';
import type {
	WPCOMRestAPIVideosGetEndpointRequestArguments,
	WPCOMRestAPIVideosGetEndpointResponseProps,
} from '../../types';
import type { MediaTokenProps } from '../get-media-token/types';

const isNative = Platform.isNative;

const debug = debugFactory( 'videopress:lib:fetch-video-item' );

/**
 * Fetches the video item from the v1.1/videos endpoint.
 *
 * @param {object} parameters                    - The function parameters.
 * @param {VideoGUID} parameters.guid            - The video GUID.
 * @param {boolean} parameters.isPrivate         - Whether the video is private.
 * @param {string} parameters.token              - The token to use in the request.
 * @param {boolean} parameters.skipRatingControl - Whether to skip the rating control.
 * @param {number} parameters.retries            - The number of retries.
 * @returns {WPCOMRestAPIVideosGetEndpointResponseProps} Props
 */
export async function fetchVideoItem( {
	guid,
	isPrivate,
	token = null,
	skipRatingControl = false,
	retries = 0,
}: {
	guid: VideoGUID;
	isPrivate: boolean;
	token?: string | null;
	skipRatingControl?: boolean;
	retries?: number;
} ): Promise< WPCOMRestAPIVideosGetEndpointResponseProps > {
	try {
		const params: WPCOMRestAPIVideosGetEndpointRequestArguments = skipRatingControl
			? {}
			: {
					birth_day: '1',
					birth_month: '1',
					birth_year: '2000',
			  };

		let tokenData: MediaTokenProps;
		if ( isPrivate && ! token ) {
			tokenData = await getMediaToken( 'playback', { guid } );
		}

		// Add the token to the request if it exists.
		if ( token || tokenData?.token ) {
			params.metadata_token = token || tokenData.token;
		}

		const requestArgs = Object.keys( params ).length
			? `?${ new URLSearchParams( params ).toString() }`
			: '';

		const endpoint = isNative
			? { path: `/rest/v1.1/videos/${ guid }${ requestArgs }` }
			: { url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }${ requestArgs }` };

		return await apiFetch( {
			...endpoint,
			credentials: 'omit',
			global: true,
		} );
	} catch ( errorData ) {
		debug( 'updating retry from', retries, 'to', retries + 1 );
		const updatedRetries = retries + 1;

		if ( updatedRetries > 2 ) {
			debug( 'Too many attempts to get video. Aborting.' );
			throw new Error( errorData?.message ?? errorData );
		}

		/*
		 * When the request fails because of an authentication error,
		 * try to get a new token and retry the request.
		 */
		if ( errorData?.error === 'auth' ) {
			debug( 'Authentication error. Reattempt %o', updatedRetries + '/3' );

			return fetchVideoItem( {
				guid,
				isPrivate: true,
				token: null,
				skipRatingControl,
				retries: updatedRetries,
			} );
		}

		if ( errorData?.message === 'Please supply the birthdate parameters.' ) {
			debug( 'Rating error. Reattempt %o', updatedRetries + '/3' );

			return fetchVideoItem( {
				guid,
				isPrivate: true,
				token: null,
				skipRatingControl: false,
				retries: updatedRetries,
			} );
		}

		throw new Error( errorData?.message ?? errorData );
	}
}
