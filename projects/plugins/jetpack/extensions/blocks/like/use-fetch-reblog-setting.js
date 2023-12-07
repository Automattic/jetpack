/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useCallback } from '@wordpress/element';

export default function useFetchReblogSetting( blogId ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ reblogSetting, setReblogSetting ] = useState( null );
	const [ error, setError ] = useState( null );

	const fetchReblogSetting = useCallback( async () => {
		const path = `https://public-api.wordpress.com/rest/v1.3/sites/${ blogId }/settings/`;
		//const path = `/wpcom/v2/related-posts`;

		setIsLoading( true );
		await apiFetch( { url: path, method: 'GET' } )
			.then( response => {
				setReblogSetting( response );
				setError( null );
			} )
			.catch( err => {
				setError( err );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ blogId ] );

	return {
		isLoading,
		reblogSetting,
		error,
		fetchReblogSetting,
	};
}
