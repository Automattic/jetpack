import apiFetch from '@wordpress/api-fetch';
import { store as coreStore, Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import {
	calculateImageUrl,
	FEATURED_IMAGE_STILL_LOADING,
} from '../../components/generated-image-preview';
import { getSigImageUrl } from '../../components/generated-image-preview/utils';
import useImageGeneratorConfig from '../use-image-generator-config';

interface UseSigPreviewResult {
	url: string | null;
	isLoading: boolean;
}

/**
 * Hook to fetch and manage Social Image Generator preview URL.
 *
 * @param {boolean} enabled - Whether SIG preview should be fetched
 * @return {UseSigPreviewResult} The SIG preview URL and loading state
 */
export default function useSigPreview( enabled: boolean ): UseSigPreviewResult {
	const [ generatedImageUrl, setGeneratedImageUrl ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );

	const { customText, imageType, imageId, defaultImageId, template, setToken, font } =
		useImageGeneratorConfig();

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
				( mediaID: number | null ) =>
					select( coreStore ).getEntityRecord( 'postType', 'attachment', mediaID ) as Attachment
			),
		};
	} );

	const imageTitle = useMemo( () => customText || title || ' ', [ customText, title ] );
	const imageTitleRef = useRef( imageTitle );

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		if ( imageUrl === FEATURED_IMAGE_STILL_LOADING ) {
			return;
		}

		const handler = setTimeout(
			async () => {
				setIsLoading( true );

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
				const url = getSigImageUrl( sig_token );
				setGeneratedImageUrl( url );
				setIsLoading( false );
			},
			// We only want to debounce on string changes.
			imageTitle === imageTitleRef.current ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			imageTitleRef.current = imageTitle;
		};
		// setToken is not a dependency here (same as original GeneratedImagePreview)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ enabled, imageTitle, template, imageUrl, font ] );

	// Show loading if enabled and either actively loading or no URL yet
	const showLoading = enabled && ( isLoading || ! generatedImageUrl );

	return {
		url: enabled ? generatedImageUrl : null,
		isLoading: showLoading,
	};
}
