import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useSearchParams } from 'react-router';
import { store as dashboardStore } from '../store';

/**
 * Helper function to get the status filter to apply from the URL.
 * This is the only way to filter the data by `status` as intentionally
 * we don't want to have a `status` filter in the UI.
 *
 * @param {string} urlStatus - The current status from the URL.
 * @return {string} The status filter to apply.
 */
function getStatusFilter( urlStatus ) {
	// Only allow specific status values.
	const statusFilter = [ 'inbox', 'spam', 'trash' ].includes( urlStatus ) ? urlStatus : 'inbox';
	return statusFilter === 'inbox' ? 'draft,publish' : statusFilter;
}

/**
 * Hook to get the total number of form responses for each status.
 *
 * @return {object} The total number of form responses for each status.
 */
export default function useInboxData() {
	const [ searchParams ] = useSearchParams();
	const { setCurrentQuery, setSelectedResponses } = useDispatch( dashboardStore );
	const urlStatus = searchParams.get( 'status' );
	const statusFilter = getStatusFilter( urlStatus );

	const { selectedResponsesCount, currentStatus, currentQuery, filterOptions } = useSelect(
		select => ( {
			selectedResponsesCount: select( dashboardStore ).getSelectedResponsesCount(),
			currentStatus: select( dashboardStore ).getCurrentStatus(),
			currentQuery: select( dashboardStore ).getCurrentQuery(),
			filterOptions: select( dashboardStore ).getFilters(),
		} ),
		[]
	);

	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'feedback', currentQuery );

	const { totalItems: totalItemsInbox } = useEntityRecords( 'postType', 'feedback', {
		page: 1,
		search: '',
		...currentQuery,
		status: 'publish,draft',
		per_page: 1,
		_fields: 'id',
	} );

	const { totalItems: totalItemsSpam } = useEntityRecords( 'postType', 'feedback', {
		page: 1,
		search: '',
		...currentQuery,
		status: 'spam',
		per_page: 1,
		_fields: 'id',
	} );

	const { totalItems: totalItemsTrash } = useEntityRecords( 'postType', 'feedback', {
		page: 1,
		search: '',
		...currentQuery,
		status: 'trash',
		per_page: 1,
		_fields: 'id',
	} );

	return {
		totalItemsInbox,
		totalItemsSpam,
		totalItemsTrash,
		records,
		isLoadingData,
		totalItems,
		totalPages,
		selectedResponsesCount,
		setSelectedResponses,
		statusFilter,
		currentStatus,
		currentQuery,
		setCurrentQuery,
		filterOptions,
	};
}
