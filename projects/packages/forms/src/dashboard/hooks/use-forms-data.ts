import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

export type FormListItem = {
	id: number;
	title: string;
	status: string;
	modified: string;
	entriesCount: number;
	editUrl?: string;
};

let lastFormsListQuery: Record< string, unknown > | null = null;

/**
 * Get the most recent Forms list query used by this module.
 *
 * This is used by other dashboard actions (e.g. status changes from outside the list)
 * to invalidate the exact `getEntityRecords` resolution key.
 *
 * @return The last query object, or null if none has been set yet.
 */
export function getLastFormsListQuery(): Record< string, unknown > | null {
	return lastFormsListQuery;
}

/**
 * Build the query object for fetching Forms list records from core-data.
 *
 * @param page    - Current page number.
 * @param perPage - Items per page.
 * @param search  - Search term.
 * @param status  - REST `status` query param (comma-separated list or single status).
 *
 * @return Query params for useEntityRecords / core-data.
 */
export function getFormsListQuery( page: number, perPage: number, search: string, status: string ) {
	const queryParams: Record< string, unknown > = {
		context: 'edit',
		jetpack_forms_context: 'dashboard',
		order: 'desc',
		orderby: 'modified',
		page,
		per_page: perPage,
		status,
	};

	if ( search ) {
		queryParams.search = search;
	}

	return queryParams;
}

type JetpackFormRestItem = {
	id: number;
	title?: { rendered?: string };
	status: string;
	modified: string;
	entries_count?: number;
	edit_url?: string;
};

type UseFormsDataReturn = {
	records: FormListItem[];
	isLoading: boolean;
	totalItems: number;
	totalPages: number;
};

/**
 * Fetch Forms list records for the Forms dashboard table.
 *
 * @param page    - Current page number.
 * @param perPage - Items per page.
 * @param search  - Search term.
 * @param status  - REST `status` query param (comma-separated list or single status).
 *
 * @return Forms list data for the current query.
 */
export default function useFormsData(
	page: number,
	perPage: number,
	search: string,
	status: string
): UseFormsDataReturn {
	const query = useMemo( () => {
		return getFormsListQuery( page, perPage, search, status );
	}, [ page, perPage, search, status ] );

	lastFormsListQuery = query;

	const {
		records: rawRecords,
		hasResolved,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'jetpack_form', query );

	const records = ( rawRecords || [] ).map( item => {
		const typedItem = item as JetpackFormRestItem;
		return {
			id: typedItem.id,
			title: decodeEntities( typedItem.title?.rendered || '' ),
			status: typedItem.status,
			modified: typedItem.modified,
			entriesCount: typedItem.entries_count ?? 0,
			editUrl: typedItem.edit_url,
		};
	} );

	return {
		records,
		isLoading: ! hasResolved,
		totalItems: totalItems ?? 0,
		totalPages: totalPages ?? 0,
	};
}
