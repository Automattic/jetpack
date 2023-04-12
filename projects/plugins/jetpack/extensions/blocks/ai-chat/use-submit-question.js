/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { generateContextText, generatePrompt, generateReferences } from './helpers';

/**
 *
 * @
 */

export default function useSubmitQuestion() {
	const [ query, setQuery ] = useState( 'How to I create a custom block in WordPress?' );

	const [ docs, setDocs ] = useState();
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );

	const submitQuestion = async () => {
		setIsLoading( true );
		const embedding = await apiFetch( {
			path: '/ask-wp/v1/embeddings',
			method: 'POST',
			data: { input: query },
		} );

		const sections = await apiFetch({
			path: '/ask-wp/v1/vectors',
			method: 'POST',
			data: { embedding },
		});

		const prompt = generatePrompt( query.trim(), generateContextText( sections ) );

		setReferences( generateReferences( sections ) );

		const completions = await apiFetch( {
			path: '/ask-wp/v1/completions',
			method: 'POST',
			data: { prompt },
		} );

		setDocs( completions.choices[ 0 ].text );
		setIsLoading( false );
	};

	return { query, setQuery, docs, isLoading, submitQuestion, references };
}
