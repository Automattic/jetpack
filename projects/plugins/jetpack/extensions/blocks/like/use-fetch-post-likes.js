/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

export default function useFetchPostLikes( blogId, postId ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ likes, setLikes ] = useState( null );
	const [ error, setError ] = useState( null );

	const fetchLikes = async () => {
		const path = `https://public-api.wordpress.com/rest/v1.1/sites/${ blogId }/posts/${ postId }/likes/?force=wpcom`;
		//const path = `/wpcom/v2/related-posts`;

		setIsLoading( true );
		await apiFetch( { url: path, method: 'GET', credentials: 'omit' } )
			.then( response => {
				setLikes( response );
				setError( null );
			} )
			.catch( err => {
				setError( err );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	};

	return {
		isLoading,
		likes,
		error,
		fetchLikes,
	};
}
