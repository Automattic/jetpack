/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { isUserConnected as getIsUserConnected } from '../../../lib/connection';
import getMediaToken from '../../../lib/get-media-token';
import { MediaTokenProps } from '../../../lib/get-media-token/types';
/**
 * Types
 */
import {
	WPCOMRestAPIVideosGetEndpointRequestArguments,
	WPCOMRestAPIVideosGetEndpointResponseProps,
} from '../../../types';
import { UseVideoDataProps, UseVideoDataArgumentsProps, VideoDataProps } from './types';

const debug = debugFactory( 'videopress:video:use-video-data' );

const isUserConnected = getIsUserConnected();
/**
 * React hook to fetch the video data from the media library.
 *
 * @param {UseVideoDataArgumentsProps} args - Hook arguments object
 * @returns {UseVideoDataProps}               Hook API object.
 */
export default function useVideoData( {
	id,
	guid,
	skipRatingControl = false,
	maybeIsPrivate = false,
}: UseVideoDataArgumentsProps ): UseVideoDataProps {
	const [ videoData, setVideoData ] = useState< VideoDataProps >( {} );
	const [ isRequestingVideoData, setIsRequestingVideoData ] = useState( false );

	useEffect( () => {
		if ( ! isUserConnected ) {
			debug( 'User is not connected ❌' );
			return;
		}

		let gettingTokenAttempt = 0;

		/**
		 * Fetches the video videoData from the API.
		 *
		 * @param {string} token - The token to use in the request.
		 */
		async function fetchVideoItem( token: string | null = null ) {
			try {
				const params: WPCOMRestAPIVideosGetEndpointRequestArguments = {};

				// Try to anticipate the video privacy, based on the block attributes.
				let tokenData: MediaTokenProps;
				if ( maybeIsPrivate ) {
					tokenData = await getMediaToken( 'playback', { id, guid } );
				}

				// Add the token to the request if it exists.
				if ( token || tokenData?.token ) {
					params.metadata_token = token || tokenData.token;
				}

				// Add the birthdate to skip the rating check if it's required.
				if ( skipRatingControl ) {
					params.birth_day = '1';
					params.birth_month = '1';
					params.birth_year = '2000';
				}

				const requestArgs = Object.keys( params ).length
					? `?${ new URLSearchParams( params ).toString() }`
					: '';

				const response: WPCOMRestAPIVideosGetEndpointResponseProps = await apiFetch( {
					url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }${ requestArgs }`,
					credentials: 'omit',
					global: true,
				} );

				setIsRequestingVideoData( false );

				// pick filename from the source_url
				const filename = response.original?.split( '/' )?.at( -1 );

				setVideoData( {
					allow_download: response.allow_download,
					post_id: response.post_id,
					guid: response.guid,
					title: decodeEntities( response.title ),
					description: decodeEntities( response.description ),
					display_embed: response.display_embed,
					privacy_setting: response.privacy_setting,
					rating: response.rating,
					filename,
					tracks: response.tracks,
					is_private: response.is_private,
					private_enabled_for_site: response.private_enabled_for_site,
				} );
			} catch ( errorData ) {
				if ( errorData?.error === 'auth' ) {
					gettingTokenAttempt++;
					debug( 'Authenticating error. Trying again: %o', gettingTokenAttempt + '/3' );
					if ( gettingTokenAttempt > 3 ) {
						debug( 'Too many attempts to get token. Aborting.' );
						setIsRequestingVideoData( false );
						throw new Error( errorData?.message ?? errorData );
					}

					const tokenData = await getMediaToken( 'playback', { id, guid } );
					if ( ! tokenData?.token ) {
						debug( 'Token is missing. Aborting.' );
						setIsRequestingVideoData( false );
						return;
					}
					return fetchVideoItem( tokenData.token );
				}

				setIsRequestingVideoData( false );
				throw new Error( errorData?.message ?? errorData );
			}
		}

		if ( guid ) {
			setIsRequestingVideoData( true );
			fetchVideoItem();
		}
	}, [ id, guid ] );

	return { videoData, isRequestingVideoData };
}
