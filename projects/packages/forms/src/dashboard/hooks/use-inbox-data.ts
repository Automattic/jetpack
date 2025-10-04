/**
 * External dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useSearchParams } from 'react-router';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../store';
/**
 * Types
 */
import type { FormResponse } from '../../types';

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
 * Interface for the return value of the useInboxData hook.
 */
interface UseInboxDataReturn {
	totalItemsInbox: number;
	totalItemsSpam: number;
	totalItemsTrash: number;
	records: FormResponse[];
	isLoadingData: boolean;
	totalItems: number;
	totalPages: number;
	selectedResponsesCount: number;
	setSelectedResponses: ( responses: string[] ) => void;
	statusFilter: string;
	currentStatus: string;
	currentQuery: Record< string, unknown >;
	setCurrentQuery: ( query: Record< string, unknown > ) => void;
	filterOptions: Record< string, unknown >;
}

const RESPONSE_FIELDS = [
	'id',
	'status',
	'date',
	'date_gmt',
	'author_name',
	'author_email',
	'author_url',
	'author_avatar',
	'ip',
	'entry_title',
	'entry_permalink',
	'has_file',
	'fields',
].join( ',' );

/**
 * Hook to get all inbox related data.
 *
 * @return {UseInboxDataReturn} The inbox related data.
 */
export default function useInboxData(): UseInboxDataReturn {
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
		records: rawRecords,
		isResolving: isLoadingRecordsData,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'feedback', {
		...currentQuery,
		_fields: RESPONSE_FIELDS,
	} );

	const records = ( rawRecords || [] ) as FormResponse[];

	const { isResolving: isLoadingInboxData, totalItems: totalItemsInbox = 0 } = useEntityRecords(
		'postType',
		'feedback',
		{
			page: 1,
			search: '',
			...currentQuery,
			status: 'publish,draft',
			per_page: 1,
			_fields: 'id',
		}
	);

	const { isResolving: isLoadingSpamData, totalItems: totalItemsSpam = 0 } = useEntityRecords(
		'postType',
		'feedback',
		{
			page: 1,
			search: '',
			...currentQuery,
			status: 'spam',
			per_page: 1,
			_fields: 'id',
		}
	);

	const { isResolving: isLoadingTrashData, totalItems: totalItemsTrash = 0 } = useEntityRecords(
		'postType',
		'feedback',
		{
			page: 1,
			search: '',
			...currentQuery,
			status: 'trash',
			per_page: 1,
			_fields: 'id',
		}
	);

	return {
		totalItemsInbox,
		totalItemsSpam,
		totalItemsTrash,
		records,
		isLoadingData:
			isLoadingRecordsData || isLoadingInboxData || isLoadingSpamData || isLoadingTrashData,
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
