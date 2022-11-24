/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import getMediaToken from '../../../lib/get-media-token';
/**
 * Types
 */
import { WPCOMRestAPIVideosGetEndpointResponseProps } from '../../../types';
import { UseVideoDataProps, UseVideoDataArgumentsProps } from './types';

/**
 * React hook to fetch the video data from the media library.
 *
 * @param {UseVideoDataArgumentsProps} args - Hook arguments object
 * @returns {UseVideoDataProps}               Hook API object.
 */
export default function useVideoData( {
	id,
	guid,
}: UseVideoDataArgumentsProps ): UseVideoDataProps {
	const [ videoData, setVideoData ] = useState( {} );
	const [ isRequestingVideoData, setIsRequestingVideoData ] = useState( false );

	useEffect( () => {
		/**
		 * Fetches the video videoData from the API.
		 */
		async function fetchVideoItem() {
			try {
				const tokenData = await getMediaToken( 'playback', { id, guid } );
				const params = tokenData?.token
					? `?${ new URLSearchParams( { metadata_token: tokenData.token } ).toString() }`
					: '';

				const response: WPCOMRestAPIVideosGetEndpointResponseProps = await apiFetch( {
					url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }${ params }`,
					credentials: 'omit',
				} );

				setIsRequestingVideoData( false );

				// pick filename from the source_url
				const filename = response.original?.split( '/' )?.at( -1 );

				setVideoData( {
					guid: response.guid,
					title: response.title,
					description: response.description,
					allow_download: response.allow_download,
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
