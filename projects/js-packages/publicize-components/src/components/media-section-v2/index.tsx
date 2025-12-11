/**
 * MediaSectionV2 component
 * Unified media selection interface for social posts
 */

import { ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MediaUpload } from '@wordpress/block-editor';
import { BaseControl, Button, Notice } from '@wordpress/components';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
 * @return {JSX.Element} MediaSectionV2 component
 */
export default function MediaSectionV2( {
	analyticsData = {},
	disabled = false,
	onEditTemplate,
}: MediaSectionV2Props ) {
	const { recordEvent } = useAnalytics();
	const featuredImageId = useFeaturedImage();
	const { isEnabled: sigEnabled } = useImageGeneratorConfig();
	const { attachedMedia, imageGeneratorSettings, mediaSource, updateJetpackSocialOptions } =
		usePostMeta();

	// Get SIG preview URL when SIG is enabled
	const { url: sigPreviewUrl, isLoading: sigIsLoading } = useSigPreview( sigEnabled );

	// Ref to store the MediaUpload open function
	const openMediaLibraryRef = useRef< () => void >( () => {} );

	// Determine current media source
	// Priority 1: Explicit user choice (if media_source is set)
	// Priority 2: Detect from existing data (backward compatibility)
	const currentSource = useMemo( () => {
		if ( mediaSource !== undefined ) {
			return mediaSource === 'none' ? null : ( mediaSource as MediaSourceType );
		}
		return detectMediaSource( attachedMedia, featuredImageId, sigEnabled );
	}, [ mediaSource, attachedMedia, featuredImageId, sigEnabled ] );

	// Attachment mode: check if attached_media has items (matches backend is_social_post())
	const isShareAsAttachment = attachedMedia?.length > 0;

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

			// Single batch update with explicit media_source and all related fields
			updateJetpackSocialOptions( {
				media_source: source || 'none',
				attached_media: [], // Reset attachment when changing source
				image_generator_settings: {
					...imageGeneratorSettings,
					enabled: source === 'sig',
				},
			} );
		},
		[ recordEvent, analyticsData, updateJetpackSocialOptions, imageGeneratorSettings ]
	);

	// Handle media selection from Media Library
	const handleMediaLibrarySelect = useCallback(
		( media: WPMediaObject ) => {
			const { id, url, mime: type } = media;

			// Single batch update with explicit media_source
			updateJetpackSocialOptions( {
				media_source: 'media-library',
				attached_media: [ { id, url, type } ],
				image_generator_settings: { ...imageGeneratorSettings, enabled: false },
			} );

			recordEvent( 'jetpack_social_media_source_changed', {
				...analyticsData,
				source: 'media-library',
			} );
		},
		[ updateJetpackSocialOptions, imageGeneratorSettings, recordEvent, analyticsData ]
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
		// Single batch update with explicit 'none' source
		updateJetpackSocialOptions( {
			media_source: 'none',
			attached_media: [],
			image_generator_settings: { ...imageGeneratorSettings, enabled: false },
		} );

		recordEvent( 'jetpack_social_media_removed', {
			...analyticsData,
			source: currentSource,
		} );
	}, [
		updateJetpackSocialOptions,
		imageGeneratorSettings,
		recordEvent,
		analyticsData,
		currentSource,
	] );

	// Handle attachment toggle change
	const handleAttachmentToggle = useCallback(
		( checked: boolean ) => {
			if ( currentSource === 'featured-image' && previewData ) {
				// Featured image: toggle attachment mode
				updateJetpackSocialOptions( {
					media_source: 'featured-image',
					attached_media: checked
						? [ { id: previewData.id, url: previewData.url, type: 'image/jpeg' } ]
						: [],
				} );
			} else if ( currentSource === 'sig' && sigPreviewUrl ) {
				// SIG: toggle attachment mode (add SIG URL to attached_media)
				updateJetpackSocialOptions( {
					media_source: 'sig',
					attached_media: checked ? [ { id: 0, url: sigPreviewUrl, type: 'image/jpeg' } ] : [],
					// Keep SIG enabled regardless
					image_generator_settings: { ...imageGeneratorSettings, enabled: true },
				} );
			}

			recordEvent(
				checked
					? 'jetpack_social_share_as_attachment_enabled'
					: 'jetpack_social_share_as_attachment_disabled',
				{
					...analyticsData,
					source: currentSource,
				}
			);
		},
		[
			currentSource,
			previewData,
			sigPreviewUrl,
			updateJetpackSocialOptions,
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
						<>
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
							{ currentSource === 'sig' && (
								<Button
									className={ styles.selectButton }
									variant="secondary"
									onClick={ onEditTemplate }
									disabled={ disabled }
								>
									{ __( 'Edit template', 'jetpack-publicize-components' ) }
								</Button>
							) }
							<CustomMediaToggle
								source={ currentSource }
								checked={ isShareAsAttachment }
								onChange={ handleAttachmentToggle }
								disabled={ disabled }
							/>
						</>
					) }

					{ /* Show dropdown when no media */ }
					{ ! previewData && (
						<>
							<MediaSourceMenu
								currentSource={ currentSource }
								onSelect={ handleSourceSelect }
								onMediaLibraryClick={ handleMediaLibraryClick }
								disabled={ disabled }
							/>
							{ currentSource === 'featured-image' && ! featuredImageId && (
								<Notice status="warning" isDismissible={ false } className={ styles.notice }>
									{ __(
										'Your post does not have a featured image.',
										'jetpack-publicize-components'
									) }
								</Notice>
							) }
						</>
					) }
				</BaseControl>
			</div>
		</ThemeProvider>
	);
}
