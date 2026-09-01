import apiFetch from '@wordpress/api-fetch';
import { store as coreStore, Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import useImageGeneratorConfig from '../use-image-generator-config';
import {
	calculateImageUrl,
	FEATURED_IMAGE_STILL_LOADING,
	getSigImageUrl,
	ImageType,
} from './utils';

interface UseSigPreviewOptions {
	/**
	 * Whether to debounce the preview generation on text changes.
	 * @default true
	 */
	shouldDebounce?: boolean;
	/**
	 * Callback fired when a new token is generated.
	 */
	onNewToken?: ( token: string ) => void;
	/**
	 * Override the custom text from the image generator config.
	 */
	customText?: string;
	/**
	 * Override the image type from the image generator config.
	 */
	imageType?: ImageType;
	/**
	 * Override the image ID from the image generator config.
	 */
	imageId?: number | null;
	/**
	 * Override the default image ID from the image generator config.
	 */
	defaultImageId?: number | null;
	/**
	 * Override the template from the image generator config.
	 */
	template?: string;
	/**
	 * Override the font from the image generator config.
	 */
	font?: string;
}

interface UseSigPreviewResult {
	url: string | null;
	isLoading: boolean;
}

/**
 * Hook to fetch and manage Social Image Generator preview URL.
 *
 * @param {boolean}              enabled - Whether SIG preview should be fetched
 * @param {UseSigPreviewOptions} options - Optional configuration overrides
 * @return {UseSigPreviewResult} The SIG preview URL and loading state
 */
export default function useSigPreview(
	enabled: boolean,
	options: UseSigPreviewOptions = {}
): UseSigPreviewResult {
	const { shouldDebounce = true, onNewToken, ...configOverrides } = options;

	const [ generatedImageUrl, setGeneratedImageUrl ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( true );

	const config = useImageGeneratorConfig();
	const { customText, imageType, imageId, defaultImageId, template, font } = {
		...config,
		...configOverrides,
	};
	const { setToken } = config;

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
				( mediaID: number | null ) => {
					if ( ! mediaID ) {
						return null;
					}
					const media = select( coreStore ).getEntityRecord< Attachment >(
						'postType',
						'attachment',
						mediaID,
						{ context: 'view' }
					);
					if ( media ) {
						return media;
					}
					// If resolution finished but media is still undefined, the attachment doesn't exist
					const hasResolved = select( coreStore ).hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'attachment',
						mediaID,
						{ context: 'view' },
					] );
					return hasResolved ? null : undefined;
				}
			),
		};
	} );

	const imageTitle = useMemo( () => customText || title || ' ', [ customText, title ] );
	const imageTitleRef = useRef( imageTitle );

	// Ref to track current enabled state, used to prevent stale closure issues
	// when async fetch completes after user has disabled SIG
	const enabledRef = useRef( enabled );
	enabledRef.current = enabled;

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		if ( imageUrl === FEATURED_IMAGE_STILL_LOADING ) {
			return;
		}

		const controller = new AbortController();

		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				try {
					const sigToken = await apiFetch< string >( {
						path: 'wpcom/v2/publicize/social-image-generator/generate-token',
						method: 'POST',
						data: {
							text: imageTitle,
							image_url: imageUrl,
							template,
							font,
						},
						signal: controller.signal,
					} );

					// Check if SIG is still enabled before updating token
					// This prevents race conditions where user disabled SIG while fetch was in progress
					if ( ! enabledRef.current ) {
						return;
					}

					setToken?.( sigToken );
					onNewToken?.( sigToken );

					const url = getSigImageUrl( sigToken );
					setGeneratedImageUrl( url );
				} catch {
					if ( ! controller.signal.aborted ) {
						// Token generation failed — clear the URL so the preview shows the empty state
						setGeneratedImageUrl( null );
					}
				} finally {
					if ( ! controller.signal.aborted ) {
						setIsLoading( false );
					}
				}
			},
			// We only want to debounce on string changes.
			imageTitle === imageTitleRef.current || ! shouldDebounce ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			controller.abort();
			imageTitleRef.current = imageTitle;
		};
		// setToken is not a dependency here (same as original GeneratedImagePreview)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ enabled, imageTitle, template, imageUrl, font, onNewToken, shouldDebounce ] );

	return {
		url: enabled ? generatedImageUrl : null,
		isLoading: enabled && isLoading,
	};
}
