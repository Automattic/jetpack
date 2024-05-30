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
 * The type of the response from the image generation API.
 */
type ImageGenerationResponse = {
	data: Array< { [ key: string ]: string } >;
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

			const parameters = {
				messages: [
					{
						role: 'jetpack-ai',
						context: {
							type: 'featured-image-generation',
							content: postContent,
							request: userPrompt ? userPrompt : null,
							model: 'stable-diffusion',
						},
					},
				],
				feature,
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

			const parameters = {
				messages: [
					{
						role: 'jetpack-ai',
						context: {
							type: 'featured-image-generation',
							content: postContent,
							request: userPrompt ? userPrompt : null,
							model: 'dalle',
						},
					},
				],
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
	};
};

export default useImageGenerator;
