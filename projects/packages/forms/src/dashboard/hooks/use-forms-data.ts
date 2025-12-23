/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

type FormsView = {
	search: string;
	page: number;
	perPage: number;
	order: 'asc' | 'desc';
	orderBy: string;
};

type FormRecord = {
	id: number;
	title: { rendered: string };
	status: string;
	modified: string;
	responses_count?: number;
	edit_link?: string;
	link?: string;
};

const DEFAULT_QUERY = {
	context: 'edit',
	status: 'publish,draft',
	_fields: 'id,title,modified,status,responses_count,edit_link,link',
};

interface UseFormsDataResult {
	records: FormRecord[];
	isLoading: boolean;
	totalItems: number;
	totalPages: number;
	error: string | null;
}

/**
 * Fetch reusable forms for the dashboard DataView.
 *
 * @param view - Current DataView state.
 * @return Hook result.
 */
export default function useFormsData( view: FormsView ): UseFormsDataResult {
	const [ records, setRecords ] = useState< FormRecord[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );

	const queryArgs = useMemo(
		() => ( {
			...DEFAULT_QUERY,
			order: view.order,
			orderby: view.orderBy,
			per_page: view.perPage,
			page: view.page,
			search: view.search || undefined,
		} ),
		[ view.order, view.orderBy, view.perPage, view.page, view.search ]
	);

	useEffect( () => {
		let isMounted = true;
		setIsLoading( true );
		setError( null );

		const path = addQueryArgs( '/wp/v2/jetpack-forms', queryArgs );

		apiFetch< Response >( { path, parse: false } )
			.then( async response => {
				const data: FormRecord[] = await response.json();

				if ( ! isMounted ) {
					return;
				}

				setRecords( data );
				setTotalItems( Number( response.headers.get( 'X-WP-Total' ) ) || data.length );
				setTotalPages( Number( response.headers.get( 'X-WP-TotalPages' ) ) || 1 );
			} )
			.catch( () => {
				if ( isMounted ) {
					setRecords( [] );
					setError( 'error' );
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoading( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ queryArgs ] );

	return { records, isLoading, totalItems, totalPages, error };
}
