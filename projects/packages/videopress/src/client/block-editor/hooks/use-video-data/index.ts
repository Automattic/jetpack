/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { isUserConnected as getIsUserConnected } from '../../../lib/connection';
import { fetchVideoItem } from '../../../lib/fetch-video-item';
/**
 * Types
 */
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
			debug( 'User is not connected' );
			return;
		}

		/**
		 * Fetches the video videoData from the API.
		 *
		 * @param {string} token - The token to use in the request.
		 */
		async function setFromVideo( token: string | null = null ) {
			try {
				const response = await fetchVideoItem( {
					guid,
					isPrivate: maybeIsPrivate,
					token,
					skipRatingControl,
				} );

				setIsRequestingVideoData( false );

				// pick filename from the source_url
				const filename = response.original?.split( '/' )?.at( -1 );

				setVideoData( {
					duration: response.duration,
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
				setIsRequestingVideoData( false );
				throw new Error( errorData?.message ?? errorData );
			}
		}

		if ( guid ) {
			setIsRequestingVideoData( true );
			setFromVideo();
		}
	}, [ id, guid ] );

	return { videoData, isRequestingVideoData };
}
