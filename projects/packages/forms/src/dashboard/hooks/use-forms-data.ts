import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

export type FormListItem = {
	id: number;
	title: string;
	status: string;
	modified: string;
	entriesCount: number;
	editUrl?: string;
};

type FormsListResponse = {
	items: FormListItem[];
	totalItems: number;
	totalPages: number;
	currentPage: number;
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
 * @param  page    - Current page number.
 * @param  perPage - Items per page.
 * @param  search  - Search term.
 *
 * @return {UseFormsDataReturn} Forms list data for the current query.
 */
export default function useFormsData(
	page: number,
	perPage: number,
	search: string
): UseFormsDataReturn {
	const [ records, setRecords ] = useState< FormListItem[] >( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );

	useEffect( () => {
		let isMounted = true;
		const params = new URLSearchParams();
		params.set( 'page', String( page ) );
		params.set( 'per_page', String( perPage ) );
		if ( search ) {
			params.set( 'search', search );
		}

		setIsLoading( true );

		apiFetch< FormsListResponse >( {
			path: `/jetpack-forms/v1/forms?${ params.toString() }`,
		} )
			.then( response => {
				if ( ! isMounted ) {
					return;
				}
				setRecords( response.items || [] );
				setTotalItems( response.totalItems || 0 );
				setTotalPages( response.totalPages || 0 );
				setIsLoading( false );
			} )
			.catch( () => {
				if ( ! isMounted ) {
					return;
				}
				setRecords( [] );
				setTotalItems( 0 );
				setTotalPages( 0 );
				setIsLoading( false );
			} );

		return () => {
			isMounted = false;
		};
	}, [ page, perPage, search ] );

	return { records, isLoading, totalItems, totalPages };
}
