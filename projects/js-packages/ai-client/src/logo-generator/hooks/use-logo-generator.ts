/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import debugFactory from 'debug';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import askQuestionSync from '../../ask-question/sync.ts';
import useImageGenerator from '../../hooks/use-image-generator/index.ts';
import useSaveToMediaLibrary from '../../hooks/use-save-to-media-library/index.ts';
import requestJwt from '../../jwt/index.ts';
import { stashLogo } from '../lib/logo-storage.ts';
import { setSiteLogo } from '../lib/set-site-logo.ts';
import { STORE_NAME } from '../store/index.ts';
import useRequestErrors from './use-request-errors.ts';
/**
 * Types
 */
import type { ImageStyle, ImageStyleObject } from '../../hooks/use-image-generator/constants.ts';
import type { RoleType } from '../../types.ts';
import type { Logo, Selectors, SaveLogo, LogoGeneratorFeatureControl } from '../store/types.ts';

const debug = debugFactory( 'jetpack-ai-calypso:use-logo-generator' );

const useLogoGenerator = () => {
	const {
		setSelectedLogoIndex,
		setIsSavingLogoToLibrary,
		setIsApplyingLogo,
		setIsRequestingImage,
		setIsEnhancingPrompt,
		increaseAiAssistantRequestsCount,
		addLogoToHistory,
		setContext,
		setIsLoadingHistory,
	} = useDispatch( STORE_NAME );

	const {
		logos,
		selectedLogoIndex,
		selectedLogo,
		siteDetails,
		isSavingLogoToLibrary,
		isApplyingLogo,
		isEnhancingPrompt,
		isBusy,
		isRequestingImage,
		getAiAssistantFeature,
		requireUpgrade,
		context,
		tierPlansEnabled,
		isLoadingHistory,
	} = useSelect( select => {
		const selectors: Selectors = select( STORE_NAME );

		return {
			logos: selectors.getLogos(),
			selectedLogoIndex: selectors.getSelectedLogoIndex(),
			selectedLogo: selectors.getSelectedLogo(),
			siteDetails: selectors.getSiteDetails(),
			isSavingLogoToLibrary: selectors.getIsSavingLogoToLibrary(),
			isApplyingLogo: selectors.getIsApplyingLogo(),
			isRequestingImage: selectors.getIsRequestingImage(),
			isEnhancingPrompt: selectors.getIsEnhancingPrompt(),
			isBusy: selectors.getIsBusy(),
			getAiAssistantFeature: selectors.getAiAssistantFeature,
			requireUpgrade: selectors.getRequireUpgrade(),
			context: selectors.getContext(),
			tierPlansEnabled: selectors.getTierPlansEnabled(),
			isLoadingHistory: selectors.getIsLoadingHistory(),
		};
	}, [] );

	const {
		setFirstLogoPromptFetchError,
		setEnhancePromptFetchError,
		setLogoFetchError,
		setSaveToLibraryError,
		setLogoUpdateError,
	} = useRequestErrors();

	const { generateImageWithParameters } = useImageGenerator();
	const { saveToMediaLibrary } = useSaveToMediaLibrary();

	const { ID = null, name = null, description = null } = siteDetails || {};
	const siteId = ID ? String( ID ) : null;

	const aiAssistantFeatureData = getAiAssistantFeature( siteId );
	const logoGenerationCost = aiAssistantFeatureData?.costs?.[ 'jetpack-ai-logo-generator' ]?.logo;
	const logoGeneratorControl = aiAssistantFeatureData?.featuresControl?.[
		'logo-generator'
	] as LogoGeneratorFeatureControl;
	const imageStyles: Array< ImageStyleObject > = logoGeneratorControl?.styles || [];

	const generateFirstPrompt = useCallback(
		async function (): Promise< string > {
			setFirstLogoPromptFetchError( null );
			increaseAiAssistantRequestsCount();

			try {
				const tokenData = await requestJwt();

				if ( ! tokenData || ! tokenData.token ) {
					throw new Error( 'No token provided' );
				}

				debug( 'Generating first prompt for site' );

				const firstPromptGenerationPrompt = `Generate a simple and short prompt asking for a logo based on the site's name and description, keeping the same language.
Example for a site named "The minimalist fashion blog", described as "Daily inspiration for all things fashion": A logo for a minimalist fashion site focused on daily sartorial inspiration with a clean and modern aesthetic that is sleek and sophisticated.
Another example, now for a site called "El observatorio de aves", described as "Un sitio dedicado a nuestros compañeros y compañeras entusiastas de la observación de aves.": Un logo para un sitio web dedicado a la observación de aves,  capturando la esencia de la naturaleza y la pasión por la avifauna en un diseño elegante y representativo, reflejando una estética natural y apasionada por la vida silvestre.

Site name: ${ name }
Site description: ${ description }`;

				const body = {
					question: firstPromptGenerationPrompt,
					feature: 'jetpack-ai-logo-generator',
					stream: false,
				};

				const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
				const headers = {
					Authorization: `Bearer ${ tokenData.token }`,
					'Content-Type': 'application/json',
				};

				const data = await fetch( URL, {
					method: 'POST',
					headers,
					body: JSON.stringify( body ),
				} ).then( response => response.json() );

				return data?.choices?.[ 0 ]?.message?.content;
			} catch ( error ) {
				increaseAiAssistantRequestsCount( -1 );
				setFirstLogoPromptFetchError( error );
				throw error;
			}
		},
		[ setFirstLogoPromptFetchError, increaseAiAssistantRequestsCount, name, description ]
	);

	const enhancePrompt = async function ( { prompt }: { prompt: string } ): Promise< string > {
		setEnhancePromptFetchError( null );
		increaseAiAssistantRequestsCount();

		try {
			const tokenData = await requestJwt();

			if ( ! tokenData || ! tokenData.token ) {
				throw new Error( 'No token provided' );
			}

			debug( 'Enhancing prompt', prompt );

			const systemMessage = `Enhance the prompt you receive.
The prompt is meant for generating a logo. Return the same prompt enhanced, and make each enhancement wrapped in brackets.
Do not add any mention to text, letters, typography or the name of the site in the prompt.
For example: user's prompt: A logo for an ice cream shop. Returned prompt: A logo for an ice cream shop [that is pink] [and vibrant].`;

			const messages = [
				{
					role: 'system',
					content: systemMessage,
				},
				{
					role: 'user',
					content: prompt,
				},
			];

			const body = {
				messages,
				feature: 'jetpack-ai-logo-generator',
				stream: false,
			};

			const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
			const headers = {
				Authorization: `Bearer ${ tokenData.token }`,
				'Content-Type': 'application/json',
			};

			const data = await fetch( URL, {
				method: 'POST',
				headers,
				body: JSON.stringify( body ),
			} ).then( response => response.json() );

			return data?.choices?.[ 0 ]?.message?.content;
		} catch ( error ) {
			increaseAiAssistantRequestsCount( -1 );
			setEnhancePromptFetchError( error );
			throw error;
		}
	};

	const guessStyle = useCallback(
		async function ( prompt: string ): Promise< ImageStyle | null > {
			setLogoFetchError( null );
			if ( ! imageStyles || ! imageStyles.length ) {
				return null;
			}

			const messages = [
				{
					role: 'jetpack-ai' as RoleType,
					context: {
						type: 'ai-assistant-guess-logo-style',
						request: prompt,
						name,
						description,
					},
				},
			];

			try {
				const style = await askQuestionSync( messages, { feature: 'jetpack-ai-logo-generator' } );

				if ( ! style ) {
					return null;
				}
				const styleObject = imageStyles.find( ( { value } ) => value === style );

				if ( ! styleObject ) {
					return null;
				}

				return styleObject.value;
			} catch ( error ) {
				debug( 'Error guessing style', error );
				Promise.reject( error );
			}
		},
		[ imageStyles, name, description ]
	);

	const generateImage = useCallback(
		async function ( {
			prompt,
			style = null,
		}: {
			prompt: string;
			style?: ImageStyle | null;
		} ): Promise< { data: Array< { url: string } > } > {
			setLogoFetchError( null );

			try {
				const tokenData = await requestJwt();

				if ( ! tokenData || ! tokenData.token ) {
					throw new Error( 'No token provided' );
				}

				if ( style === 'auto' ) {
					throw new Error( 'Auto style is not supported' );
				}

				debug( 'Generating image with prompt', prompt );

				const imageGenerationPrompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:
Create a single text-free iconic vector logo that symbolically represents the user request, using abstract or symbolic imagery.
The design should be modern, with either a vivid color scheme full of gradients or a color scheme that's monochromatic. Use any of those styles based on the user request mood.
Ensure the logo is set against a clean solid background.
Ensure the logo works in small sizes.
The imagery in the logo should subtly hint at the mood of the user request but DO NOT use any text, letters, or the name of the site on the imagery.
The image should contain a single icon, without variations, color palettes or different versions.

User request:${ prompt }`;

				const body = {
					prompt: imageGenerationPrompt,
					// if style is set prompt is reworked at backend with messages
					messages: style
						? [
								{
									role: 'jetpack-ai',
									context: {
										type: 'ai-assistant-generate-logo',
										request: prompt,
										name,
										description,
										style,
									},
								},
						  ]
						: [],
					feature: 'jetpack-ai-logo-generator',
					response_format: 'b64_json',
					style: style || '', // backend expects an empty string if no style is provided
				};

				const data = await generateImageWithParameters( body );

				return data as { data: { url: string }[] };
			} catch ( error ) {
				setLogoFetchError( error );
				throw error;
			}
		},
		[ name, description ]
	);

	const saveLogo = useCallback< SaveLogo >(
		async logo => {
			setSaveToLibraryError( null );

			try {
				debug( 'Saving logo for site' );

				// If the logo is already saved, return its mediaId and mediaURL.
				if ( logo.mediaId ) {
					return { mediaId: logo.mediaId, mediaURL: logo.url };
				}

				const savedLogo = {
					mediaId: 0,
					mediaURL: '',
				};

				setIsSavingLogoToLibrary( true );

				const { id: mediaId, url: mediaURL } = await saveToMediaLibrary(
					logo.url,
					'site-logo.png'
				);

				savedLogo.mediaId = parseInt( mediaId );
				savedLogo.mediaURL = mediaURL;

				return savedLogo;
			} catch ( error ) {
				setSaveToLibraryError( error );
				throw error;
			} finally {
				setIsSavingLogoToLibrary( false );
			}
		},
		[ setIsSavingLogoToLibrary, setSaveToLibraryError ]
	);

	const applyLogo = useCallback( async () => {
		setLogoUpdateError( null );

		try {
			if ( ! siteId || ! selectedLogo ) {
				throw new Error( 'Missing siteId or logo' );
			}

			debug( 'Applying logo for site', siteId );

			setIsApplyingLogo( true );

			const { mediaId } = selectedLogo;

			if ( ! mediaId ) {
				throw new Error( 'Missing mediaId' );
			}

			await setSiteLogo( {
				siteId: siteId,
				imageId: String( mediaId ),
			} );
		} catch ( error ) {
			setLogoUpdateError( error );
			throw error;
		} finally {
			setIsApplyingLogo( false );
		}
	}, [ selectedLogo, setIsApplyingLogo, setLogoUpdateError, siteId ] );

	const storeLogo = useCallback(
		( logo: Logo ) => {
			addLogoToHistory( logo );
			stashLogo( { ...logo, siteId: String( siteId ) } );
		},
		[ siteId, addLogoToHistory, stashLogo ]
	);

	const generateLogo = useCallback(
		async function ( {
			prompt,
			style,
		}: {
			prompt: string;
			style?: ImageStyle | null;
		} ): Promise< void > {
			debug( 'Generating logo for site' );

			setIsRequestingImage( true );

			try {
				if ( ! logoGenerationCost ) {
					throw new Error( 'Missing cost information' );
				}

				increaseAiAssistantRequestsCount( logoGenerationCost );

				let image;

				try {
					image = await generateImage( { prompt, style } );

					if ( ! image || ! image.data.length ) {
						throw new Error( 'No image returned' );
					}
				} catch ( error ) {
					increaseAiAssistantRequestsCount( -logoGenerationCost );
					throw error;
				}

				const revisedPrompt = image.data[ 0 ].revised_prompt || null;

				// response_format=url returns object with url, otherwise b64_json
				const logo: Logo = {
					url: 'data:image/png;base64,' + image.data[ 0 ].b64_json,
					description: prompt,
					revisedPrompt,
				};

				try {
					const savedLogo = await saveLogo( logo );
					storeLogo( {
						url: savedLogo.mediaURL,
						description: prompt,
						mediaId: savedLogo.mediaId,
						revisedPrompt,
					} );
				} catch ( error ) {
					storeLogo( logo );
					throw error;
				}
			} finally {
				setIsRequestingImage( false );
			}
		},
		[ logoGenerationCost, increaseAiAssistantRequestsCount, saveLogo, storeLogo, generateImage ]
	);

	return {
		logos,
		selectedLogoIndex,
		selectedLogo,
		setSelectedLogoIndex,
		site: {
			id: siteId,
			name,
			description,
		},
		generateFirstPrompt,
		saveLogo,
		applyLogo,
		generateImage,
		enhancePrompt,
		storeLogo,
		generateLogo,
		setIsEnhancingPrompt,
		setIsRequestingImage,
		setIsSavingLogoToLibrary,
		setIsApplyingLogo,
		setContext,
		isEnhancingPrompt,
		isRequestingImage,
		isSavingLogoToLibrary,
		isApplyingLogo,
		isBusy,
		getAiAssistantFeature,
		requireUpgrade,
		context,
		tierPlansEnabled,
		isLoadingHistory,
		setIsLoadingHistory,
		imageStyles,
		guessStyle,
	};
};

export default useLogoGenerator;
