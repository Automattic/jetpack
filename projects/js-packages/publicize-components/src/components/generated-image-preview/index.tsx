import { ThemeProvider } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, BaseControl } from '@wordpress/components';
import { store as coreStore, Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import styles from './styles.module.scss';
import { getSigImageUrl } from './utils';

export const FEATURED_IMAGE_STILL_LOADING = 'featured-image-still-loading';
const getMediaSourceUrl = ( media: Attachment ) => {
	return media?.media_details?.sizes?.large?.source_url || media?.source_url;
};

type ImageType = 'custom' | 'featured' | 'default' | 'none';

export const getImageId = (
	imageType: ImageType,
	customImageId: number | null,
	featuredImageId: number | null,
	defaultImageId: number | null
) => {
	if ( imageType === 'custom' && customImageId ) {
		return customImageId;
	}

	if ( imageType === 'default' && defaultImageId ) {
		return defaultImageId;
	}

	if ( imageType === 'featured' && featuredImageId ) {
		return featuredImageId;
	}

	return featuredImageId || defaultImageId;
};

const hasNoValidImage = (
	imageType: ImageType,
	customImageId: number | null,
	featuredImageId: number | null,
	defaultImageId: number | null
) => {
	// No image type selected
	if ( imageType === 'none' ) {
		return true;
	}

	// Custom image selected but no image provided
	if ( imageType === 'custom' && ! customImageId ) {
		return true;
	}

	// Default image selected but no valid default image
	if ( imageType === 'default' && ! defaultImageId ) {
		return true;
	}

	// Featured image type (or null/undefined) but no featured image and no valid default fallback
	if ( ( imageType ?? 'featured' ) === 'featured' && ! featuredImageId && ! defaultImageId ) {
		return true;
	}

	return false;
};

export const calculateImageUrl = (
	imageType: ImageType,
	customImageId: number | null,
	featuredImageId: number | null,
	defaultImageId: number | null,
	getMedia: ( id: number | null ) => Attachment
) => {
	if ( hasNoValidImage( imageType, customImageId, featuredImageId, defaultImageId ) ) {
		return null;
	}

	const usedImageId = getImageId( imageType, customImageId, featuredImageId, defaultImageId );

	const media = getMedia( usedImageId );
	if ( ! media ) {
		return FEATURED_IMAGE_STILL_LOADING;
	}
	return getMediaSourceUrl( media );
};

type GeneratedImagePreviewProps = {
	shouldDebounce?: boolean;
	onNewToken?: ( token: string ) => void;
	customText?: string;
	imageType?: ImageType;
	imageId?: number | null;
	defaultImageId?: number | null;
	template?: string;
	font?: string;
};

/**
 * Fetches the preview of the generated image based on the post info
 *
 * @param {GeneratedImagePreviewProps} props - The props to pass to the generator config.
 *                                           The props to pass to the generator config. Contains the imageType, imageId, template and customText. Also contains boolean shouldDebounce.
 * @return The generated image preview.
 */
export default function GeneratedImagePreview( {
	shouldDebounce = true,
	onNewToken = undefined,
	...generatorConfigProps
}: GeneratedImagePreviewProps ) {
	const [ generatedImageUrl, setGeneratedImageUrl ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );

	const { customText, imageType, imageId, defaultImageId, template, setToken, font } = {
		...useImageGeneratorConfig(),
		...generatorConfigProps,
	};
	const { title, imageUrl } = useSelect( select => {
		const featuredImage = select( editorStore ).getEditedPostAttribute( 'featured_media' );
		return {
			title: select( editorStore ).getEditedPostAttribute( 'title' ),
			imageUrl: calculateImageUrl(
				// @ts-expect-error -- imageType is not properly typed in useImageGeneratorConfig
				imageType,
				imageId,
				featuredImage,
				defaultImageId,
				mediaID => select( coreStore ).getEntityRecord( 'postType', 'attachment', mediaID )
			),
		};
	} );

	const imageTitle = useMemo( () => customText || title || ' ', [ customText, title ] );
	const imageTitleRef = useRef( imageTitle );

	const generatedImageUrlRef = useRef( generatedImageUrl );

	useEffect( () => {
		generatedImageUrlRef.current = generatedImageUrl;
	} );

	useEffect( () => {
		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				if ( imageUrl === FEATURED_IMAGE_STILL_LOADING ) {
					return;
				}

				const sig_token = await apiFetch< string >( {
					path: 'wpcom/v2/publicize/social-image-generator/generate-token',
					method: 'POST',
					data: {
						text: imageTitle,
						image_url: imageUrl,
						template,
						font,
					},
				} );
				setToken?.( sig_token );
				onNewToken?.( sig_token );
				const url = getSigImageUrl( sig_token );
				// If the URL turns out to be the same, we set the loading state to false,
				// as the <img> onLoad event will not fire if the src is the same.
				if ( url === generatedImageUrlRef.current ) {
					setIsLoading( false );
					return;
				}
				setGeneratedImageUrl( url );
			},
			// We only want to debounce on string changes.
			imageTitle === imageTitleRef.current || ! shouldDebounce ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			imageTitleRef.current = imageTitle;
		};
		// setToken is not a dependency here
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ imageTitle, template, imageUrl, font, onNewToken ] );

	const onImageLoad = useCallback( () => {
		setIsLoading( false );
	}, [] );

	return (
		<ThemeProvider>
			<BaseControl __nextHasNoMarginBottom={ true } className={ styles.wrapper }>
				<div className={ styles.container }>
					<img
						className={ clsx( {
							[ styles.hidden ]: isLoading,
						} ) }
						src={ generatedImageUrl }
						alt={ __( 'Generated preview', 'jetpack-publicize-components' ) }
						onLoad={ onImageLoad }
					/>
					{ isLoading && <Spinner data-testid="spinner" /> }
				</div>
			</BaseControl>
		</ThemeProvider>
	);
}
