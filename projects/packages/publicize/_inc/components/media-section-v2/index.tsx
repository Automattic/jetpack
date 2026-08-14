/**
 * MediaSectionV2 component
 * Unified media selection interface for social posts
 */

import { GeneralPurposeImage } from '@automattic/jetpack-ai-client';
import { getRedirectUrl, ThemeProvider } from '@automattic/jetpack-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MediaUpload } from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { useCallback, useMemo, useReducer, useRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import { SELECTABLE_MEDIA_TYPES } from '../../hooks/use-media-restrictions/restrictions';
import { usePostMeta } from '../../hooks/use-post-meta';
import useSigPreview from '../../hooks/use-sig-preview';
import { features } from '../../utils';
import CustomMediaToggle from './custom-media-toggle';
import MediaFocalPoint from './media-focal-point';
import MediaPreview from './media-preview';
import MediaSourceMenu from './media-source-menu';
import styles from './styles.module.scss';
import { MediaPreviewData, MediaSectionV2Props, MediaSourceType, WPMediaObject } from './types';
import { useMediaFocalPoint } from './use-media-focal-point';
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
	attachmentToggleMode = 'visible',
}: MediaSectionV2Props ) {
	const isAttachmentToggleHidden = attachmentToggleMode === 'hidden';
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

	/*
	 * Determine current media source.
	 * Priority 1: Explicit user choice (if media_source is set).
	 * Priority 2 (global mode only): detect from existing data (backward compatibility).
	 * In per-network mode (toggle hidden), no explicit source means Default (null) — we
	 * skip auto-detection so the dropdown doesn't show e.g. "Featured image" for a
	 * connection whose attached_media is empty (which would mislead the user into
	 * thinking the image is attached when it isn't).
	 */
	const currentSource = useMemo( () => {
		if ( mediaSource !== undefined ) {
			return mediaSource === 'none' ? null : ( mediaSource as MediaSourceType );
		}
		if ( isAttachmentToggleHidden ) {
			return null;
		}
		return detectMediaSource( attachedMedia, featuredImageId, sigEnabled );
	}, [ mediaSource, isAttachmentToggleHidden, attachedMedia, featuredImageId, sigEnabled ] );

	/*
	 * Attachment mode:
	 * - When attachedMedia has items, this reflects the backend behavior (attached_media is set).
	 * - When the attachment toggle is hidden (per-network mode), attachment mode is implicit:
	 *   the dropdown alone decides — non-Default sources always attach.
	 */
	const isShareAsAttachment = isAttachmentToggleHidden || attachedMedia?.length > 0;

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
			/*
			 * Default mode (no explicit source) — mirror the post-level OG resolution
			 * priority so the preview matches what the destination network will actually
			 * serve: SIG (if globally enabled) → featured image → nothing.
			 */
			if ( ! currentSource ) {
				if ( sigEnabled ) {
					return { id: 0, url: sigPreviewUrl || '', type: 'image' };
				}
				if ( featuredImageData ) {
					return featuredImageData;
				}
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
	}, [ currentSource, mediaId, mediaDetails, sigEnabled, sigPreviewUrl, featuredImageData ] );

	// Preview will render the SIG image whenever SIG is the explicit source or the OG fallback in Default mode.
	const isPreviewingSig = currentSource === 'sig' || ( ! currentSource && sigEnabled );

	// The focal point lives on the image (attachment meta), so it's the same point in
	// every mode and every post that uses the image.
	const {
		value: focalPointValue,
		canEdit: canEditImage,
		setPreviewFocalPoint,
		setFocalPoint,
	} = useMediaFocalPoint( previewData?.id ?? 0 );

	/*
	 * The focal point can only be set against a real image attachment the user can edit:
	 * hidden for SIG (attachment id 0), video, and images the user can't edit (v1: no
	 * fallback — the static preview shows instead). Gated on the wpcom-controlled rollout
	 * flag until the cropping consumers ship.
	 */
	const showFocalPointPicker =
		siteHasFeature( features.IMAGE_FOCAL_POINT ) &&
		previewData?.type === 'image' &&
		previewData.id > 0 &&
		canEditImage === true;

	// Handle media source selection from dropdown
	const handleSourceSelect = useCallback(
		( source: MediaSourceType ) => {
			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source,
			} );

			/*
			 * Default (source === null) means "no per-connection override" — unset both fields
			 * so the saved override entry doesn't carry a media_source. The REST layer drops
			 * fields whose value is undefined (isset() check), and wpcom's Extractor treats a
			 * missing media_source as 'none' anyway, so this cleans up the persisted shape
			 * without changing runtime behavior.
			 */
			if ( source === null ) {
				updateMediaOptions( {
					media_source: undefined,
					attached_media: undefined,
					image_generator_settings: {
						...imageGeneratorSettings,
						enabled: false,
					},
				} );
				return;
			}

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
				media_source: source,
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

	// Callback for external handlers to update the selected image
	const onImageSelectCallback = useCallback(
		( image: { id: number; url: string; mime?: string } ) => {
			// Update media without toggling modal (custom handler manages its own UI)
			updateMediaOptions( {
				media_source: 'media-library',
				attached_media: [ { id: image.id, url: image.url, type: image.mime || 'image/png' } ],
				image_generator_settings: { ...imageGeneratorSettings, enabled: false },
			} );
			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source: 'ai-image',
			} );
		},
		[ updateMediaOptions, imageGeneratorSettings, recordEvent, analyticsData ]
	);

	// Filter to allow external plugins (e.g., Image Studio) to replace the image generation flow
	const imageGenerationHandler = useMemo( () => {
		const handler = applyFilters( 'jetpack.ai.imageGenerationHandler', null, {
			entryPoint: 'social-media',
			onImageSelect: onImageSelectCallback,
		} );
		// Runtime type check: only accept functions
		return typeof handler === 'function' ? ( handler as () => void ) : null;
	}, [ onImageSelectCallback ] );

	const handleAiImageClick = useCallback( () => {
		if ( imageGenerationHandler ) {
			imageGenerationHandler();
		} else {
			toggleShowAiImageModal();
		}
	}, [ imageGenerationHandler, toggleShowAiImageModal ] );

	const renderMediaUpload = useCallback( ( { open }: { open: () => void } ) => {
		openMediaLibraryRef.current = open;
		return null;
	}, [] );

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
						{ getMediaSourceDescription( currentSource, {
							featuredImageId,
							sigEnabled,
						} ) }
					</p>

					{ /* MediaUpload component - rendered once, open function stored in ref */ }
					<MediaUpload
						title={ __( 'Select Media', 'jetpack-publicize-pkg' ) }
						onSelect={ handleMediaLibrarySelect }
						allowedTypes={ SELECTABLE_MEDIA_TYPES }
						render={ renderMediaUpload }
					/>

					{ /* Show preview + dropdown when there's media */ }
					{ previewData && (
						<>
							{ showFocalPointPicker ? (
								<MediaFocalPoint
									url={ previewData.url }
									value={ focalPointValue }
									onChange={ setFocalPoint }
									onDrag={ setPreviewFocalPoint }
								/>
							) : (
								<MediaPreview media={ previewData } isLoading={ isPreviewingSig && sigIsLoading } />
							) }
							<div className={ styles.actions }>
								<MediaSourceMenu
									currentSource={ currentSource }
									onSelect={ handleSourceSelect }
									onMediaLibraryClick={ handleMediaLibraryClick }
									onAiImageClick={ handleAiImageClick }
									disabled={ disabled }
									featuredImageId={ featuredImageId }
									includeDefaultOption={ isAttachmentToggleHidden }
								/>
								{ currentSource === 'sig' && (
									<div className={ styles.action }>
										<Button
											__next40pxDefaultSize
											className={ styles.selectButton }
											variant="primary"
											onClick={ onEditTemplate }
											disabled={ disabled }
										>
											{ __( 'Edit', 'jetpack-publicize-pkg' ) }
										</Button>
									</div>
								) }
							</div>
							{ ! isAttachmentToggleHidden && (
								<CustomMediaToggle
									source={ effectiveSource }
									checked={ isShareAsAttachment }
									onChange={ handleAttachmentToggle }
									disabled={ disabled }
								/>
							) }
						</>
					) }

					{ /* Show dropdown when no media */ }
					{ ! previewData && (
						<MediaSourceMenu
							currentSource={ currentSource }
							onSelect={ handleSourceSelect }
							onMediaLibraryClick={ handleMediaLibraryClick }
							onAiImageClick={ handleAiImageClick }
							disabled={ disabled }
							featuredImageId={ featuredImageId }
							includeDefaultOption={ isAttachmentToggleHidden }
						/>
					) }
					{ currentSource === 'media-library' && (
						<Link
							openInNewTab
							href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }
							className={ styles[ 'learn-more' ] }
						>
							{ __( 'Learn photo and video best practices', 'jetpack-publicize-pkg' ) }
						</Link>
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
