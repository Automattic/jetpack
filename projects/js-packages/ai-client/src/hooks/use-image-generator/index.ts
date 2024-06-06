/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import askQuestionSync from '../../ask-question/sync.js';
import requestJwt from '../../jwt/index.js';

const debug = debugFactory( 'ai-client:use-image-generator' );

/**
 * The type of the response from the image generation API.
 */
type ImageGenerationResponse = {
	data: Array< { [ key: string ]: string } >;
};

/**
 * Cut the post content on a given lenght so the total length of the prompt is not longer than 4000 characters.
 * @param {string} content - the content to be truncated
 * @param {number} currentPromptLength - the length of the prompt already in use
 * @returns {string} a truncated version of the content respecting the prompt length limit
 */
const truncateContent = ( content: string, currentPromptLength: number ): string => {
	const maxLength = 4000;
	const remainingLength = maxLength - currentPromptLength;
	// 6 is the length of the ellipsis and the space before it
	return content.length > remainingLength
		? content.substring( 0, remainingLength - 6 ) + ` [...]`
		: content;
};

/**
 * Create the prompt string based on the provided context.
 * @param {string} postContent - the content of the post
 * @param {string} userPrompt - the user prompt for the image generation, if provided. Max length is 1000 characters, will be truncated.
 * @returns {string} the prompt string
 */
const getDalleImageGenerationPrompt = ( postContent: string, userPrompt?: string ): string => {
	/**
	 * If the user provide some custom prompt for the image generation,
	 * we will use it, add the post content as additional context and
	 * provide some guardrails for the generation.
	 */
	if ( userPrompt ) {
		const imageGenerationPrompt = `I need a cover image for a blog post based on this user prompt:

${ userPrompt.length > 1000 ? userPrompt.substring( 0, 1000 ) : userPrompt }

Before creating the image, identify the main topic of the user prompt and relate it to the post content.
Do not represent the whole content in one image, keep it simple and just represent one single idea.
Do not add details, detailed explanations or highlights from the content, just represent the main idea as if it was a photograph.
Do not use collages or compositions with multiple elements or scenes. Stick to one single scene. Do not compose unrealistic scenes.
If the content describes facts, objects or concepts from the real world, represent them on a realistic style and do not make unreal compositions.
If the content is more abstract, use a more abstract style to represent the main idea.
Make sure the light and the style are visually appealing.
Do not add text to the image.

For additional context, this is the post content:

`;
		// truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
		return imageGenerationPrompt + truncateContent( postContent, imageGenerationPrompt.length );
	}

	/**
	 * When the user does not provide a custom prompt, we will use the
	 * standard one, based solely on the post content.
	 */
	const imageGenerationPrompt = `I need a cover image for a blog post.
Before creating the image, identify the main topic of the content and only represent it.
Do not represent the whole content in one image, keep it simple and just represent one single idea.
Do not add details, detailed explanations or highlights from the content, just represent the main idea as if it was a photograph.
Do not use collages or compositions with multiple elements or scenes. Stick to one single scene. Do not compose unrealistic scenes.
If the content describes facts, objects or concepts from the real world, represent them on a realistic style and do not make unreal compositions.
If the content is more abstract, use a more abstract style to represent the main idea.
Make sure the light and the style are visually appealing.
Do not add text to the image.

This is the post content:

`;
	// truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
	return imageGenerationPrompt + truncateContent( postContent, imageGenerationPrompt.length );
};

/**
 * Create the Stable Diffusion pre-processing prompt based on the provided context.
 * @param {string} postContent - the content of the post.
 * @param {string} userPrompt - the user prompt for the image generation, if provided. Max length is 1000 characters, will be truncated.
 * @returns {string} the prompt string to be fed to the AI Assistant model.
 */
const getStableDiffusionPreProcessingPrompt = (
	postContent: string,
	userPrompt?: string
): string => {
	/**
	 * If the user provide some custom prompt for the image generation,
	 * we will use it and add the post content as additional context.
	 */
	if ( userPrompt ) {
		const preProcessingPrompt = `I need a Stable Diffusion prompt to generate a featured image for a blog post based on this user-provided image description:

${ userPrompt.length > 1000 ? userPrompt.substring( 0, 1000 ) : userPrompt }

The image should be a photo. Make sure you highlight the main suject of the image description, and include brief details about the light and style of the image.
Include a request to use high resolution and produce a highly detailed image, with sharp focus.
Return just the prompt, without comments.

For additional context, this is the post content:

`;
		// truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
		return preProcessingPrompt + truncateContent( postContent, preProcessingPrompt.length );
	}

	/**
	 * When the user does not provide a custom prompt, we will use the
	 * standard one, based solely on the post content.
	 */
	const preProcessingPrompt = `I need a Stable Diffusion prompt to generate a featured image for a blog post with the following content.
The image should be a photo. Make sure you highlight the main suject of the content, and include brief details about the light and style of the image.
Include a request to use high resolution and produce a highly detailed image, with sharp focus.
Return just the prompt, without comments. The content is:

`;

	// truncating the content so the whole prompt is not longer than 4000 characters, the model limit.
	return preProcessingPrompt + truncateContent( postContent, preProcessingPrompt.length );
};

/**
 * Uses the Jetpack AI query endpoint to produce a prompt for the stable diffusion model.
 * @param {string} postContent - the content of the post.
 * @param {string} userPrompt - the user prompt for the image generation, if provided. Max length is 1000 characters, will be truncated
 * @param {string} feature - the feature to be used for the image generation.
 * @returns {string} the prompt string to be used on stable diffusion image generation.
 */
const getStableDiffusionImageGenerationPrompt = async (
	postContent: string,
	userPrompt?: string,
	feature?: string
): Promise< string > => {
	const prompt = getStableDiffusionPreProcessingPrompt( postContent, userPrompt );

	/**
	 * Request the prompt on the AI Assistant endpoint
	 */
	const data = await askQuestionSync( prompt, { feature } );

	return data.choices?.[ 0 ]?.message?.content;
};

const useImageGenerator = () => {
	const executeImageGeneration = async function (
		parameters: object
	): Promise< ImageGenerationResponse > {
		let token = '';

		try {
			token = ( await requestJwt() ).token;
		} catch ( error ) {
			debug( 'Error getting token: %o', error );
			return Promise.reject( error );
		}

		try {
			const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-image';

			const headers = {
				Authorization: `Bearer ${ token }`,
				'Content-Type': 'application/json',
			};

			const data = await fetch( URL, {
				method: 'POST',
				headers,
				body: JSON.stringify( parameters ),
			} ).then( response => response.json() );

			if ( data?.data?.status && data?.data?.status > 200 ) {
				debug( 'Error generating image: %o', data );
				return Promise.reject( data );
			}

			return data as ImageGenerationResponse;
		} catch ( error ) {
			debug( 'Error generating image: %o', error );
			return Promise.reject( error );
		}
	};

	const generateImageWithStableDiffusion = async function ( {
		feature,
		postContent,
		userPrompt,
	}: {
		feature: string;
		postContent: string;
		userPrompt?: string;
	} ): Promise< ImageGenerationResponse > {
		try {
			debug( 'Generating image with Stable Diffusion' );

			const prompt = await getStableDiffusionImageGenerationPrompt(
				postContent,
				userPrompt,
				feature
			);

			const parameters = {
				prompt,
				feature,
				model: 'stable-diffusion',
				style: 'photographic',
			};

			const data: ImageGenerationResponse = await executeImageGeneration( parameters );
			return data;
		} catch ( error ) {
			debug( 'Error generating image: %o', error );
			return Promise.reject( error );
		}
	};

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
	} ): Promise< ImageGenerationResponse > {
		try {
			debug( 'Generating image' );

			const imageGenerationPrompt = getDalleImageGenerationPrompt( postContent, userPrompt );

			const parameters = {
				prompt: imageGenerationPrompt,
				response_format: responseFormat,
				feature,
				size: '1792x1024',
			};

			const data: ImageGenerationResponse = await executeImageGeneration( parameters );
			return data;
		} catch ( error ) {
			debug( 'Error generating image: %o', error );
			return Promise.reject( error );
		}
	};

	return {
		generateImage,
		generateImageWithStableDiffusion,
		generateImageWithParameters: executeImageGeneration,
	};
};

export default useImageGenerator;
