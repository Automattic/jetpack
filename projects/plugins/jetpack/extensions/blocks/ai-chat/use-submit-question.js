/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

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
		setWaitString( __( 'Let me think about that for a moment.', 'jetpack' ) );
		const encoded = encodeURIComponent( question );

		const urlsResponse = await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'urls',
				query: encoded,
			} ),
		} ).catch( handleAPIError );

		setReferences( urlsResponse.urls );
		setWaitString(
			__(
				'I have found the following documents. Bear with me while I try and summarise them for you',
				'jetpack'
			)
		);

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
