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

	// Merge raw records with any local edits from editEntityRecord
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

	const [ counts, setCounts ] = useState( { inbox: 0, spam: 0, trash: 0 } );
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
	}, [ currentQuery?.search, currentQuery?.parent, currentQuery?.before, currentQuery?.after ] );

	return {
		totalItemsInbox: counts.inbox,
		totalItemsSpam: counts.spam,
		totalItemsTrash: counts.trash,
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
