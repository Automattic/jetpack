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
	// Data
	const items = useSelect( select => select( STORE_ID ).getVideos() );
	const search = '';
	const uploadedVideoCount = useSelect( select => select( STORE_ID ).getUploadedVideoCount() );
	const isFetching = useSelect( select => select( STORE_ID ).getIsFetching() );
	const isFetchingUploadedVideoCount = useSelect( select =>
		select( STORE_ID ).getIsFetchingUploadedVideoCount()
	);
	const query = useSelect( select => select( STORE_ID ).getVideosQuery() || {} );
	const pagination = useSelect( select => select( STORE_ID ).getPagination() );

	return {
		items,
		search,
		uploadedVideoCount,
		isFetching,
		isFetchingUploadedVideoCount,
		...query,
		...pagination,
		// Handlers
		setPage: page => dispatch( STORE_ID ).setVideosQuery( { page } ),
		setSearch: querySearch =>
			dispatch( STORE_ID ).setVideosQuery( { search: querySearch, page: 1 } ),
	};
}
