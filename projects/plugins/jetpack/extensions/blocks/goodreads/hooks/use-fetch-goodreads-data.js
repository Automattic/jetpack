/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import testEmbedUrl from '../../../shared/test-embed-url';

export default function useFetchGoodreadsData( input ) {
	const [ goodreadsUserId, setGoodreadsUserId ] = useState( false );
	const [ isFetchingData, setIsFetchingData ] = useState( false );
	const [ isError, setIsError ] = useState( false );
	const [ is404, setIs404 ] = useState( false );

	const fetchData = async goodreadsId => {
		if ( /\/author\//.test( input ) ) {
			const path = `/wpcom/v2/goodreads/user-id?id=${ goodreadsId }`;

			await apiFetch( {
				path,
				method: 'GET',
			} )
				.then( response => {
					setGoodreadsUserId( response );
				} )
				.catch( () => {
					setIs404( true );
				} )
				.finally( () => {
					setIsFetchingData( false );
				} );
		} else {
			testEmbedUrl( input )
				.then( response => {
					if ( response.endsWith( '/author' ) ) {
						setIs404( true );
					}

					setGoodreadsUserId( goodreadsId );
				} )
				.catch( () => {
					setIs404( true );
				} )
				.finally( () => {
					setIsFetchingData( false );
				} );
		}
	};

	useEffect( () => {
		// Needs to be reset because user can edit URLs.
		setIsError( false );
		setIs404( false );

		if ( input.length && ! /^(https?:\/\/)?(www\.)?goodreads\.com\/.*/.test( input ) ) {
			setIsError( true );
		}

		const regex = /\/(user|author)\/show\/(\d+)/;
		const goodreadsId = input.match( regex ) ? parseInt( input.match( regex )[ 2 ] ) : false;

		if ( input.length && ! goodreadsId ) {
			setIsError( true );
		}

		if ( ! isError && input.length ) {
			setIsFetchingData( true );
			fetchData( goodreadsId );
		}
	}, [ input, isError ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		isFetchingData,
		goodreadsUserId,
		isError: isError || is404,
	};
}
