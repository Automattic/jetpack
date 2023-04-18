/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

const blogId = '9619154';

export default function useSubmitQuestion() {
	const [ question, setQuestion ] = useState( '' );

	const [ answer, setAnswer ] = useState();
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ waitString, setWaitString ] = useState( '' );

	const submitQuestion = async () => {
		setReferences( [] );
		setIsLoading( true );
		const encoded = encodeURIComponent( question );
		apiFetch( {
			path: addQueryArgs( `wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'terms',
				query: encoded,
			} ),
		} )
			.then( response => {
				setWaitString(
					sprintf(
						/* translators: %1$s: A list of terms being searched for. */
						__( 'Site tight, I am going to search for %1$s', 'jetpack' ),
						response.terms.join( ', ' )
					)
				);
				return apiFetch( {
					path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
						stop_at: 'urls',
						query: encoded,
					} ),
				} );
			} )
			.then( response => {
				setReferences( response.urls );
				setWaitString(
					__(
						'I have found the following documents. Bear with me while I try and summarise them for you',
						'jetpack'
					)
				);

				return apiFetch( {
					path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
						stop_at: 'response',
						query: encoded,
					} ),
				} );
			} )
			.then( response => {
				setAnswer( response.response );
				setIsLoading( false );
			} );
	};

	return { question, setQuestion, answer, isLoading, submitQuestion, references, waitString };
}
