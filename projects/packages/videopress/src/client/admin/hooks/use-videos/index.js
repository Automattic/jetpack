/**
 * External dependencies
 */
import { dispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';

/**
 * React custom hook to get the videos.
 *
 * @returns {object} videos
 */
export default function useVideos() {
	return {
		// Data
		items: useSelect( select => select( STORE_ID ).getVideos(), [] ),
		...useSelect( select => select( STORE_ID ).getVideosQuery() || {} ),
		...useSelect( select => select( STORE_ID ).getPagination(), [] ),

		// Setters
		setPage: page => dispatch( STORE_ID ).setVideosQuery( { page } ),

		setSearch: search => dispatch( STORE_ID ).setVideosQuery( { search, page: 1 } ),
	};
}
