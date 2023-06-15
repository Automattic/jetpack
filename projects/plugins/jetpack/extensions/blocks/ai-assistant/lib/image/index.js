/*
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export function getImagesFromOpenAI(
	prompt,
	setAttributes,
	setLoadingImages,
	setResultImages,
	setErrorMessage,
	postId
) {
	setLoadingImages( true );
	setErrorMessage( null );
	setAttributes( { requestedPrompt: prompt } ); // This will prevent double submitting.

	apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
			post_id: postId,
		},
	} )
		.then( res => {
			setLoadingImages( false );
			const images = res.data.map( image => {
				return 'data:image/png;base64,' + image.b64_json;
			} );
			setResultImages( images );
		} )
		.catch( e => {
			if ( e.message ) {
				setErrorMessage( e.message ); // Message was already translated by the backend
			} else {
				setErrorMessage(
					__(
						'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
						'jetpack'
					)
				);
			}
			setLoadingImages( false );
		} );
}
