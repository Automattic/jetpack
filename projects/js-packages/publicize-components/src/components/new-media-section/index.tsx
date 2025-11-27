/**
 * NewMediaSection component
 * Unified media selection interface for social posts
 */

import { ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MediaUpload } from '@wordpress/block-editor';
import { BaseControl } from '@wordpress/components';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import { SELECTABLE_MEDIA_TYPES } from '../../hooks/use-media-restrictions/restrictions';
import { usePostMeta } from '../../hooks/use-post-meta';
import useSigPreview from '../../hooks/use-sig-preview';
import MediaPreview from './media-preview';
import MediaSourceMenu, { getMediaSourceDescription } from './media-source-menu';
import styles from './styles.module.scss';
import { MediaSourceType, NewMediaSectionProps, MediaPreviewData, WPMediaObject } from './types';

/**
 * Detect the current media source based on existing data
 *
 * @param {Array}   attachedMedia   - Attached media array
 * @param {number}  featuredImageId - Featured image ID
 * @param {boolean} sigEnabled      - Whether SIG is enabled
 * @return {string|null} Current media source type
 */
function detectMediaSource(
	attachedMedia: Array< { id: number; url: string; type: string } >,
	featuredImageId: number | null,
	sigEnabled: boolean
): MediaSourceType {
	// Priority 1: Attached media (uploaded content)
	if ( attachedMedia && attachedMedia.length > 0 ) {
		return attachedMedia[ 0 ].type?.startsWith( 'video/' ) ? 'upload-video' : 'media-library';
	}

	// Priority 2: Social Image Generator
	if ( sigEnabled ) {
		return 'sig';
	}

	// Priority 3: Featured Image
	if ( featuredImageId ) {
		return 'featured-image';
	}

	// No media selected
	return null;
}

/**
 * NewMediaSection component
 *
 * @param {object}  props               - Component props
 * @param {object}  props.analyticsData - Analytics data
 * @param {boolean} props.disabled      - Whether the section is disabled
 * @return {object} NewMediaSection component
 */
export default function NewMediaSection( {
	analyticsData = {},
	disabled = false,
}: NewMediaSectionProps ) {
	const { recordEvent } = useAnalytics();
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const { isEnabled: sigEnabled, setIsEnabled: setSigEnabled } = useImageGeneratorConfig();
	const { imageGeneratorSettings, updateJetpackSocialOptions } = usePostMeta();

	// Get SIG preview URL when SIG is enabled
	const { url: sigPreviewUrl, isLoading: sigIsLoading } = useSigPreview( sigEnabled );

	// Track if user explicitly chose "no media" (to override featured image detection)
	const [ userSelectedNoMedia, setUserSelectedNoMedia ] = useState( false );

	// Ref to store the MediaUpload open function
	const openMediaLibraryRef = useRef< () => void >( () => {} );

	// Detect current media source
	const currentSource = useMemo( () => {
		// If user explicitly selected "no media", respect that choice
		if ( userSelectedNoMedia ) {
			return null;
		}
		return detectMediaSource( attachedMedia, featuredImageId, sigEnabled );
	}, [ attachedMedia, featuredImageId, sigEnabled, userSelectedNoMedia ] );

	// Get media ID for preview
	const mediaId = useMemo( () => {
		if ( currentSource === 'featured-image' ) {
			return featuredImageId;
		}
		if ( currentSource === 'media-library' || currentSource === 'upload-video' ) {
			return attachedMedia?.[ 0 ]?.id;
		}
		return null;
	}, [ currentSource, featuredImageId, attachedMedia ] );

	const [ mediaDetails ] = useMediaDetails( mediaId );

	const previewData: MediaPreviewData | null = useMemo( () => {
		// Use SIG preview URL when SIG is selected
		// Always return an object (even with empty URL) so the loading spinner can show
		if ( currentSource === 'sig' ) {
			return {
				id: 0,
				url: sigPreviewUrl || '',
				type: 'image',
			};
		}

		if ( ! mediaId || ! mediaDetails?.mediaData ) {
			return null;
		}

		const { sourceUrl } = mediaDetails.mediaData;
		const { mime } = mediaDetails.metaData || {};

		return {
			id: mediaId,
			url: sourceUrl,
			type: mime?.startsWith( 'video/' ) ? 'video' : 'image',
		};
	}, [ currentSource, mediaId, mediaDetails, sigPreviewUrl ] );

	// Handle media source selection from dropdown
	const handleSourceSelect = useCallback(
		( source: MediaSourceType ) => {
			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source,
			} );

			setUserSelectedNoMedia( false );

			switch ( source ) {
				case 'featured-image':
					// Turn SIG off, clear attached media (batch update to avoid race condition)
					updateJetpackSocialOptions( {
						attached_media: [],
						image_generator_settings: { ...imageGeneratorSettings, enabled: false },
					} );
					break;

				case 'sig':
					// Turn SIG on, clear attached media (batch update to avoid race condition)
					updateJetpackSocialOptions( {
						attached_media: [],
						image_generator_settings: { ...imageGeneratorSettings, enabled: true },
					} );
					break;

				case 'media-library':
				case 'upload-video':
					// Turn SIG off, attached media is set in handleMediaLibrarySelect
					if ( sigEnabled ) {
						setSigEnabled( false );
					}
					break;
			}
		},
		[
			recordEvent,
			analyticsData,
			updateJetpackSocialOptions,
			imageGeneratorSettings,
			setSigEnabled,
			sigEnabled,
		]
	);

	// Handle media selection from Media Library
	const handleMediaLibrarySelect = useCallback(
		( media: WPMediaObject ) => {
			const { id, url, mime: type } = media;
			updateAttachedMedia( [ { id, url, type } ] );
			setUserSelectedNoMedia( false );

			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source: 'media-library',
			} );
		},
		[ updateAttachedMedia, recordEvent, analyticsData ]
	);

	const handleMediaLibraryClick = useCallback( () => {
		setTimeout( () => {
			openMediaLibraryRef.current();
		}, 0 );
	}, [] );

	const renderMediaUpload = useCallback( ( { open }: { open: () => void } ) => {
		openMediaLibraryRef.current = open;
		return null;
	}, [] );

	// Handle remove - go to "no image" state
	const handleRemove = useCallback( () => {
		updateAttachedMedia( [] );
		setSigEnabled( false );
		setUserSelectedNoMedia( true );

		recordEvent( 'jetpack_social_media_removed', {
			...analyticsData,
			source: currentSource,
		} );
	}, [ updateAttachedMedia, setSigEnabled, recordEvent, analyticsData, currentSource ] );

	return (
		<ThemeProvider>
			<div className={ styles[ 'media-section' ] }>
				<BaseControl __nextHasNoMarginBottom={ true }>
					<BaseControl.VisualLabel>
						{ __( 'Media', 'jetpack-publicize-components' ) }
					</BaseControl.VisualLabel>
					<p className={ styles.description }>{ getMediaSourceDescription( currentSource ) }</p>

					{ /* MediaUpload component - rendered once, open function stored in ref */ }
					<MediaUpload
						title={ __( 'Select Media', 'jetpack-publicize-components' ) }
						onSelect={ handleMediaLibrarySelect }
						allowedTypes={ SELECTABLE_MEDIA_TYPES }
						render={ renderMediaUpload }
					/>

					{ /* Show dropdown + preview when there's media */ }
					{ previewData && (
						<MediaSourceMenu
							currentSource={ currentSource }
							onSelect={ handleSourceSelect }
							onMediaLibraryClick={ handleMediaLibraryClick }
							disabled={ disabled }
						>
							{ ( { open } ) => (
								<MediaPreview
									media={ previewData }
									isLoading={ currentSource === 'sig' && sigIsLoading }
									onReplace={ open }
									onRemove={ handleRemove }
									disabled={ disabled }
								/>
							) }
						</MediaSourceMenu>
					) }

					{ /* Show dropdown when no media */ }
					{ ! previewData && (
						<MediaSourceMenu
							currentSource={ currentSource }
							onSelect={ handleSourceSelect }
							onMediaLibraryClick={ handleMediaLibraryClick }
							disabled={ disabled }
						/>
					) }
				</BaseControl>
			</div>
		</ThemeProvider>
	);
}
