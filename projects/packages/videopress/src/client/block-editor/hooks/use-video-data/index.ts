/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../lib/get-media-token';
import { decodeEntities } from '../../../lib/url';
/**
 * Types
 */
import {
	WPCOMRestAPIVideosGetEndpointRequestArguments,
	WPCOMRestAPIVideosGetEndpointResponseProps,
} from '../../../types';
import { UseVideoDataProps, UseVideoDataArgumentsProps, VideoDataProps } from './types';

/**
 * React hook to fetch the video data from the media library.
 *
 * @param {UseVideoDataArgumentsProps} args - Hook arguments object
 * @returns {UseVideoDataProps}               Hook API object.
 */
export default function useVideoData( {
	id,
	guid,
	skipRatingChecking = false,
}: UseVideoDataArgumentsProps ): UseVideoDataProps {
	const [ videoData, setVideoData ] = useState< VideoDataProps >( {} );
	const [ isRequestingVideoData, setIsRequestingVideoData ] = useState( false );

	useEffect( () => {
		/**
		 * Fetches the video videoData from the API.
		 */
		async function fetchVideoItem() {
			try {
				const tokenData = await getMediaToken( 'playback', { id, guid } );
				const params: WPCOMRestAPIVideosGetEndpointRequestArguments = {};

				// Add the token to the request if it exists.
				if ( tokenData?.token ) {
					params.metadata_token = tokenData.token;
				}

				// Add the birthdate to skip the rating check if it's required.
				if ( skipRatingChecking ) {
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
				} );
			} catch ( error ) {
				setIsRequestingVideoData( false );
				throw new Error( error?.message ?? error );
			}
		}

		if ( guid ) {
			setIsRequestingVideoData( true );
			fetchVideoItem();
		}
	}, [ id, guid ] );

	return { videoData, isRequestingVideoData };
}
