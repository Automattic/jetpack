/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
/**
 * Types
 */
import { WPV2mediaGetEndpointResponseProps } from '../../../types';
import { VideoId } from '../../blocks/video/types';
import { UseVideoDataProps } from './types';

/**
 * React hook to fetch the video data from the media library.
 *
 * @param {VideoId}             id - The video id.
 * @returns {UseVideoDataProps}      Hook API object.
 */
export default function useVideoData( id: VideoId ): UseVideoDataProps {
	const [ videoData, setVideoData ] = useState( {} );
	const [ isRequestingVideoData, setIsRequestingVideoData ] = useState( false );

	useEffect( () => {
		/**
		 * Fetches the video videoData from the API.
		 */
		async function fetchVideoItem() {
			try {
				const response: WPV2mediaGetEndpointResponseProps = await apiFetch( {
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
