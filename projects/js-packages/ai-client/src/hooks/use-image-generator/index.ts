/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import requestJwt from '../../jwt/index.js';

const debug = debugFactory( 'ai-client:use-image-generator' );

/**
 * Create the prompt string based on the provided context.
 * @param {string} postContent - the content of the post
 * @param {string} userPrompt - the user prompt for the image generation, if provided
 * @returns {string} the prompt string
 */
const getImageGenerationPrompt = ( postContent: string, userPrompt?: string ): string => {
	/**
	 * If the user provide some custom prompt for the image generation,
	 * we will use it, add the post content as additional context and
	 * provide some guardrails for the generation.
	 */
	if ( userPrompt ) {
		return (
			`I need a cover image for a blog post based on this user prompt:

${ userPrompt }

Before creating the image, identify the main topic of the user prompt and relate it to the post content.
Do not represent the whole content in one image, keep it simple and just represent one single idea.
Do not add details, detailed explanations or highlights from the content, just represent the main idea as if it was a photograph.
Do not use collages or compositions with multiple elements or scenes. Stick to one single scene. Do not compose unrealistic scenes.
If the content describes facts, objects or concepts from the real world, represent them on a realistic style and do not make unreal compositions.
If the content is more abstract, use a more abstract style to represent the main idea.
Make sure the light and the style are visually appealing.
Do not add text to the image.

For additional context, this is the post content:

` + ( postContent.length > 2000 ? postContent.substring( 0, 2000 ) + ` [...]` : postContent )
		); // truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
	}

	/**
	 * When the user does not provide a custom prompt, we will use the
	 * standard one, based solely on the post content.
	 */
	return (
		`I need a cover image for a blog post.
Before creating the image, identify the main topic of the content and only represent it.
Do not represent the whole content in one image, keep it simple and just represent one single idea.
Do not add details, detailed explanations or highlights from the content, just represent the main idea as if it was a photograph.
Do not use collages or compositions with multiple elements or scenes. Stick to one single scene. Do not compose unrealistic scenes.
If the content describes facts, objects or concepts from the real world, represent them on a realistic style and do not make unreal compositions.
If the content is more abstract, use a more abstract style to represent the main idea.
Make sure the light and the style are visually appealing.
Do not add text to the image.

This is the post content:

` + ( postContent.length > 3000 ? postContent.substring( 0, 3000 ) + ` [...]` : postContent )
	); // truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
};

const useImageGenerator = () => {
	const generateImage = async function ( {
		feature,
		postContent,
		responseFormat = 'url',
		userPrompt,
	}: {
		feature: string;
		postContent: string;
		responseFormat?: 'url' | 'b64_json';
		userPrompt?: string;
	} ): Promise< { data: Array< { [ key: string ]: string } > } > {
		let token = '';

		try {
			token = ( await requestJwt() ).token;
		} catch ( error ) {
			debug( 'Error getting token: %o', error );
			return Promise.reject( error );
		}

		try {
			debug( 'Generating image' );

			const imageGenerationPrompt = getImageGenerationPrompt( postContent, userPrompt );

			const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-image';

			const body = {
				prompt: imageGenerationPrompt,
				response_format: responseFormat,
				feature,
				size: '1792x1024',
			};

			const headers = {
				Authorization: `Bearer ${ token }`,
				'Content-Type': 'application/json',
			};

			const data = await fetch( URL, {
				method: 'POST',
				headers,
				body: JSON.stringify( body ),
			} ).then( response => response.json() );

			if ( data?.data?.status && data?.data?.status > 200 ) {
				debug( 'Error generating image: %o', data );
				return Promise.reject( data );
			}

			return data as { data: { [ key: string ]: string }[] };
		} catch ( error ) {
			debug( 'Error generating image: %o', error );
			return Promise.reject( error );
		}
	};

	return {
		generateImage,
	};
};

export default useImageGenerator;
