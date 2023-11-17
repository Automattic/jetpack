/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

export default function useSubmitQuestion( blogType, blogId ) {
	const [ question, setQuestion ] = useState( '' );

	const [ answer, setAnswer ] = useState( null );
	const [ cacheKey, setCacheKey ] = useState( '' );
	const [ askError, setAskError ] = useState( false );
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );

	const submitQuestion = async () => {
		let path = `/wpcom/v2/jetpack-search/ai/search?query=${ question }`;
		if ( blogType === 'wpcom' ) {
			path = `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search?query=${ question }`;
		}

		setIsLoading( true );
		setAnswer( null );

		apiFetch( {
			path,
			method: 'GET',
		} )
			.then( res => {
				setCacheKey( res.cache_key );
				setAnswer( res.response );
				setReferences( res.urls );
			} )
			.catch( err => {
				setCacheKey( '' );
				setReferences( [] );
				setAskError( err );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	};

	return {
		question,
		setQuestion,
		answer,
		isLoading,
		submitQuestion,
		references,
		cacheKey,
		askError,
		setAskError,
	};
}
