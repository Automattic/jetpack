/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEntityRecords, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
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
	const { setCurrentQuery, setSelectedResponses } = useDispatch( dashboardStore );
	const urlStatus = searchParams.get( 'status' );
	const statusFilter = getStatusFilter( urlStatus );

	const {
		selectedResponsesCount,
		currentStatus,
		currentQuery,
		filterOptions,
		countsInvalidationKey,
	} = useSelect(
		select => ( {
			selectedResponsesCount: select( dashboardStore ).getSelectedResponsesCount(),
			currentStatus: select( dashboardStore ).getCurrentStatus(),
			currentQuery: select( dashboardStore ).getCurrentQuery(),
			filterOptions: select( dashboardStore ).getFilters(),
			countsInvalidationKey: select( dashboardStore ).getCountsInvalidationKey(),
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

	// Fetch counts using the optimized endpoint
	const [ counts, setCounts ] = useState< { inbox: number; spam: number; trash: number } | null >(
		null
	);
	const [ isLoadingCounts, setIsLoadingCounts ] = useState( true );

	const countsQuery = useMemo( () => {
		const query: Record< string, unknown > = {};
		if ( currentQuery?.search ) {
			query.search = currentQuery.search;
		}
		if ( currentQuery?.parent ) {
			query.parent = currentQuery.parent;
		}
		if ( currentQuery?.before ) {
			query.before = currentQuery.before;
		}
		if ( currentQuery?.after ) {
			query.after = currentQuery.after;
		}
		return query;
	}, [ currentQuery?.search, currentQuery?.parent, currentQuery?.before, currentQuery?.after ] );

	useEffect( () => {
		let isCancelled = false;
		setIsLoadingCounts( true );

		const path = addQueryArgs( '/wp/v2/feedback/counts', countsQuery );

		apiFetch< { inbox: number; spam: number; trash: number } >( { path } )
			.then( results => {
				if ( ! isCancelled ) {
					setCounts( results );
					setIsLoadingCounts( false );
				}
			} )
			.catch( () => {
				if ( ! isCancelled ) {
					setIsLoadingCounts( false );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ countsQuery, countsInvalidationKey ] );

	const totalItemsInbox = counts?.inbox ?? 0;
	const totalItemsSpam = counts?.spam ?? 0;
	const totalItemsTrash = counts?.trash ?? 0;

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
