/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { referenceTexts, initialWaitTexts } from './response-strings';

const blogId = '9619154';

export default function useSubmitQuestion( setAiResponse ) {
	const [ question, setQuestion ] = useState( '' );
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ waitString, setWaitString ] = useState( '' );
	const [ callOpenAI, setCallOpenAI ] = useState( false );
	const [ error, setError ] = useState();

	const handleAPIError = () => {
		setReferences( [] );
		setAiResponse( undefined );
		setIsLoading( false );
		setError( __( 'I seem to have encountered a problem. Please try again.', 'jetpack' ) );
	};

	useEffect( () => {
		let source;
		if ( callOpenAI === true ) {
			const encoded = encodeURIComponent( question );
			const path = addQueryArgs(
				`https://public-api.wordpress.com/wpcom/v2/sites/${ blogId }/jetpack-search/ai/search`,
				{
					stop_at: 'response',
					query: encoded,
					stream: true,
				}
			);
			source = new EventSource( path );

			source.addEventListener( 'open', () => {
				setIsLoading( false );
			} );

			source.addEventListener( 'message', e => {
				if ( e.data === '[DONE]' ) {
					setAiResponse( '[DONE]' );
					source.close();
					setCallOpenAI( false );
					return;
				}
				const data = JSON.parse( e.data );

				setAiResponse( data.choices[ 0 ]?.delta?.content );
			} );
		}
		return () => {
			source?.close();
		};
	}, [ callOpenAI ] );

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
				stream: true,
			} ),
		} ).catch( handleAPIError );

		setReferences( urlsResponse.urls );
		setWaitString( referenceTexts[ Math.floor( Math.random() * referenceTexts.length ) ] );

		setCallOpenAI( true );
	};

	return {
		question,
		setQuestion,
		isLoading,
		submitQuestion,
		references,
		waitString,
		error,
	};
}
