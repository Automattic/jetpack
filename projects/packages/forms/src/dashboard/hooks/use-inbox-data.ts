/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
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
	} = useEntityRecords( 'postType', 'feedback', currentQuery );

	const records = ( rawRecords || [] ) as FormResponse[];

	// Use optimized counts endpoint instead of 3 separate queries.
	const [ counts, setCounts ] = useState( { inbox: 0, spam: 0, trash: 0 } );
	const [ isLoadingCounts, setIsLoadingCounts ] = useState( true );

	useEffect( () => {
		setIsLoadingCounts( true );
		apiFetch< { inbox: number; spam: number; trash: number } >( {
			path: '/wp/v2/feedback/counts',
		} )
			.then( response => {
				setCounts( response );
				setIsLoadingCounts( false );
			} )
			.catch( () => {
				setIsLoadingCounts( false );
			} );
	}, [ currentQuery ] );

	return {
		totalItemsInbox: counts.inbox,
		totalItemsSpam: counts.spam,
		totalItemsTrash: counts.trash,
		records,
		isLoadingData: isLoadingRecordsData || isLoadingCounts,
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
