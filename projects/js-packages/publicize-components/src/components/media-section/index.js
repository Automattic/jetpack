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
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
} from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

/**
 * Get relevant details from a WordPress media object.
 *
 * @param {Object} media - WordPress media object.
 * @returns {{ mediaWidth: [ number ], mediaHeight: [ number ], mediaSourceUrl: [ string ] }} - Media details.
 */
const getMediaDetails = media => {
	if ( ! media ) {
		return {};
	}

	const sizes = media?.media_details?.sizes ?? {};

	if ( Object.keys( sizes ).length === 0 ) {
		return {
			mediaWidth: media.media_details.width,
			mediaHeight: media.media_details.height,
			mediaSourceUrl: media.source_url,
			fullFileSize: media.media_details.filesize,
			mime: media.mime_type,
		};
	}

	const mediaObject = sizes.large || sizes.thumbnail;

	return {
		mediaWidth: mediaObject.width,
		mediaHeight: mediaObject.height,
		mediaSourceUrl: mediaObject.source_url,
		fullFileSize: media.media_details.filesize,
		mime: media.mime_type,
	};
};

const ADD_MEDIA_LABEL = __( 'Set Social Image', 'jetpack' );
const REPLACE_MEDIA_LABEL = __( 'Replace Social Image', 'jetpack' );
const REMOVE_MEDIA_LABEL = __( 'Remove Social Image', 'jetpack' );

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
	const { mediaWidth, mediaHeight, mediaSourceUrl, fullFileSize, mime } = getMediaDetails(
		mediaObject
	);

	useEffect( () => {
		// Removes selected media if connection change results in invalid image
		if ( ! mediaObject ) {
			return;
		}

		const error = getValidationError( fullFileSize, mime );
		if ( error ) {
			setValidationError( error );
			updateAttachedMedia( [] );
		}
	}, [ updateAttachedMedia, mediaObject, getValidationError, fullFileSize, mime ] );

	const onRemoveMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );
	const onUpdateMedia = useCallback(
		media => {
			// allowedTypes doesn't properly disallow uploaded media types.
			// See: https://github.com/WordPress/gutenberg/issues/25130
			// Do not select media if criteria is not met
			const error = getValidationError( media.filesizeInBytes, media.mime );
			if ( error ) {
				updateAttachedMedia( [] );
				setValidationError( error );
				return;
			}

			updateAttachedMedia( [ media.id ] );
			setValidationError( null );
		},
		[ updateAttachedMedia, getValidationError ]
	);

	const setMediaRender = useCallback(
		( { open } ) => (
			<div className={ styles.container }>
				<Button className={ ! mediaObject ? styles.toggle : styles.preview } onClick={ open }>
					{ mediaWidth && mediaHeight && mediaSourceUrl && (
						<ResponsiveWrapper naturalWidth={ mediaWidth } naturalHeight={ mediaHeight } isInline>
							<img src={ mediaSourceUrl } alt="" />
						</ResponsiveWrapper>
					) }
					{ ! mediaObject && ( attachedMedia.length ? <Spinner /> : ADD_MEDIA_LABEL ) }
				</Button>
			</div>
		),
		[ mediaHeight, mediaObject, mediaSourceUrl, mediaWidth, attachedMedia ]
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
						{ validationError === FILE_TYPE_ERROR && (
							<p>
								{ __( 'The selected media type is not accepted by these platforms.', 'jetpack' ) }
							</p>
						) }
						{ validationError === FILE_SIZE_ERROR && (
							<p>{ __( 'The selected media size is too big for these platforms.', 'jetpack' ) }</p>
						) }
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
