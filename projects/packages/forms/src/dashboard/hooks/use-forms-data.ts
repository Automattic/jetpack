/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

export type FormSummary = {
	id: number;
	title: string;
	modified: string;
	responsesCount: number;
};

type UseFormsDataReturn = {
	records: FormSummary[];
	isLoading: boolean;
	totalItems: number;
	totalPages: number;
};

/**
 * Fetches and memoizes Forms (jetpack_form posts) data for the Forms dashboard view.
 *
 * @param {number} page    - Current page.
 * @param {number} perPage - Items per page.
 * @param {string} search  - Search term.
 *
 * @return {UseFormsDataReturn} Forms data for the current query.
 */
export default function useFormsData(
	page: number,
	perPage: number,
	search: string
): UseFormsDataReturn {
	const [ records, setRecords ] = useState< FormSummary[] >( [] );
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

		apiFetch< {
			items: FormSummary[];
			totalItems: number;
			totalPages: number;
		} >( {
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

	return {
		records,
		isLoading,
		totalItems,
		totalPages,
	};
}
