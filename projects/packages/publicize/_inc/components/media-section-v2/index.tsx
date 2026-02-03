/**
 * MediaSectionV2 component
 * Unified media selection interface for social posts
 */

import { GeneralPurposeImage } from '@automattic/jetpack-ai-client';
import { getRedirectUrl, ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MediaUpload } from '@wordpress/block-editor';
import { BaseControl, Button, ExternalLink } from '@wordpress/components';
import { useCallback, useMemo, useReducer, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import { SELECTABLE_MEDIA_TYPES } from '../../hooks/use-media-restrictions/restrictions';
import { usePostMeta } from '../../hooks/use-post-meta';
import useSigPreview from '../../hooks/use-sig-preview';
import CustomMediaToggle from './custom-media-toggle';
import MediaPreview from './media-preview';
import MediaSourceMenu from './media-source-menu';
import styles from './styles.module.scss';
import { MediaPreviewData, MediaSectionV2Props, MediaSourceType, WPMediaObject } from './types';
import { detectMediaSource } from './utils/detect-media-source';
import { getMediaSourceDescription } from './utils/media-source-options';

/**
 * MediaSectionV2 component
 *
 * @param {MediaSectionV2Props} props - Component props
 * @return MediaSectionV2 component
 */
export default function MediaSectionV2( {
	analyticsData = {},
	disabled = false,
	onEditTemplate,
	attachedMedia: attachedMediaProp,
	imageGeneratorSettings: imageGeneratorSettingsProp,
	mediaSource: mediaSourceProp,
	onMediaChange,
	forceAsAttachment,
}: MediaSectionV2Props ) {
	const { recordEvent } = useAnalytics();
	const featuredImageId = useFeaturedImage();
	const { isEnabled: sigEnabled } = useImageGeneratorConfig();
	const {
		attachedMedia: storeAttachedMedia,
		imageGeneratorSettings: storeImageGeneratorSettings,
		mediaSource: storeMediaSource,
		updateJetpackSocialOptions,
	} = usePostMeta();

	// Check if we're in "controlled" mode (props provided)
	const isControlled = onMediaChange !== undefined;

	// Use props if in controlled mode, otherwise fall back to store values
	const attachedMedia = useMemo(
		() => ( isControlled ? attachedMediaProp ?? [] : storeAttachedMedia ),
		[ isControlled, attachedMediaProp, storeAttachedMedia ]
	);
	const imageGeneratorSettings = useMemo(
		() =>
			isControlled ? imageGeneratorSettingsProp ?? { enabled: false } : storeImageGeneratorSettings,
		[ isControlled, imageGeneratorSettingsProp, storeImageGeneratorSettings ]
	);
	// In controlled mode, use the prop value directly (even if undefined)
	// to allow automatic fallback detection (e.g., featured image)
	const mediaSource = useMemo(
		() => ( isControlled ? mediaSourceProp : storeMediaSource ),
		[ isControlled, mediaSourceProp, storeMediaSource ]
	);

	// Unified update function that uses props callback or store
	const updateMediaOptions = useMemo(
		() => ( isControlled ? onMediaChange : updateJetpackSocialOptions ),
		[ isControlled, onMediaChange, updateJetpackSocialOptions ]
	);

	// Get SIG preview URL when SIG is enabled or when attachment mode is on
	// (so it's available when switching sources with attachment preserved)
	const { url: sigPreviewUrl, isLoading: sigIsLoading } = useSigPreview(
		sigEnabled || mediaSource === 'sig' || attachedMedia?.length > 0
	);

	// Ref to store the MediaUpload open function
	const openMediaLibraryRef = useRef< () => void >( () => {} );

	// State for AI image generation modal
	const [ showAiImageModal, toggleShowAiImageModal ] = useReducer( state => ! state, false );

	// Determine current media source
	// Priority 1: Explicit user choice (if media_source is set)
	// Priority 2: Detect from existing data (backward compatibility)
	const currentSource = useMemo( () => {
		if ( mediaSource !== undefined ) {
			return mediaSource === 'none' ? null : ( mediaSource as MediaSourceType );
		}
		return detectMediaSource( attachedMedia, featuredImageId, sigEnabled );
	}, [ mediaSource, attachedMedia, featuredImageId, sigEnabled ] );

	// Attachment mode:
	// - When attachedMedia has items, this reflects the backend behavior (attached_media is set).
	// - When forceAsAttachment is true, attachment mode is forced on at the UI level, even if attachedMedia is empty.
	const isShareAsAttachment = forceAsAttachment || attachedMedia?.length > 0;

	// Get media ID for preview
	const mediaId = useMemo( () => {
		if ( currentSource === 'featured-image' ) {
			return featuredImageId;
		}
		if ( currentSource === 'media-library' ) {
			return attachedMedia?.[ 0 ]?.id;
		}
		return null;
	}, [ currentSource, featuredImageId, attachedMedia ] );

	const [ mediaDetails ] = useMediaDetails( mediaId );

	// Always fetch featured image details so it's available when switching sources
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );

	const featuredImageData: MediaPreviewData | null = useMemo( () => {
		if ( ! featuredImageId || ! featuredImageDetails?.mediaData ) {
			return null;
		}
		const { sourceUrl } = featuredImageDetails.mediaData;

		return {
			id: featuredImageId,
			url: sourceUrl,
			type: 'image',
		};
	}, [ featuredImageId, featuredImageDetails ] );

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
			// Fallback to featured image when no explicit media and source is undefined/null
			if ( ! currentSource && featuredImageData ) {
				return featuredImageData;
			}
			return null;
		}

		const { sourceUrl } = mediaDetails.mediaData;
		const { mime } = mediaDetails.metaData || {};

		return {
			id: mediaId,
			url: sourceUrl,
			type: mime?.startsWith( 'video/' ) ? 'video' : 'image',
		};
	}, [ currentSource, mediaId, mediaDetails, sigPreviewUrl, featuredImageData ] );

	// Handle media source selection from dropdown
	const handleSourceSelect = useCallback(
		( source: MediaSourceType ) => {
			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source,
			} );

			// Determine attached_media based on source and current attachment state
			let attachedMediaUpdate: Array< { id: number; url: string; type: string } > = [];

			// Preserve attachment state when switching to link preview sources
			if ( isShareAsAttachment ) {
				if ( source === 'featured-image' && featuredImageData ) {
					attachedMediaUpdate = [
						{ id: featuredImageData.id, url: featuredImageData.url, type: 'image/jpeg' },
					];
				} else if ( source === 'sig' ) {
					// Set placeholder even if sigPreviewUrl isn't ready yet - URL will be resolved by backend
					attachedMediaUpdate = [ { id: 0, url: sigPreviewUrl || '', type: 'image/jpeg' } ];
				}
			}

			// Single batch update with explicit media_source and all related fields
			updateMediaOptions( {
				media_source: source || 'none',
				attached_media: attachedMediaUpdate,
				image_generator_settings: {
					...imageGeneratorSettings,
					enabled: source === 'sig',
				},
			} );
		},
		[
			recordEvent,
			analyticsData,
			updateMediaOptions,
			imageGeneratorSettings,
			isShareAsAttachment,
			featuredImageData,
			sigPreviewUrl,
		]
	);

	// Handle media selection from Media Library
	const handleMediaLibrarySelect = useCallback(
		( media: WPMediaObject ) => {
			const { id, url, mime } = media;

			// Single batch update with explicit media_source
			updateMediaOptions( {
				media_source: 'media-library',
				attached_media: [ { id, url, type: mime } ],
				image_generator_settings: { ...imageGeneratorSettings, enabled: false },
			} );

			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source: 'media-library',
			} );
		},
		[ updateMediaOptions, imageGeneratorSettings, recordEvent, analyticsData ]
	);

	const handleMediaLibraryClick = useCallback( () => {
		setTimeout( () => {
			openMediaLibraryRef.current();
		}, 0 );
	}, [] );

	// Handle AI image selection
	const handleAiImageSelect = useCallback(
		( { id, url, mime }: WPMediaObject ) => {
			// Use 'media-library' as the source since the AI image is uploaded to the media library
			updateMediaOptions( {
				media_source: 'media-library',
				attached_media: [ { id, url, type: mime || 'image/png' } ],
				image_generator_settings: { ...imageGeneratorSettings, enabled: false },
			} );

			// Track as 'ai-image' in analytics to distinguish from regular media library selections
			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source: 'ai-image',
			} );

			toggleShowAiImageModal();
		},
		[ updateMediaOptions, imageGeneratorSettings, recordEvent, analyticsData ]
	);

	const renderMediaUpload = useCallback( ( { open }: { open: () => void } ) => {
		openMediaLibraryRef.current = open;
		return null;
	}, [] );

	// Handle remove - reset to automatic detection (allows featured image fallback)
	const handleRemove = useCallback( () => {
		// Reset to undefined to allow automatic detection (e.g., featured image fallback)
		updateMediaOptions( {
			media_source: undefined,
			attached_media: [],
			image_generator_settings: { ...imageGeneratorSettings, enabled: false },
		} );

		recordEvent( 'jetpack_social_media_removed', {
			...analyticsData,
			source: currentSource,
		} );
	}, [ updateMediaOptions, imageGeneratorSettings, recordEvent, analyticsData, currentSource ] );

	// Determine the effective source - for featured image fallback (currentSource is null),
	// treat it as 'featured-image' when there's preview data from featured image
	const effectiveSource = useMemo( () => {
		if ( currentSource ) {
			return currentSource;
		}
		// If no explicit source but we have featured image data showing, treat as featured-image
		if ( featuredImageData && previewData?.id === featuredImageData.id ) {
			return 'featured-image';
		}
		return null;
	}, [ currentSource, featuredImageData, previewData ] );

	// Handle attachment toggle change
	const handleAttachmentToggle = useCallback(
		( checked: boolean ) => {
			if ( checked ) {
				// When turning ON, set the explicit source and attached media
				if ( effectiveSource === 'featured-image' && previewData ) {
					updateMediaOptions( {
						media_source: 'featured-image',
						attached_media: [ { id: previewData.id, url: previewData.url, type: 'image/jpeg' } ],
					} );
				} else if ( effectiveSource === 'sig' ) {
					// Set placeholder even if sigPreviewUrl isn't ready yet - URL will be resolved by backend
					updateMediaOptions( {
						media_source: 'sig',
						attached_media: [ { id: 0, url: sigPreviewUrl || '', type: 'image/jpeg' } ],
						image_generator_settings: { ...imageGeneratorSettings, enabled: true },
					} );
				}
			} else {
				// When turning OFF, keep the current source but clear attachment
				updateMediaOptions( {
					media_source: effectiveSource,
					attached_media: [],
					// Keep SIG enabled if that's the current source
					image_generator_settings: {
						...imageGeneratorSettings,
						enabled: effectiveSource === 'sig',
					},
				} );
			}

			recordEvent(
				checked
					? 'jetpack_social_share_as_attachment_enabled'
					: 'jetpack_social_share_as_attachment_disabled',
				{
					...analyticsData,
					source: effectiveSource,
				}
			);
		},
		[
			effectiveSource,
			previewData,
			sigPreviewUrl,
			updateMediaOptions,
			imageGeneratorSettings,
			recordEvent,
			analyticsData,
		]
	);

	return (
		<ThemeProvider>
			<div className={ styles[ 'media-section' ] }>
				<BaseControl __nextHasNoMarginBottom={ true }>
					<BaseControl.VisualLabel>
						{ __( 'Media', 'jetpack-publicize-pkg' ) }
					</BaseControl.VisualLabel>
					<p className={ styles.description }>
						{ getMediaSourceDescription( currentSource, { featuredImageId } ) }
					</p>

					{ /* MediaUpload component - rendered once, open function stored in ref */ }
					<MediaUpload
						title={ __( 'Select Media', 'jetpack-publicize-pkg' ) }
						onSelect={ handleMediaLibrarySelect }
						allowedTypes={ SELECTABLE_MEDIA_TYPES }
						render={ renderMediaUpload }
					/>

					{ /* Show dropdown + preview when there's media */ }
					{ previewData && (
						<>
							<MediaSourceMenu
								currentSource={ currentSource }
								onSelect={ handleSourceSelect }
								onMediaLibraryClick={ handleMediaLibraryClick }
								onAiImageClick={ toggleShowAiImageModal }
								disabled={ disabled }
								featuredImageId={ featuredImageId }
							>
								{ ( { open } ) => (
									<MediaPreview
										media={ previewData }
										isLoading={ currentSource === 'sig' && sigIsLoading }
										onReplace={ open }
										onRemove={ handleRemove }
										disabled={ disabled }
										showRemove={ currentSource === 'media-library' || currentSource === 'sig' }
									/>
								) }
							</MediaSourceMenu>
							{ currentSource === 'sig' && (
								<Button
									className={ clsx( styles.selectButton, styles.editTemplateButton ) }
									variant="secondary"
									onClick={ onEditTemplate }
									disabled={ disabled }
								>
									{ __( 'Edit template', 'jetpack-publicize-pkg' ) }
								</Button>
							) }
							<CustomMediaToggle
								source={ effectiveSource }
								checked={ isShareAsAttachment }
								onChange={ handleAttachmentToggle }
								disabled={ forceAsAttachment || disabled }
							/>
						</>
					) }

					{ /* Show dropdown when no media */ }
					{ ! previewData && (
						<MediaSourceMenu
							currentSource={ currentSource }
							onSelect={ handleSourceSelect }
							onMediaLibraryClick={ handleMediaLibraryClick }
							onAiImageClick={ toggleShowAiImageModal }
							disabled={ disabled }
							featuredImageId={ featuredImageId }
						/>
					) }
					{ currentSource === 'media-library' && (
						<ExternalLink
							href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }
							className={ styles[ 'learn-more' ] }
						>
							{ __( 'Learn photo and video best practices', 'jetpack-publicize-pkg' ) }
						</ExternalLink>
					) }
				</BaseControl>
			</div>
			{ showAiImageModal && (
				<GeneralPurposeImage
					placement="social-media-dropdown"
					onClose={ toggleShowAiImageModal }
					onSetImage={ handleAiImageSelect }
				/>
			) }
		</ThemeProvider>
	);
}
