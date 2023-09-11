/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Platform } from '@wordpress/element';
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

const isNative = Platform.isNative;

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
	const [ videoBelongToSite, setVideoBelongToSite ] = useState( true );

	useEffect( () => {
		// Skip check for native as only simple WordPress.com sites are supported in the current native block.
		// We can assume that all simple WordPress.com sites are connected.
		// TODO: Add native connection logic for Jetpack-connected sites in future iterations.
		if ( ! isUserConnected && ! isNative ) {
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
				let response;

				// Some video data is not available immediately after upload, so we retry a few times.
				for ( let retries = 0; retries < 5; retries++ ) {
					response = await fetchVideoItem( {
						guid,
						isPrivate: maybeIsPrivate,
						token,
						skipRatingControl,
					} );

					if ( response.duration ) {
						debug(
							`video duration available: ${ response.duration }, retried ${ retries } times`,
							response
						);
						break;
					}

					debug( `video duration not yet available, retrying (${ retries + 1 })`, response );
					await new Promise( resolve => setTimeout( resolve, 1500 ) );
				}

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

				// Check if the video belongs to the current site.
				try {
					const doesBelong: {
						'video-belong-to-site'?: boolean;
						body?: {
							'video-belong-to-site'?: boolean;
						};
					} = await apiFetch( {
						path: `/wpcom/v2/videopress/${ guid }/check-ownership/${ response.post_id }`,
						method: 'GET',
					} );

					// Response shape can change depending on the envelope mode.
					setVideoBelongToSite(
						typeof doesBelong?.[ 'video-belong-to-site' ] === 'boolean'
							? doesBelong[ 'video-belong-to-site' ]
							: !! doesBelong?.body?.[ 'video-belong-to-site' ]
					);
				} catch ( error ) {
					debug( 'Error checking if video belongs to site', error );
				}
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

	return { videoData, isRequestingVideoData, videoBelongToSite };
}
