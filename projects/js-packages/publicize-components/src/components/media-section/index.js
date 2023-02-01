import { Button, ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	ResponsiveWrapper,
	ExternalLink,
	Spinner,
	Notice,
	BaseControl,
	VisuallyHidden,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { useEffect, useState } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaRestrictions, {
	isVideo,
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
	VIDEO_LENGTH_TOO_LONG_ERROR,
	VIDEO_LENGTH_TOO_SHORT_ERROR,
} from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import VideoPreview from '../video-preview';
import styles from './styles.module.scss';

/**
 * Get meta data from a VideoPress video.
 *
 * @param {object} video - VideoPress media object.
 * @returns {Promise} A promise containing {mime: string, fileSize: number, length: number}}
 */
const getVideoPressMetadata = async video => {
	if (
		! video?.media_details?.videopress?.original ||
		! video?.media_details?.videopress?.duration
	) {
		return {};
	}

	const response = await fetch( video?.media_details?.videopress?.original, { method: 'HEAD' } );
	const contentLength = response.headers.get( 'content-length' );
	const contentType = response.headers.get( 'content-type' );

	if ( ! contentLength || ! contentType ) {
		return {};
	}

	return {
		mime: contentType,
		fileSize: contentLength,
		length: Math.round( video.media_details.videopress.duration / 1000 ),
	};
};

/**
 * Get relevant details from a WordPress media object.
 *
 * @param {object} media - WordPress media object.
 * @returns {Promise} An object containing mediaData and metaData.
 */
const getMediaDetails = async media => {
	if ( ! media ) {
		return {};
	}

	let metaData = {
		mime: media.mime_type,
		fileSize: media.media_details.filesize,
		length: media.media_details?.length,
	};

	if ( media.mime_type === 'video/videopress' ) {
		metaData = await getVideoPressMetadata( media );
	}

	const sizes = media?.media_details?.sizes ?? {};

	if ( Object.keys( sizes ).length === 0 ) {
		return {
			mediaData: {
				width: media.media_details.width,
				height: media.media_details.height,
				sourceUrl: media.source_url,
			},
			metaData,
		};
	}

	const mediaObject = sizes.large || sizes.thumbnail;

	return {
		mediaData: {
			width: mediaObject.width,
			height: mediaObject.height,
			sourceUrl: mediaObject.source_url,
		},
		metaData,
	};
};

const ADD_MEDIA_LABEL = __( 'Choose Media', 'jetpack' );

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const [ validationError, setValidationError ] = useState( null );
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const { enabledConnections } = useSocialMediaConnections();
	const [ mediaDetails, setMediaDetails ] = useState( {} );

	const { maxImageSize, getValidationError, allowedMediaTypes } = useMediaRestrictions(
		enabledConnections
	);

	const validationErrorMessages = {
		[ FILE_TYPE_ERROR ]: __(
			'The selected media type is not accepted by these platforms.',
			'jetpack'
		),
		[ FILE_SIZE_ERROR ]: sprintf(
			/* translators: placeholder is the maximum image size in MB */
			__( 'This media is over %d MB and cannot be used for these platforms.', 'jetpack' ),
			maxImageSize
		),
		[ VIDEO_LENGTH_TOO_LONG_ERROR ]: __(
			'The selected video is too long for these platforms.',
			'jetpack'
		),
		[ VIDEO_LENGTH_TOO_SHORT_ERROR ]: __(
			'The selected video is too short for these platforms.',
			'jetpack'
		),
	};

	const mediaObject = useSelect(
		select => select( 'core' ).getMedia( attachedMedia[ 0 ]?.id || null, { context: 'view' } ),
		[ attachedMedia[ 0 ] ]
	);

	useEffect( () => {
		try {
			( async () => {
				const details = await getMediaDetails( mediaObject );

				if ( details && Object.keys( details ).length ) {
					setMediaDetails( details );
				}
			} )();
		} catch {
			setMediaDetails( {} );
		}
	}, [ mediaObject ] );

	useEffect( () => {
		// Removes selected media if connection change results in invalid image
		if ( ! mediaDetails.metaData ) {
			return;
		}

		const error = getValidationError( mediaDetails.metaData );
		if ( error ) {
			setValidationError( error );
			updateAttachedMedia( [] );
			setMediaDetails( {} );
		}
	}, [ updateAttachedMedia, getValidationError, mediaDetails ] );

	const onRemoveMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );
	const onUpdateMedia = useCallback(
		media => {
			const { id, url } = media;

			updateAttachedMedia( [ { id, url } ] );
			setValidationError( null );
		},
		[ updateAttachedMedia ]
	);

	const renderPreview = useCallback(
		open => {
			const {
				mediaData: { width, height, sourceUrl } = {},
				metaData: { mime, length } = {},
			} = mediaDetails;

			if ( ! sourceUrl || ! width || ! height || ! mime || ! length ) {
				return null;
			}

			return (
				<div className={ styles[ 'preview-wrapper' ] }>
					<button className={ styles.remove } onClick={ onRemoveMedia }>
						<VisuallyHidden>{ __( 'Remove media', 'jetpack' ) }</VisuallyHidden>
						<Icon icon={ closeSmall } />
					</button>
					<button className={ styles.preview } onClick={ open }>
						{ isVideo( mime ) ? (
							<VideoPreview
								sourceUrl={ sourceUrl }
								mime={ mime }
								duration={ length }
							></VideoPreview>
						) : (
							<ResponsiveWrapper naturalWidth={ width } naturalHeight={ height } isInline>
								<img src={ sourceUrl } alt="" />
							</ResponsiveWrapper>
						) }
					</button>
				</div>
			);
		},
		[ mediaDetails, onRemoveMedia ]
	);

	const renderPicker = useCallback(
		open => (
			<div className={ styles.container }>
				{ ! attachedMedia.length ? (
					<>
						<Button
							variant="secondary"
							size="small"
							className={ mediaObject && styles.preview }
							onClick={ open }
						>
							{ ! attachedMedia.length && ADD_MEDIA_LABEL }
						</Button>
						<span>{ __( 'Add an image or video', 'jetpack' ) }</span>
					</>
				) : (
					<Spinner />
				) }
			</div>
		),
		[ mediaObject, attachedMedia ]
	);

	const setMediaRender = useCallback(
		( { open } ) => ( mediaObject ? renderPreview( open ) : renderPicker( open ) ),
		[ mediaObject, renderPreview, renderPicker ]
	);

	const onDismissClick = useCallback( () => setValidationError( null ), [] );

	return (
		<ThemeProvider>
			<BaseControl label={ __( 'Media', 'jetpack' ) } className={ styles.wrapper }>
				<MediaUploadCheck>
					<p className={ styles.subtitle }>
						{ __( 'Choose a visual to accompany your post.', 'jetpack' ) }
					</p>
					<MediaUpload
						title={ ADD_MEDIA_LABEL }
						onSelect={ onUpdateMedia }
						allowedTypes={ allowedMediaTypes }
						render={ setMediaRender }
						value={ attachedMedia[ 0 ]?.id }
					/>
					<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
						{ __( 'Learn photo and video best practices', 'jetpack' ) }
					</ExternalLink>
					{ validationError && (
						<Notice
							className={ styles.notice }
							isDismissible={ true }
							onDismiss={ onDismissClick }
							status="warning"
						>
							<p>{ validationErrorMessages[ validationError ] }</p>
							<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
								{ __( 'Troubleshooting tips', 'jetpack' ) }
							</ExternalLink>
						</Notice>
					) }
				</MediaUploadCheck>
			</BaseControl>
		</ThemeProvider>
	);
}
