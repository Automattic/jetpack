import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { getSiteIcon } from './utils';

export default function useSubscriptions( { ignore_user_blogs } ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ subscriptions, setSubscriptions ] = useState( [] );
	const abortControllerRef = useRef();

	useEffect( () => {
		setIsLoading( true );
		setErrorMessage( null );

		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current =
			typeof AbortController === 'undefined' ? undefined : new AbortController();

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/following/mine', { ignore_user_blogs } ),
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
				// Add placeholder image if site icon is missing
				response = response.map( subscription => {
					subscription.site_icon = getSiteIcon( subscription.site_icon );
					return subscription;
				} );
				setSubscriptions( response );
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ignore_user_blogs ] );

	return { isLoading, errorMessage, subscriptions };
}
