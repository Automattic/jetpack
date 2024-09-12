import { useEffect, useState } from '@wordpress/element';
import { getValidDomain } from './utils';

function useDebounce( string, delay = 100 ) {
	const [ debouncedString, setDebouncedString ] = useState( string );

	useEffect( () => {
		const handler = setTimeout( () => {
			setDebouncedString( string );
		}, delay );

		return () => {
			clearTimeout( handler );
		};
	}, [ string, delay ] );

	return debouncedString;
}

export function useSite( domain, enabled = true ) {
	const [ response, setResponse ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );

	const validDomain = getValidDomain( domain );
	const debouncedDomain = useDebounce( validDomain, 500 );

	useEffect( () => {
		setIsLoading( Boolean( enabled && debouncedDomain ) );
		if ( enabled && debouncedDomain ) {
			const abortController = new AbortController();

			fetch(
				`https://public-api.wordpress.com/rest/v1.1/sites/${ encodeURIComponent(
					debouncedDomain
				) }?force=wpcom`,
				{
					// This is awesome, it fetches a given URL once!
					cache: 'force-cache',
					signal: abortController.signal,
				}
			)
				.then( res => {
					if ( res.status === 200 ) {
						return res.json();
					} else if ( res.status === 404 ) {
						// Handle custom links here!
						// If wpcom returns 404, it means it's a valid non-wpcom domain.
					}
				} )
				.then( json => {
					setResponse( json );
					setIsLoading( false );
				} )
				.catch( e => {
					if ( e.name === 'AbortError' ) {
						return;
					}
					setError( e );
				} );

			return () => abortController.abort();
		}
	}, [ debouncedDomain, enabled ] );

	return { response, error, isLoading };
}
