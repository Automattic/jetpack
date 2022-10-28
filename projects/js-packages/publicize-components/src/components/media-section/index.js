import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ResponsiveWrapper, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAttachedMedia from '../../hooks/use-attached-media';
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
	const mediaObject = sizes.large || sizes.thumbnail || media.media_details;

	return {
		mediaWidth: mediaObject.width,
		mediaHeight: mediaObject.height,
		mediaSourceUrl: mediaObject.source_url,
	};
};

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const ADD_MEDIA_LABEL = __( 'Set Social Image', 'jetpack' );
	const REPLACE_MEDIA_LABEL = __( 'Replace Social Image', 'jetpack' );
	const REMOVE_MEDIA_LABEL = __( 'Remove Social Image', 'jetpack' );

	const ALLOWED_MEDIA_TYPES = useMemo( () => [ 'image/jpeg', 'image/png' ], [] );

	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	const mediaObject = useSelect( select =>
		select( 'core' ).getMedia( attachedMedia[ 0 ] || null, { context: 'view' } )
	);

	const { mediaWidth, mediaHeight, mediaSourceUrl } = getMediaDetails( mediaObject );

	const onRemoveMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );
	const onUpdateMedia = useCallback(
		media => {
			// allowedTypes doesn't properly disallow uploaded media types.
			// See: https://github.com/WordPress/gutenberg/issues/25130
			if ( ! ALLOWED_MEDIA_TYPES.includes( media.mime ) ) {
				return;
			}

			updateAttachedMedia( [ media.id ] );
		},
		[ ALLOWED_MEDIA_TYPES, updateAttachedMedia ]
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
		[ ADD_MEDIA_LABEL, mediaHeight, mediaObject, mediaSourceUrl, mediaWidth, attachedMedia ]
	);

	const replaceMediaRender = useCallback(
		( { open } ) => (
			<Button onClick={ open } variant="secondary">
				{ REPLACE_MEDIA_LABEL }
			</Button>
		),
		[ REPLACE_MEDIA_LABEL ]
	);

	return (
		<div className={ styles.wrapper }>
			<MediaUploadCheck>
				<MediaUpload
					title={ ADD_MEDIA_LABEL }
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
			</MediaUploadCheck>
		</div>
	);
}
