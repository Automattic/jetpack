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

/**
 * Build the query object for fetching Forms list records from core-data.
 *
 * @param page         - Current page number.
 * @param perPage      - Items per page.
 * @param search       - Search term.
 * @param status       - REST `status` query param (comma-separated list or single status).
 *
 * @param hasResponses - Filter by whether forms have responses ("true"/"false").
 * @return Query params for useEntityRecords / core-data.
 */
export function getFormsListQuery(
	page: number,
	perPage: number,
	search: string,
	status: string,
	hasResponses?: string
) {
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

	if ( hasResponses ) {
		queryParams.has_responses = hasResponses;
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
 * @param page         - Current page number.
 * @param perPage      - Items per page.
 * @param search       - Search term.
 * @param status       - REST `status` query param (comma-separated list or single status).
 *
 * @param hasResponses - Filter by whether forms have responses ("true"/"false").
 * @return Forms list data for the current query.
 */
export default function useFormsData(
	page: number,
	perPage: number,
	search: string,
	status: string,
	hasResponses?: string
): UseFormsDataReturn {
	const query = useMemo( () => {
		return getFormsListQuery( page, perPage, search, status, hasResponses );
	}, [ page, perPage, search, status, hasResponses ] );

	const {
		records: rawRecords,
		hasResolved,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'jetpack_form', query );

	const records = useMemo( () => {
		const seen = new Set< number >();
		const items: FormListItem[] = [];
		for ( const item of rawRecords || [] ) {
			const typedItem = item as JetpackFormRestItem;
			// Deduplicate records because core-data can momentarily return the same entity
			// twice during optimistic updates (e.g. when bulk-publishing forms).
			if ( seen.has( typedItem.id ) ) {
				continue;
			}
			seen.add( typedItem.id );
			items.push( {
				id: typedItem.id,
				title: decodeEntities( typedItem.title?.rendered || '' ),
				status: typedItem.status,
				modified: typedItem.modified,
				entriesCount: typedItem.entries_count ?? 0,
				editUrl: typedItem.edit_url,
			} );
		}
		return items;
	}, [ rawRecords ] );

	return {
		records,
		isLoading: ! hasResolved,
		totalItems: totalItems ?? 0,
		totalPages: totalPages ?? 0,
	};
}
