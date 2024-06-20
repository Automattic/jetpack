/**
 * External dependencies
 */
import { useImageGenerator } from '@automattic/jetpack-ai-client';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useAiFeature from '../../../../../blocks/ai-assistant/hooks/use-ai-feature';
import useSaveToMediaLibrary from '../../../hooks/use-save-to-media-library';
/**
 * Types
 */
import { FEATURED_IMAGE_FEATURE_NAME } from '../types';
import type { CarrouselImageData, CarrouselImages } from '../carrousel';

export default function useAiImage( { cost }: { cost: number } ) {
	const { generateImageWithParameters } = useImageGenerator();
	const { increaseRequestsCount } = useAiFeature();
	const { saveToMediaLibrary } = useSaveToMediaLibrary();

	/* Images Control */
	const pointer = useRef( 0 );
	const [ current, setCurrent ] = useState( 0 );
	const [ images, setImages ] = useState< CarrouselImages >( [ { generating: true } ] );

	/* Merge the image data with the new data. */
	const updateImages = useCallback( ( data: CarrouselImageData, index ) => {
		setImages( currentImages => {
			const newImages = [ ...currentImages ];
			newImages[ index ] = {
				...newImages[ index ],
				...data,
			};
			return newImages;
		} );
	}, [] );

	/*
	 * Function to update the requests count after a featured image generation.
	 */
	const updateRequestsCount = useCallback( () => {
		increaseRequestsCount( cost );
	}, [ increaseRequestsCount, cost ] );

	/*
	 * Function to generate a new image with the current value of the post content.
	 */
	const processImageGeneration = useCallback(
		( {
			userPrompt,
			postContent,
			notEnoughRequests,
		}: {
			userPrompt?: string | null;
			postContent?: string | null;
			notEnoughRequests: boolean;
		} ) => {
			return new Promise( ( resolve, reject ) => {
				updateImages( { generating: true, error: null }, pointer.current );

				// Ensure the site has enough requests to generate the image.
				if ( notEnoughRequests ) {
					updateImages(
						{
							generating: false,
							error: new Error(
								__( "You don't have enough requests to generate another image.", 'jetpack' )
							),
						},
						pointer.current
					);
					resolve( {} );
					return;
				}

				// Ensure the user prompt or the post content are set.
				if ( ! userPrompt && ! postContent ) {
					updateImages(
						{
							generating: false,
							error: new Error(
								__(
									'No content to generate image. Please type custom instructions and try again.',
									'jetpack'
								)
							),
						},
						pointer.current
					);
					resolve( {} );
					return;
				}

				/**
				 * Make a generic call to backend and let it decide the model.
				 */
				const generateImagePromise = generateImageWithParameters( {
					feature: FEATURED_IMAGE_FEATURE_NAME,
					size: '1792x1024', // the size, when the generation happens with DALL-E-3
					responseFormat: 'b64_json', // the response format, when the generation happens with DALL-E-3
					style: 'photographic', // the style of the image, when the generation happens with Stable Diffusion
					messages: [
						{
							role: 'jetpack-ai',
							context: {
								type: 'featured-image-generation',
								request: userPrompt ? userPrompt : null,
								content: postContent,
							},
						},
					],
				} );

				generateImagePromise
					.then( result => {
						if ( result.data.length > 0 ) {
							const image = 'data:image/png;base64,' + result.data[ 0 ].b64_json;
							updateImages( { image }, pointer.current );
							updateRequestsCount();
							saveToMediaLibrary( image )
								.then( savedImage => {
									updateImages( { libraryId: savedImage.id, generating: false }, pointer.current );
									pointer.current += 1;
									resolve( {
										image,
										libraryId: savedImage.id,
										libraryUrl: savedImage.url,
									} );
								} )
								.catch( () => {
									updateImages( { generating: false }, pointer.current );
									pointer.current += 1;
									resolve( { image } );
								} );
						}
					} )
					.catch( e => {
						updateImages( { generating: false, error: e }, pointer.current );
						reject( e );
					} );
			} );
		},
		[ updateImages, generateImageWithParameters, updateRequestsCount, saveToMediaLibrary ]
	);

	const handlePreviousImage = useCallback( () => {
		setCurrent( Math.max( current - 1, 0 ) );
	}, [ current, setCurrent ] );

	const handleNextImage = useCallback( () => {
		setCurrent( Math.min( current + 1, images.length - 1 ) );
	}, [ current, images.length ] );

	return {
		processImageGeneration,
		handlePreviousImage,
		handleNextImage,
		currentImage: images[ current ],
		currentPointer: images[ pointer.current ],
		images,
	};
}
