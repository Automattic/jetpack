/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

export default function useSubmitQuestion( blogType, blogId ) {
	const [ question, setQuestion ] = useState( '' );

	const [ answer, setAnswer ] = useState();
	const [ cacheKey, setCacheKey ] = useState();
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );

	const submitQuestion = async () => {
		let path = `/wpcom/v2/jetpack-search/ai/search?query=${ question }`;
		if ( blogType === 's' ) {
			path = `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search?query=${ question }`;
		}

		setIsLoading( true );

		apiFetch( {
			path,
			method: 'GET',
		} ).then( res => {
			setCacheKey( res.cache_key );
			setAnswer( res.response );
			setReferences( res.urls );
			setIsLoading( false );
		} );
	};

	return { question, setQuestion, answer, isLoading, submitQuestion, references, cacheKey };
}
