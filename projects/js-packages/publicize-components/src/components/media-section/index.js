import { Text } from '@automattic/jetpack-components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ResponsiveWrapper, Spinner, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect, useState } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaRestrictions, {
	getAllowedMediaTypes,
	isVideo,
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
	VIDEO_LENGTH_ERROR,
} from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

/**
 * Get relevant details from a WordPress media object.
 *
 * @param {Object} media - WordPress media object.
 * @returns {{
 * mediaData: {width: number, height: number, sourceUrl: string},
 * metaData: {mime: string, fileSize: number, length: number}
 * }} - Media details.
 */
const getMediaDetails = media => {
	if ( ! media ) {
		return {};
	}

	const metaData = {
		mime: media.mime_type,
		fileSize: media.media_details.filesize,
		length: media.media_details?.length,
	};

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

const ADD_MEDIA_LABEL = __( 'Set Social Image', 'jetpack' );
const REPLACE_MEDIA_LABEL = __( 'Replace Social Image', 'jetpack' );
const REMOVE_MEDIA_LABEL = __( 'Remove Social Image', 'jetpack' );

const validationErrorMessages = {
	[ FILE_TYPE_ERROR ]: __(
		'The selected media type is not accepted by these platforms.',
		'jetpack'
	),
	[ FILE_SIZE_ERROR ]: __( 'The selected media size is too big for these platforms.', 'jetpack' ),
	[ VIDEO_LENGTH_ERROR ]: __( 'The selected video is too long for these platforms.', 'jetpack' ),
};

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const [ validationError, setValidationError ] = useState( null );
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const { enabledConnections } = useSocialMediaConnections();

	const { maxImageSize, getValidationError } = useMediaRestrictions( enabledConnections );
	const allowedMediaTypes = getAllowedMediaTypes();

	const mediaObject = useSelect(
		select => select( 'core' ).getMedia( attachedMedia[ 0 ] || null, { context: 'view' } ),
		[ attachedMedia[ 0 ] ]
	);

	const { mediaData, metaData } = getMediaDetails( mediaObject );

	useEffect( () => {
		// Removes selected media if connection change results in invalid image
		if ( ! metaData ) {
			return;
		}

		const error = getValidationError( metaData );
		if ( error ) {
			setValidationError( error );
			updateAttachedMedia( [] );
		}
	}, [ updateAttachedMedia, getValidationError, metaData ] );

	const onRemoveMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );
	const onUpdateMedia = useCallback(
		media => {
			updateAttachedMedia( [ media.id ] );
			setValidationError( null );
		},
		[ updateAttachedMedia ]
	);

	const renderPreview = useCallback( () => {
		if ( isVideo( metaData.mime ) ) {
			// TBD
			return <div>Video Preview</div>;
		}

		const { width, height, sourceUrl } = mediaData;

		if ( width && height && sourceUrl ) {
			return (
				<ResponsiveWrapper naturalWidth={ width } naturalHeight={ height } isInline>
					<img src={ sourceUrl } alt="" />
				</ResponsiveWrapper>
			);
		}
	}, [ mediaData, metaData ] );

	const setMediaRender = useCallback(
		( { open } ) => (
			<div className={ styles.container }>
				<Button className={ ! mediaObject ? styles.toggle : styles.preview } onClick={ open }>
					{ mediaObject && renderPreview() }
					{ ! mediaObject && ( attachedMedia.length ? <Spinner /> : ADD_MEDIA_LABEL ) }
				</Button>
			</div>
		),
		[ mediaObject, attachedMedia, renderPreview ]
	);

	const replaceMediaRender = useCallback(
		( { open } ) => (
			<Button onClick={ open } variant="secondary">
				{ REPLACE_MEDIA_LABEL }
			</Button>
		),
		[]
	);

	const onDismissClick = useCallback( () => setValidationError( null ), [] );

	return (
		<div className={ styles.wrapper }>
			<MediaUploadCheck>
				<MediaUpload
					title={ ADD_MEDIA_LABEL }
					onSelect={ onUpdateMedia }
					allowedTypes={ allowedMediaTypes }
					render={ setMediaRender }
					value={ attachedMedia[ 0 ] }
				/>
				{ mediaObject && (
					<>
						<MediaUpload
							title={ REPLACE_MEDIA_LABEL }
							onSelect={ onUpdateMedia }
							allowedTypes={ allowedMediaTypes }
							render={ replaceMediaRender }
						/>
						<Button onClick={ onRemoveMedia } variant="link" isDestructive>
							{ REMOVE_MEDIA_LABEL }
						</Button>
					</>
				) }
				{ validationError && (
					<Notice
						className={ styles.notice }
						isDismissible={ true }
						onDismiss={ onDismissClick }
						status="warning"
					>
						<p>{ validationErrorMessages[ validationError ] }</p>
					</Notice>
				) }
				{ ! mediaObject && (
					<Fragment>
						<Text variant="title-small">{ __( 'Max image size', 'jetpack' ) }</Text>
						<Notice className={ styles.max_notice } isDismissible={ false } status="info">
							<Text>{ ` ${ maxImageSize } Mb` }</Text>
						</Notice>
						<Text variant="title-small">{ __( 'Allowed types', 'jetpack' ) }</Text>
						<Notice className={ styles.max_notice } isDismissible={ false } status="info">
							<Text>{ ` ${ allowedMediaTypes.join( ', ' ) }` }</Text>
						</Notice>
					</Fragment>
				) }
			</MediaUploadCheck>
		</div>
	);
}
