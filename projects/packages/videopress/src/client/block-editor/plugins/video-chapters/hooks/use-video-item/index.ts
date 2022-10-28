/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { VideoId } from '../../types';
import { WPV2MediaAPIResponseProps } from './types';

/**
 * React hook to fetch the video item from the media library.
 *
 * @param {number|string} id - The video id.
 * @returns {Array} - The video item and a boolean indicating if the request is in progress.
 */
export default function useVideoItem( id: VideoId ): [ WPV2MediaAPIResponseProps, boolean ] {
	const [ item, setItem ] = useState( {} );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		/**
		 * Fetches the video item from the API.
		 */
		async function fetchVideoItem() {
			try {
				const response: WPV2MediaAPIResponseProps = await apiFetch( {
					path: `/wp/v2/media/${ id }`,
				} );

				setItem( response?.jetpack_videopress || {} );
				setLoading( false );
			} catch ( error ) {
				setLoading( false );
				throw new Error( error );
			}
		}

		if ( id ) {
			setLoading( true );
			fetchVideoItem();
		}
	}, [ id ] );

	return [ item, loading ];
}
