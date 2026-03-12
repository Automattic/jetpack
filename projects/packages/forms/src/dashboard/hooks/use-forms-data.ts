import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { getFormsListQuery } from './forms-data-cache';

// Re-export for consumers
export { invalidateFormsDataResolutions, getFormsListQuery } from './forms-data-cache';

export type FormListItem = {
	id: number;
	title: string;
	status: string;
	modified: string;
	entriesCount: number;
	editUrl?: string;
};

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
	const query = useMemo(
		() => getFormsListQuery( page, perPage, search, status ),
		[ page, perPage, search, status ]
	);

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
