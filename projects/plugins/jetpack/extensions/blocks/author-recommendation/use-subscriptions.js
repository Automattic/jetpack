import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

export default function useSubscriptions( { remove_user_blogs } ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ subscriptions, setSubscriptions ] = useState( [] );

	useEffect( () => {
		setIsLoading( true );
		setErrorMessage( null );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/following/mine', { remove_user_blogs } ),
			global: true,
			method: 'GET',
		} )
			.then( setSubscriptions )
			.catch( error => {
				if ( error.message ) {
					setErrorMessage( error.message ); // Message was already translated by the backend
				} else {
					setErrorMessage(
						__( 'Whoops, we have encountered an error. Please try again later.', 'jetpack' )
					);
				}
			} )
			.finally( () => {
				setIsLoading( false );
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ remove_user_blogs ] );

	return { isLoading, errorMessage, subscriptions };
}
