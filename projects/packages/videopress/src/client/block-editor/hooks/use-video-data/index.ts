/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
/**
 * Types
 */
import { wpV2mediaGetEndpointResponseProps } from '../../../types';
import { videoId } from '../../blocks/video/types';
import { useVideoDataProps } from './types';

/**
 * React hook to fetch the video data from the media library.
 *
 * @param {videoId}             id - The video id.
 * @returns {useVideoDataProps}      Hook API object.
 */
export default function useVideoData( id: videoId ): useVideoDataProps {
	const [ videoData, setVideoData ] = useState( {} );
	const [ isRequestingVideoData, setIsRequestingVideoData ] = useState( false );

	useEffect( () => {
		/**
		 * Fetches the video videoData from the API.
		 */
		async function fetchVideoItem() {
			try {
				const response: wpV2mediaGetEndpointResponseProps = await apiFetch( {
					path: `/wp/v2/media/${ id }`,
				} );

				setIsRequestingVideoData( false );
				if ( ! response?.jetpack_videopress ) {
					return;
				}

				setVideoData( response.jetpack_videopress );
			} catch ( error ) {
				setIsRequestingVideoData( false );
				throw new Error( error );
			}
		}

		if ( id ) {
			setIsRequestingVideoData( true );
			fetchVideoItem();
		}
	}, [ id ] );

	return { videoData, isRequestingVideoData };
}
