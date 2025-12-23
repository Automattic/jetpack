/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

type StatsPoint = {
	date: string;
	count: number;
	pretty?: string;
};

type FormStats = {
	id: number;
	responses_count: number;
	activity: StatsPoint[];
};

/**
 * Fetch stats for a reusable form.
 *
 * @param {number | null} formId - Form ID.
 * @return {{ data: FormStats | null, isLoading: boolean, error: string | null }} Stats response.
 */
export default function useFormStats( formId: number | null ) {
	const [ data, setData ] = useState< FormStats | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! formId ) {
			setData( null );
			return;
		}

		let isMounted = true;
		setIsLoading( true );
		setError( null );

		apiFetch< FormStats >( { path: `/wp/v2/jetpack-forms/${ formId }/stats` } )
			.then( response => {
				if ( isMounted ) {
					setData( response );
				}
			} )
			.catch( () => {
				if ( isMounted ) {
					setError( 'error' );
					setData( null );
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
	}, [ formId ] );

	return { data, isLoading, error };
}
