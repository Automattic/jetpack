/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
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

	const queryArgs = useMemo( () => {
		return {
			...currentQuery,
			context: 'view',
			_fields: RESPONSE_FIELDS,
		};
	}, [ currentQuery ] );

	const countsQueryKey = useMemo( () => {
		return JSON.stringify( {
			status: statusFilter,
			parent: currentQuery?.parent,
			search: currentQuery?.search,
			after: currentQuery?.after,
			before: currentQuery?.before,
		} );
	}, [
		statusFilter,
		currentQuery?.parent,
		currentQuery?.search,
		currentQuery?.after,
		currentQuery?.before,
	] );

	const {
		records: rawRecords,
		isResolving: isResolvingRecords,
		hasResolved,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'feedback', queryArgs );

	const records = useMemo( () => ( rawRecords || [] ) as FormResponse[], [ rawRecords ] );

	const isInitialQuery = useMemo( () => {
		const DEFAULT_QUERY = {
			status: 'draft,publish',
			page: 1,
			per_page: 20,
			orderby: 'date',
			order: 'desc',
		};
		const hasExtraFilters = Boolean(
			currentQuery?.search || currentQuery?.parent || currentQuery?.after || currentQuery?.before
		);
		if ( hasExtraFilters ) {
			return false;
		}
		return Object.entries( DEFAULT_QUERY ).every( ( [ key, value ] ) => {
			return ( currentQuery?.[ key ] ?? value ) === value;
		} );
	}, [ currentQuery ] );

	const preloadedData = useMemo( () => {
		if ( typeof window === 'undefined' || ! isInitialQuery ) {
			return undefined;
		}
		const globalWindow = window as unknown as {
			jpFormsInitialResponses?: Record<
				string,
				{ body?: unknown; headers?: Record< string, string > }
			>;
		};
		const source = globalWindow.jpFormsInitialResponses;
		if ( ! source ) {
			return undefined;
		}
		const entry = source.default ?? source.locale ?? Object.values( source )[ 0 ];
		if ( ! entry ) {
			return undefined;
		}
		const headers = entry.headers ?? {};
		const totalItemsHeader = headers[ 'X-WP-Total' ] ?? headers[ 'x-wp-total' ];
		const totalPagesHeader = headers[ 'X-WP-TotalPages' ] ?? headers[ 'x-wp-totalpages' ];
		return {
			records: Array.isArray( entry.body ) ? ( entry.body as FormResponse[] ) : [],
			totalItems: totalItemsHeader ? Number( totalItemsHeader ) : undefined,
			totalPages: totalPagesHeader ? Number( totalPagesHeader ) : undefined,
		};
	}, [ isInitialQuery ] );

	const preloadedRecords = useMemo( () => preloadedData?.records ?? [], [ preloadedData ] );
	const [ cachedRecords, setCachedRecords ] = useState< FormResponse[] >( preloadedRecords );
	const hasCachedRecords = cachedRecords.length > 0;

	useEffect( () => {
		if ( preloadedRecords.length && ! hasCachedRecords ) {
			setCachedRecords( preloadedRecords );
		}
	}, [ preloadedRecords, hasCachedRecords ] );

	useEffect( () => {
		if ( records.length ) {
			setCachedRecords( records );
		}
	}, [ records ] );

	const shouldUseCacheForCurrentQuery = isInitialQuery;
	const fallbackRecords = shouldUseCacheForCurrentQuery ? cachedRecords : [];
	const effectiveRecords = records.length ? records : fallbackRecords;
	const effectiveTotalItems =
		typeof totalItems === 'number'
			? totalItems
			: preloadedData?.totalItems ?? effectiveRecords.length;
	const effectiveTotalPages =
		typeof totalPages === 'number' ? totalPages : preloadedData?.totalPages ?? 0;

	const suppressSpinner = isInitialQuery && hasCachedRecords;
	const isQueryPending = ! hasResolved || isResolvingRecords;

	// Use optimized counts endpoint instead of 3 separate queries.
	const [ counts, setCounts ] = useState( { inbox: 0, spam: 0, trash: 0 } );
	const [ isLoadingCounts, setIsLoadingCounts ] = useState( true );

	useEffect( () => {
		let isMounted = true;

		const fetchCounts = async () => {
			setIsLoadingCounts( true );
			try {
				const response = await apiFetch< { inbox: number; spam: number; trash: number } >( {
					path: '/wp/v2/feedback/counts',
				} );
				if ( isMounted ) {
					setCounts( response );
				}
			} catch {
				// Silently ignore failures so the UI can continue rendering.
			} finally {
				if ( isMounted ) {
					setIsLoadingCounts( false );
				}
			}
		};

		fetchCounts();

		return () => {
			isMounted = false;
		};
	}, [ countsQueryKey, totalItems ] );

	return {
		totalItemsInbox: counts.inbox,
		totalItemsSpam: counts.spam,
		totalItemsTrash: counts.trash,
		records: effectiveRecords,
		isLoadingData: isQueryPending && ! records.length && ! suppressSpinner,
		isLoadingCounts,
		totalItems: effectiveTotalItems,
		totalPages: effectiveTotalPages,
		selectedResponsesCount,
		setSelectedResponses,
		statusFilter,
		currentStatus,
		currentQuery,
		setCurrentQuery,
		filterOptions,
	};
}
