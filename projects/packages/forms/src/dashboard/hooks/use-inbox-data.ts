/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEntityRecords, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
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
	isLoadingCounts: boolean;
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
	const { setCurrentQuery, setSelectedResponses, setCounts } = useDispatch( dashboardStore );
	const urlStatus = searchParams.get( 'status' );
	const statusFilter = getStatusFilter( urlStatus );

	const {
		selectedResponsesCount,
		currentStatus,
		currentQuery,
		filterOptions,
		totalItemsInbox,
		totalItemsSpam,
		totalItemsTrash,
	} = useSelect(
		select => ( {
			selectedResponsesCount: select( dashboardStore ).getSelectedResponsesCount(),
			currentStatus: select( dashboardStore ).getCurrentStatus(),
			currentQuery: select( dashboardStore ).getCurrentQuery(),
			filterOptions: select( dashboardStore ).getFilters(),
			totalItemsInbox: select( dashboardStore ).getInboxCount(),
			totalItemsSpam: select( dashboardStore ).getSpamCount(),
			totalItemsTrash: select( dashboardStore ).getTrashCount(),
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
	} );

	const records = useSelect(
		select => {
			return ( rawRecords || [] ).map( record => {
				// Get the edited version of this record if it exists
				const editedRecord = select( coreDataStore ).getEditedEntityRecord(
					'postType',
					'feedback',
					( record as FormResponse ).id
				);
				return editedRecord || record;
			} ) as FormResponse[];
		},
		[ rawRecords ]
	);

	const [ isLoadingCounts, setIsLoadingCounts ] = useState( false );

	useEffect( () => {
		const fetchCounts = async () => {
			setIsLoadingCounts( true );
			const params: Record< string, unknown > = {};
			if ( currentQuery?.search ) {
				params.search = currentQuery.search;
			}
			if ( currentQuery?.parent ) {
				params.parent = currentQuery.parent;
			}
			if ( currentQuery?.before ) {
				params.before = currentQuery.before;
			}
			if ( currentQuery?.after ) {
				params.after = currentQuery.after;
			}
			const path = addQueryArgs( '/wp/v2/feedback/counts', params );
			const response = await apiFetch< { inbox: number; spam: number; trash: number } >( {
				path,
			} );
			setCounts( response );
			setIsLoadingCounts( false );
		};

		fetchCounts();
	}, [
		currentQuery?.search,
		currentQuery?.parent,
		currentQuery?.before,
		currentQuery?.after,
		setCounts,
	] );

	return {
		totalItemsInbox,
		totalItemsSpam,
		totalItemsTrash,
		records,
		isLoadingData: isLoadingRecordsData,
		isLoadingCounts,
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
