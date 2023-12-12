/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useCallback } from '@wordpress/element';

export default function useSetReblogSetting( blogId ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ success, setSuccess ] = useState( null );
	const [ error, setError ] = useState( null );

	const resetSuccess = () => {
		setSuccess( null );
	};

	const setReblogSetting = useCallback(
		async reblogSetting => {
			const path = `https://public-api.wordpress.com/rest/v1.3/sites/${ blogId }/settings/`;
			const data = {
				disabled_reblogs: ! reblogSetting,
			};

			setIsLoading( true );
			await apiFetch( {
				url: path,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: data,
			} )
				.then( () => {
					setSuccess( true );
					setError( null );
				} )
				.catch( err => {
					setError( err );
				} )
				.finally( () => {
					setIsLoading( false );
				} );
		},
		[ blogId ]
	);

	return {
		isLoading,
		success,
		error,
		setReblogSetting,
		resetSuccess,
	};
}
