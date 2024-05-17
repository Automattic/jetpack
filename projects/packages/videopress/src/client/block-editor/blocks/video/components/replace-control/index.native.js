/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { replace } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import isLocalFile from '../../../../utils/is-local-file';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import './style.scss';

const ReplaceControl = ( { onUploadFileStart, onSelectVideoFromLibrary, onSelectURL } ) => {
	/**
	 * Handler to define the prop to run
	 * when the user selects a video from the media library,
	 * or when the user uploads a video.
	 *
	 * @param {object} media - The media selected by the user.
	 */
	const selectMediaHandler = useCallback(
		media => {
			if ( isLocalFile( media?.url ) && media?.type ) {
				onUploadFileStart( media );
				return;
			}
			onSelectVideoFromLibrary( media );
		},
		[ onUploadFileStart, onSelectVideoFromLibrary ]
	);

	return (
		<MediaUpload
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			isReplacingMedia={ true }
			onSelect={ selectMediaHandler }
			onSelectURL={ onSelectURL }
			render={ ( { open, getMediaOptions } ) => {
				return (
					<ToolbarGroup>
						{ getMediaOptions() }
						<ToolbarButton
							label={ __( 'Edit video', 'jetpack-videopress-pkg' ) }
							icon={ replace }
							onClick={ open }
						/>
					</ToolbarGroup>
				);
			} }
		/>
	);
};

export default ReplaceControl;
