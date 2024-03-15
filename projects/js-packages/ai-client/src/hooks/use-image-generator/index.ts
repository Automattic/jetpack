/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import requestJwt from '../../jwt/index.js';

const debug = debugFactory( 'ai-client:use-image-generator' );

const useImageGenerator = () => {
	const generateImage = async function (): Promise< { data: Array< { url: string } > } > {
		let token = '';

		try {
			token = ( await requestJwt() ).token;
		} catch ( error ) {
			debug( 'Error getting token: %o', error );
			return Promise.reject( error );
		}

		try {
			debug( 'Generating image' );

			// TODO: Find a proper prompt for the image generation
			const imageGenerationPrompt = ``;

			const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-image';

			const body = {
				prompt: imageGenerationPrompt,
				feature: 'jetpack-ai-image-generator',
				response_format: 'url',
			};

			const headers = {
				Authorization: `Bearer ${ token }`,
			};

			const data = await fetch( URL, {
				method: 'POST',
				headers,
				body: JSON.stringify( body ),
			} ).then( response => response.json() );

			return data as { data: { url: string }[] };
		} catch ( error ) {
			return;
		}
	};

	return {
		generateImage,
	};
};

export default useImageGenerator;
