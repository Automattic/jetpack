import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAttachedMedia from '../../hooks/use-attached-media';

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const addMediaLabel = __( 'Add Attached Image', 'jetpack' );
	const replaceMediaLabel = __( 'Replace Attached Image', 'jetpack' );
	const removeMediaLabel = __( 'Remove Attached Image', 'jetpack' );

	const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	const mediaObject = useSelect( select =>
		select( 'core' ).getMedia( attachedMedia[ 0 ] || null )
	);

	const updateMedia = useCallback( media => updateAttachedMedia( [ media.id ] ), [
		updateAttachedMedia,
	] );
	const removeMedia = useCallback( () => updateAttachedMedia( [] ), [ updateAttachedMedia ] );

	const render = useCallback(
		( { open } ) => (
			<Button isPrimary onClick={ open }>
				{ attachedMedia.length ? replaceMediaLabel : addMediaLabel }
			</Button>
		),
		[ attachedMedia, addMediaLabel, replaceMediaLabel ]
	);

	return (
		<MediaUploadCheck>
			{ mediaObject && (
				<img
					src={ mediaObject?.media_details?.sizes?.large?.source_url || mediaObject.source_url }
					alt={ mediaObject?.alt_text || '' }
				/>
			) }
			<MediaUpload
				onSelect={ updateMedia }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				render={ render }
			/>
			{ mediaObject && (
				<Button isLink isDestructive onClick={ removeMedia }>
					{ removeMediaLabel }
				</Button>
			) }
		</MediaUploadCheck>
	);
}
