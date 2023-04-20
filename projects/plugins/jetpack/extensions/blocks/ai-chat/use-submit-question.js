/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { referenceTexts, initialWaitTexts } from './response-strings';

const blogId = '9619154';

export default function useSubmitQuestion() {
	const [ question, setQuestion ] = useState( '' );

	const [ answer, setAnswer ] = useState();
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ waitString, setWaitString ] = useState( '' );
	const [ error, setError ] = useState();

	const handleAPIError = () => {
		setReferences( [] );
		setAnswer( undefined );
		setIsLoading( false );
		setError( __( 'I seem to have encountered a problem. Please try again.', 'jetpack' ) );
	};

	const submitQuestion = async () => {
		setReferences( [] );
		setError();
		setIsLoading( true );
		setWaitString( initialWaitTexts[ Math.floor( Math.random() * initialWaitTexts.length ) ] );
		const encoded = encodeURIComponent( question );

		const urlsResponse = await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'urls',
				query: encoded,
			} ),
		} ).catch( handleAPIError );

		setReferences( urlsResponse.urls );
		setWaitString( referenceTexts[ Math.floor( Math.random() * referenceTexts.length ) ] );

		const answerResponse = await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'response',
				query: encoded,
			} ),
		} ).catch( handleAPIError );

		setAnswer( answerResponse.response );
		setIsLoading( false );
	};

	return {
		question,
		setQuestion,
		answer,
		isLoading,
		submitQuestion,
		references,
		waitString,
		error,
	};
}
