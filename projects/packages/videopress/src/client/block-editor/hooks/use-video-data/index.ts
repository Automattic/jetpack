/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
/**
 * Types
 */
import {
	WPCOMRestAPIVideosGetEndpointResponseProps,
	WPV2mediaGetEndpointResponseProps,
} from '../../../types';
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
			if ( guid ) {
				try {
					const response: WPCOMRestAPIVideosGetEndpointResponseProps = await apiFetch( {
						url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }`,
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
					} );
				} catch ( error ) {
					setIsRequestingVideoData( false );
					throw new Error( error );
				}
			}

			// Request by hitting the /wp/v2/media endpoint
			if ( id ) {
				try {
					const response: WPV2mediaGetEndpointResponseProps = await apiFetch( {
						path: `/wp/v2/media/${ id }`,
					} );

					setIsRequestingVideoData( false );
					if ( ! response?.jetpack_videopress ) {
						return;
					}

					// Pick filename from the source_url.
					const filename = response?.source_url?.split( '/' )?.at( -1 );

					// Pick isPrivate
					const is_private = response?.media_details?.videopress?.is_private;

					setVideoData( { ...response.jetpack_videopress, filename, is_private } );
				} catch ( error ) {
					setIsRequestingVideoData( false );
					throw new Error( error );
				}
			}
		}

		if ( id || guid ) {
			setIsRequestingVideoData( true );
			fetchVideoItem();
		}
	}, [ id, guid ] );

	return { videoData, isRequestingVideoData };
}
