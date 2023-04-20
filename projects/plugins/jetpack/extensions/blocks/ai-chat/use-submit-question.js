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
		setWaitString( __( 'Let me think about that for a moment.', 'jetpack' ) );
		const encoded = encodeURIComponent( question );

		const { terms } = await apiFetch( {
			path: addQueryArgs( `wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'terms',
				query: encoded,
			} ),
		} );

		setWaitString(
			sprintf(
				/* translators: %1$s: A list of terms being searched for. */
				__( 'Sit tight, I am going to search for %1$s', 'jetpack' ),
				terms.join( ', ' )
			)
		);

		const { urls } = await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'urls',
				query: encoded,
			} ),
		} );

		setReferences( urls );
		setWaitString(
			__(
				'I have found the following documents. Bear with me while I try and summarise them for you',
				'jetpack'
			)
		);

		const { response } = await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`, {
				stop_at: 'response',
				query: encoded,
			} ),
		} );

		setAnswer( response );
		setIsLoading( false );
	};

	return { question, setQuestion, answer, isLoading, submitQuestion, references, waitString };
}
