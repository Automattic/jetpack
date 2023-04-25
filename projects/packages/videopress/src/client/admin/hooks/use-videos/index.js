/**
 * External dependencies
 */
import { dispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/constants';

/**
 * React custom hook to get the videos.
 *
 * @returns {object} videos
 */
export default function useVideos() {
	// Data
	const items = useSelect( select => select( STORE_ID ).getVideos() );
	const uploading = useSelect( select => select( STORE_ID ).getUploadingVideos() );
	const isUploading = uploading.length > 0;
	const search = '';
	const uploadedVideoCount = useSelect( select => select( STORE_ID ).getUploadedVideoCount() );
	const isFetching = useSelect( select => select( STORE_ID ).getIsFetching() );
	const isFetchingUploadedVideoCount = useSelect( select =>
		select( STORE_ID ).getIsFetchingUploadedVideoCount()
	);
	const firstUploadedVideoId = useSelect( select => select( STORE_ID ).getFirstUploadedVideoId() );
	const firstVideoProcessed = useSelect( select => select( STORE_ID ).getFirstVideoProcessed() );
	const dismissedFirstVideoPopover = useSelect( select =>
		select( STORE_ID ).getDismissedFirstVideoPopover()
	);
	const query = useSelect( select => select( STORE_ID ).getVideosQuery() || {} );
	const pagination = useSelect( select => select( STORE_ID ).getPagination() );
	const storageUsed = useSelect( select => select( STORE_ID ).getStorageUsed(), [] );
	const filter = useSelect( select => select( STORE_ID ).getVideosFilter() );

	return {
		items,
		uploading,
		isUploading,
		search,
		filter,
		uploadedVideoCount,
		isFetching,
		isFetchingUploadedVideoCount,
		firstUploadedVideoId,
		firstVideoProcessed,
		dismissedFirstVideoPopover,
		...query,
		...pagination,
		...storageUsed,

		// Handlers
		setPage: page => dispatch( STORE_ID ).setVideosQuery( { page } ),
		setSearch: querySearch => dispatch( STORE_ID ).setVideosQuery( { search: querySearch } ),
		setFilter: dispatch( STORE_ID ).setVideosFilter,
	};
}

export const useLocalVideos = () => {
	// Data
	const items = useSelect( select => select( STORE_ID ).getLocalVideos() );

	const uploadedLocalVideoCount = useSelect( select =>
		select( STORE_ID ).getUploadedLocalVideoCount()
	);

	const isFetching = useSelect( select => select( STORE_ID ).getIsFetchingLocalVideos() );
	const query = useSelect( select => select( STORE_ID ).getLocalVideosQuery() || {} );
	const pagination = useSelect( select => select( STORE_ID ).getLocalPagination() );

	return {
		// Data
		items,
		uploadedLocalVideoCount,
		isFetching,
		...query,
		...pagination,

		// Handlers
		setPage: page => dispatch( STORE_ID ).setLocalVideosQuery( { page } ),
	};
};

/**
 * React custom hook to get the videos query.
 *
 * @returns {object} search query information
 */
export const useVideosQuery = () => {
	// Data
	const query = useSelect( select => select( STORE_ID ).getVideosQuery() || {} );
	return query;
};
