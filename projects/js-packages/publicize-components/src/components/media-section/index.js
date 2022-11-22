import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ResponsiveWrapper, Spinner, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

// These will come from the server
const RESTRICTIONS = {
	twitter: {
		maxImageSize: 2000000,
	},
	facebook: {
		maxImageSize: 1000000,
	},
};

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
		};
	}

	const mediaObject = sizes.large || sizes.thumbnail;

	return {
		mediaWidth: mediaObject.width,
		mediaHeight: mediaObject.height,
		mediaSourceUrl: mediaObject.source_url,
	};
};

const ADD_MEDIA_LABEL = __( 'Set Social Image', 'jetpack' );
const REPLACE_MEDIA_LABEL = __( 'Replace Social Image', 'jetpack' );
const REMOVE_MEDIA_LABEL = __( 'Remove Social Image', 'jetpack' );

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

const getMaxImageSize = ( restrictions, connections ) => {
	return Math.min(
		...connections.map( connection => restrictions[ connection.service_name ].maxImageSize )
	);
};

const isMediaObjectValid = ( mediaObject, maxImageSize ) => {
	if ( mediaObject?.media_details?.filesize <= maxImageSize ) {
		return true;
	}
	return false;
};

const formatMaxSize = maxImageSize => ` (${ maxImageSize / Math.pow( 10, 6 ) } Mb)`;

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const [ showNotice, setShotNotice ] = useState( false );
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const { connections } = useSocialMediaConnections();
	const enabledConnections = connections.filter( connection => connection.enabled );
	const maxImageSize = getMaxImageSize( RESTRICTIONS, enabledConnections );

	const mediaObject = useSelect( select =>
		select( 'core' ).getMedia( attachedMedia[ 0 ] || null, { context: 'view' } )
	);

	useEffect( () => {
		// Removes selected media if connection change results in invalid image
		if ( mediaObject && ! isMediaObjectValid( mediaObject, maxImageSize ) ) {
			updateAttachedMedia( [] );
			setShotNotice( true );
		}
	}, [ updateAttachedMedia, maxImageSize, mediaObject ] );

	const { mediaWidth, mediaHeight, mediaSourceUrl } = getMediaDetails( mediaObject );

	const onRemoveMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );
	const onUpdateMedia = useCallback(
		media => {
			// allowedTypes doesn't properly disallow uploaded media types.
			// See: https://github.com/WordPress/gutenberg/issues/25130
			if ( ! ALLOWED_MEDIA_TYPES.includes( media.mime ) ) {
				return;
			}

			// Do not select media if criteria is not met
			if ( media.filesizeInBytes > getMaxImageSize( RESTRICTIONS, enabledConnections ) ) {
				updateAttachedMedia( [] );
				setShotNotice( true );
				return;
			}

			updateAttachedMedia( [ media.id ] );
			setShotNotice( false );
		},
		[ updateAttachedMedia, enabledConnections ]
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
					{ ! mediaObject &&
						( attachedMedia.length ? (
							<Spinner />
						) : (
							ADD_MEDIA_LABEL + formatMaxSize( maxImageSize )
						) ) }
				</Button>
			</div>
		),
		[ mediaHeight, mediaObject, mediaSourceUrl, mediaWidth, attachedMedia, maxImageSize ]
	);

	const replaceMediaRender = useCallback(
		( { open } ) => (
			<Button onClick={ open } variant="secondary">
				{ REPLACE_MEDIA_LABEL }
			</Button>
		),
		[]
	);

	const onDismissClick = useCallback( () => setShotNotice( false ), [] );

	return (
		<div className={ styles.wrapper }>
			<MediaUploadCheck>
				<MediaUpload
					title={ ADD_MEDIA_LABEL + formatMaxSize( maxImageSize ) }
					onSelect={ onUpdateMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					render={ setMediaRender }
					value={ attachedMedia[ 0 ] }
				/>
				{ mediaObject && (
					<>
						<MediaUpload
							title={ REPLACE_MEDIA_LABEL }
							onSelect={ onUpdateMedia }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							render={ replaceMediaRender }
						/>
						<Button onClick={ onRemoveMedia } variant="link" isDestructive>
							{ REMOVE_MEDIA_LABEL }
						</Button>
					</>
				) }
				{ showNotice && (
					<Notice
						className={ styles.notice }
						isDismissible={ true }
						onDismiss={ onDismissClick }
						status="warning"
					>
						<p>{ 'The selected media it is too big for one of the selected platforms.' }</p>
					</Notice>
				) }
			</MediaUploadCheck>
		</div>
	);
}
