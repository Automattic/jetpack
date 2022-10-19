import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	// TODO: replace this with proper handling (save in post meta).
	const [ media, setMedia ] = useState( null );

	const addMediaLabel = __( 'Add Attached Image', 'jetpack' );
	const replaceMediaLabel = __( 'Replace Attached Image', 'jetpack' );
	const removeMediaLabel = __( 'Remove Attached Image', 'jetpack' );

	const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

	const selectMedia = useCallback( mediaObject => setMedia( mediaObject ), [ setMedia ] );
	const removeMedia = useCallback( () => setMedia( null ), [ setMedia ] );

	const render = useCallback(
		( { open } ) => (
			<Button isPrimary onClick={ open }>
				{ media ? replaceMediaLabel : addMediaLabel }
			</Button>
		),
		[ media, addMediaLabel, replaceMediaLabel ]
	);

	return (
		<MediaUploadCheck>
			{ media && <img src={ media.sizes?.large?.url || media.url } alt={ media?.alt || '' } /> }
			<MediaUpload
				onSelect={ selectMedia }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				render={ render }
			/>
			{ media && (
				<Button isLink isDestructive onClick={ removeMedia }>
					{ removeMediaLabel }
				</Button>
			) }
		</MediaUploadCheck>
	);
}
