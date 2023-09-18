import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function useRecommendations( enabled = false ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ recommendations, setRecommendations ] = useState( [] );
	const abortControllerRef = useRef();

	useEffect( () => {
		if ( ! enabled ) {
			setIsLoading( false );
			return;
		}

		setIsLoading( true );
		setErrorMessage( null );

		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current =
			typeof AbortController === 'undefined' ? undefined : new AbortController();

		apiFetch( {
			path: '/wpcom/v2/following/recommendations',
			global: true,
			method: 'GET',
			signal: abortControllerRef.current?.signal,
		} )
			.then( response => {
				if ( ! response.length ) {
					setErrorMessage(
						__(
							'No subscriptions found. You need to follow some sites in order to see results.',
							'jetpack'
						)
					);
				}
				setRecommendations( response );
			} )
			.catch( error => {
				if ( error.name === 'AbortError' ) {
					return;
				}

				if ( error.message ) {
					setErrorMessage( error.message ); // Message was already translated by the backend
				} else {
					setErrorMessage(
						__( 'Whoops, we have encountered an error. Please try again later.', 'jetpack' )
					);
				}
			} )
			.finally( () => {
				abortControllerRef.current = null;
				setIsLoading( false );
			} );
	}, [ enabled ] );

	return { isLoading, errorMessage, recommendations };
}
