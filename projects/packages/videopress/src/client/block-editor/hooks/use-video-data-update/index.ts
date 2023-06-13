/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { WPComV2VideopressGetMetaEndpointResponseProps } from '../../../types';
import { VideoId } from '../../blocks/video/types';

/**
 * Hook to update the media data by hitting the VideoPress API.
 *
 * @param {VideoId} id - Media ID.
 * @returns {Function}  Update Promise handler.
 */
export default function useMediaDataUpdate( id: VideoId ) {
	const updateMediaItem = data => {
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id, ...data },
			} )
				.then( ( result: WPComV2VideopressGetMetaEndpointResponseProps ) => {
					if ( 200 !== result?.data ) {
						return reject( result );
					}
					resolve( result );
				} )
				.catch( reject );
		} );
	};

	return updateMediaItem;
}
