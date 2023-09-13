import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { checkIfValidDomain } from './utils';

const cache = {};
export default function useGetSiteDetails( siteURL ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ siteDetails, setSiteDetails ] = useState( null );
	const abortControllerRef = useRef();

	useEffect( () => {
		setIsLoading( true );
		setErrorMessage( null );

		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current =
			typeof AbortController === 'undefined' ? undefined : new AbortController();

		if ( ! checkIfValidDomain( siteURL ) ) {
			setSiteDetails( null );
			return;
		}

		if ( siteURL in cache ) {
			setSiteDetails( cache[ siteURL ] );
			setIsLoading( false );
			return;
		}

		apiFetch( {
			path: addQueryArgs( '/sites/' + encodeURIComponent( siteURL ), { force: 'wpcom' } ),
			apiNamespace: 'rest/v1.1',
			method: 'GET',
			signal: abortControllerRef.current?.signal,
		} )
			.then( response => {
				cache[ siteURL ] = response;
				setSiteDetails( response );
			} )
			.catch( error => {
				setSiteDetails( null );
				if ( error.name === 'AbortError' ) {
					return;
				}

				cache[ siteURL ] = false;

				if ( error.message ) {
					setErrorMessage( error.message );
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

		return () => {
			abortControllerRef.current?.abort();
		};
	}, [ siteURL ] );

	return { isLoading, errorMessage, siteDetails };
}
