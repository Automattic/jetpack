/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Custom hook to fetch forms data from the REST API.
 *
 * @param {object} queryArgs - Query arguments for the API request.
 * @return {object} Forms data and loading state.
 */
export default function useFormsData( queryArgs = {} ) {
	const [ forms, setForms ] = useState( [] );
	const [ isLoadingForms, setIsLoadingForms ] = useState( true );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );

	useEffect( () => {
		setIsLoadingForms( true );

		const fetchForms = async () => {
			try {
				const response = await apiFetch( {
					path: addQueryArgs( '/wp/v2/jetpack-forms', {
						...queryArgs,
						_fields: 'id,title,date,modified,link,content,meta',
					} ),
					parse: false, // We need to parse headers manually
				} );

				const data = await response.json();
				const total = parseInt( response.headers.get( 'X-WP-Total' ), 10 );
				const pages = parseInt( response.headers.get( 'X-WP-TotalPages' ), 10 );

				setForms( data );
				setTotalItems( total );
				setTotalPages( pages );
				setIsLoadingForms( false );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to fetch forms:', error );
				setForms( [] );
				setTotalItems( 0 );
				setTotalPages( 0 );
				setIsLoadingForms( false );
			}
		};

		fetchForms();
	}, [ JSON.stringify( queryArgs ) ] );

	return {
		forms,
		isLoadingForms,
		totalItems,
		totalPages,
	};
}
