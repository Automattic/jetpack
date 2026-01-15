import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

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

type FormsQueryParams = {
	context: string;
	jetpack_forms_context: string;
	order: string;
	orderby: string;
	page: string;
	per_page: string;
	status: string;
	search?: string;
};

const toSortedSearchParams = ( queryParams: FormsQueryParams ): URLSearchParams => {
	const entries = Object.entries( queryParams );
	entries.sort( ( [ a ], [ b ] ) => ( a > b ? 1 : -1 ) );
	return new URLSearchParams( entries );
};

/**
 * Fetch Forms list records for the Forms dashboard table.
 *
 * @param {number} page    - Current page number.
 * @param {number} perPage - Items per page.
 * @param {string} search  - Search term.
 *
 * @return {UseFormsDataReturn} Forms list data for the current query.
 */
export default function useFormsData(
	page: number,
	perPage: number,
	search: string
): UseFormsDataReturn {
	const [ formsList, setFormsList ] = useState< FormListItem[] >( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );

	useEffect( () => {
		let isMounted = true;
		const queryParams: FormsQueryParams = {
			context: 'edit',
			jetpack_forms_context: 'dashboard',
			order: 'desc',
			orderby: 'modified',
			page: String( page ),
			per_page: String( perPage ),
			status: 'publish,draft,pending,future,private',
		};
		if ( search ) {
			queryParams.search = search;
		}
		// Keep query string ordering stable so apiFetch preloading keys match.
		const params = toSortedSearchParams( queryParams );

		setIsLoading( true );

		apiFetch( {
			path: `/wp/v2/jetpack-forms?${ params.toString() }`,
			parse: false,
		} )
			.then( async ( res: Response ) => {
				if ( ! isMounted ) {
					return;
				}
				const wpTotalItems = Number( res.headers.get( 'X-WP-Total' ) || 0 );
				const wpTotalPages = Number( res.headers.get( 'X-WP-TotalPages' ) || 0 );
				const data = ( await res.json() ) as JetpackFormRestItem[];

				setFormsList(
					( data || [] ).map( item => ( {
						id: item.id,
						title: decodeEntities( item.title?.rendered || '' ),
						status: item.status,
						modified: item.modified,
						entriesCount: item.entries_count ?? 0,
						editUrl: item.edit_url,
					} ) )
				);
				setTotalItems( wpTotalItems );
				setTotalPages( wpTotalPages );
				setIsLoading( false );
			} )
			.catch( () => {
				if ( ! isMounted ) {
					return;
				}
				setFormsList( [] );
				setTotalItems( 0 );
				setTotalPages( 0 );
				setIsLoading( false );
			} );

		return () => {
			isMounted = false;
		};
	}, [ page, perPage, search ] );

	return { records: formsList, isLoading, totalItems, totalPages };
}
