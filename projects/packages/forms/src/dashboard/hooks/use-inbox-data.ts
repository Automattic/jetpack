/**
 * External dependencies
 */
import { useEntityRecords, store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useRef, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import { isCollectionFormatField } from '../components/inspector/utils.ts';
import { useDashboardSearchParams } from '../router/dashboard-search-params-context.tsx';
import { store as dashboardStore } from '../store/index.js';
/**
 * Types
 */
import type { FormResponse, ResponseField, ResponseFields } from '../../types/index.ts';

/**
 * Helper function to get the status filter to apply from the URL.
 * This is the only way to filter the data by `status`.
 *
 * Note: When Central Form Management (CFM) is enabled, the UI can expose a
 * "Folder" DataViews filter that syncs its value to the URL `status` param.
 *
 * @param {string} urlStatus - The current status from the URL.
 * @return {string} The status filter to apply.
 */
function getStatusFilter( urlStatus ) {
	// Only allow specific status values.
	const statusFilter = [ 'inbox', 'spam', 'trash' ].includes( urlStatus ) ? urlStatus : 'inbox';
	return statusFilter === 'inbox' ? 'draft,publish' : statusFilter;
}

const formatFieldName = fieldName => {
	const match = fieldName.match( /^(\d+_)?(.*)/i );
	if ( match ) {
		return match[ 2 ];
	}
	return fieldName;
};

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_isempty
const isEmpty = obj =>
	[ Object, Array ].includes( ( obj || {} ).constructor ) && ! Object.entries( obj || {} ).length;

const formatFieldValue = fieldValue => {
	if ( ! fieldValue || isEmpty( fieldValue ) ) {
		return '-';
	}
	if ( Array.isArray( fieldValue ) ) {
		return fieldValue.join( ', ' );
	}
	return fieldValue;
};

type UseInboxDataOptions = {
	status?: 'inbox' | 'spam' | 'trash';
};

const decodeValue = ( value: unknown ): unknown => {
	if ( typeof value === 'string' ) {
		return decodeEntities( value );
	}

	if ( Array.isArray( value ) ) {
		return value.map( v => ( typeof v === 'string' ? decodeEntities( v ) : v ) );
	}

	return value;
};

const hasOwn = ( obj: object, key: PropertyKey ): boolean =>
	Object.prototype.hasOwnProperty.call( obj, key );

const normalizeFieldsForDisplay = ( fields: ResponseField[] ): ResponseFields => {
	if ( ! fields || ! Array.isArray( fields ) ) {
		return Object.create( null ) as Record< string, unknown >;
	}

	if ( isCollectionFormatField( fields[ 0 ] ) ) {
		return fields;
	}

	return Object.entries( fields || {} ).reduce(
		( accumulator, [ key, value ] ) => {
			let _key = formatFieldName( key );
			let counter = 2;

			while ( hasOwn( accumulator, _key ) ) {
				_key = `${ formatFieldName( key ) } (${ counter })`;
				counter++;
			}

			accumulator[ _key ] = formatFieldValue( decodeValue( value ) );

			return accumulator;
		},
		Object.create( null ) as Record< string, unknown >
	);
};

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
 * @param {UseInboxDataOptions} options - Optional configuration.
 * @return {UseInboxDataReturn} The inbox related data.
 */
export default function useInboxData( options: UseInboxDataOptions = {} ): UseInboxDataReturn {
	const [ searchParams ] = useDashboardSearchParams();
	const { setCurrentQuery, setSelectedResponses } = useDispatch( dashboardStore );
	const urlStatus = options.status ?? searchParams.get( 'status' );
	const statusFilter = getStatusFilter( urlStatus );

	const {
		selectedResponsesCount,
		currentStatus,
		currentQuery,
		filterOptions,
		invalidRecords,
		hasPendingActions,
	} = useSelect(
		select => ( {
			selectedResponsesCount: select( dashboardStore ).getSelectedResponsesCount(),
			currentStatus: select( dashboardStore ).getCurrentStatus(),
			currentQuery: select( dashboardStore ).getCurrentQuery(),
			filterOptions: select( dashboardStore ).getFilters(),
			invalidRecords: select( dashboardStore ).getInvalidRecords(),
			hasPendingActions: select( dashboardStore ).hasPendingActions(),
		} ),
		[]
	);

	// Track the frozen invalid_ids for the current page
	// This prevents re-fetching when new items are marked as invalid
	const [ frozenInvalidIds, setFrozenInvalidIds ] = useState< number[] >( [] );
	const currentPageRef = useRef< number >( currentQuery?.page || 1 );

	// When page changes, freeze the current invalid records for this page
	useEffect( () => {
		const newPage = currentQuery?.page || 1;
		const hasUnreadFilter = currentQuery?.is_unread === true;

		// If we're navigating to a new page
		if ( newPage !== currentPageRef.current ) {
			currentPageRef.current = newPage;

			// Freeze invalid IDs when navigating to page 2+
			if ( hasUnreadFilter ) {
				setFrozenInvalidIds( Array.from( invalidRecords || new Set() ) );
			} else {
				// Clear frozen IDs on page 1 or when unread filter is off
				setFrozenInvalidIds( [] );
			}
		}
	}, [ currentQuery?.page, currentQuery?.is_unread, invalidRecords ] );

	// Use frozen invalid_ids for the query
	const queryWithInvalidIds = useMemo( () => {
		if ( frozenInvalidIds.length > 0 ) {
			return {
				...currentQuery,
				invalid_ids: frozenInvalidIds,
			};
		}
		return currentQuery;
	}, [ currentQuery, frozenInvalidIds ] );
	const {
		records: rawRecords,
		hasResolved,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'feedback', queryWithInvalidIds );

	const editedRecords = useSelect(
		select => {
			return ( rawRecords || [] ).map( record => {
				// Get the edited version of this record if it exists
				const editedRecord = select( coreDataStore ).getEditedEntityRecord(
					'postType',
					'feedback',
					( record as FormResponse ).id
				);
				return editedRecord || record;
			} );
		},
		[ rawRecords ]
	);

	/**
	 * Helper function to check if a status matches the current status filter.
	 *
	 * @param {string} status - The status to check.
	 * @param {string} filter - The status filter (e.g., 'draft,publish', 'trash', 'spam').
	 * @return {boolean} Whether the status matches the filter.
	 */
	const statusMatchesFilter = ( status: string, filter: string ): boolean => {
		// Handle comma-separated status filters (e.g., 'draft,publish' for inbox)
		if ( filter.includes( ',' ) ) {
			return filter.split( ',' ).includes( status );
		}

		return status === filter;
	};

	const records = useMemo( () => {
		// Filter records based on their effective status (considering optimistic edits)
		const filteredRecords = ( editedRecords || [] ).filter( ( record: FormResponse ) => {
			return statusMatchesFilter( record.status, statusFilter );
		} );

		return filteredRecords.map( record => {
			const formResponse = record as FormResponse;

			return {
				...formResponse,
				fields: normalizeFieldsForDisplay( formResponse.fields as ResponseField[] ),
			};
		} ) as FormResponse[];
	}, [ editedRecords, statusFilter ] );

	// Prepare query params for counts resolver
	const countsQueryParams = useMemo( () => {
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
		if ( currentQuery?.is_unread !== undefined ) {
			params.is_unread = currentQuery.is_unread;
		}

		return params;
	}, [ currentQuery ] );

	// Use the getCounts selector with resolver - this will automatically fetch and cache counts
	// The resolver ensures counts are only fetched once for the same query params across all hook instances
	const { totalItemsInbox, totalItemsSpam, totalItemsTrash } = useSelect(
		select => {
			// This will trigger the resolver if the counts for these queryParams aren't already cached
			select( dashboardStore ).getCounts( countsQueryParams );

			// Return the counts for the current query
			return {
				totalItemsInbox: select( dashboardStore ).getInboxCount( countsQueryParams ),
				totalItemsSpam: select( dashboardStore ).getSpamCount( countsQueryParams ),
				totalItemsTrash: select( dashboardStore ).getTrashCount( countsQueryParams ),
			};
		},
		[ countsQueryParams ]
	);

	// Show loading if:
	// 1. No records and query hasn't resolved yet (initial load)
	// 2. No filtered records but there are pending actions (optimistic update removed all items from current view)
	// Note: We check records.length (filtered) not rawRecords.length because optimistic updates
	// change status, so items are filtered out of records but still exist in rawRecords
	const isLoadingData =
		( ! rawRecords?.length && ! hasResolved ) || ( ! records?.length && hasPendingActions );

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
