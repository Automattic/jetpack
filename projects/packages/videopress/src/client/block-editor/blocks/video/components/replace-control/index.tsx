/**
 * WordPress dependencies
 */
import { MediaReplaceFlow } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import './style.scss';
/**
 * Types
 */
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
import type { VideoBlockAttributes } from '../../types';

type ReplaceControlProps = {
	attributes: VideoBlockAttributes;
	setAttributes: ( attributes: VideoBlockAttributes ) => void;
	onUploadFileStart: ( media: File ) => void;
	onSelectVideoFromLibrary: ( media: AdminAjaxQueryAttachmentsResponseItemProps ) => void;
	onSelectURL: ( url: string ) => void;
};

const ReplaceControl = ( {
	attributes,
	onUploadFileStart,
	onSelectVideoFromLibrary,
	onSelectURL,
}: ReplaceControlProps ) => {
	/**
	 * Handler to define the prop to run
	 * when the user selects a video from the media library,
	 * or when the user uploads a video.
	 *
	 * @param { AdminAjaxQueryAttachmentsResponseItemProps | FileList } media - The media selected by the user.
	 */
	function selectMediaHandler( media: AdminAjaxQueryAttachmentsResponseItemProps | FileList ) {
		if ( media?.[ 0 ]?.name && media?.[ 0 ]?.size && media?.[ 0 ]?.type ) {
			onUploadFileStart( media[ 0 ] );
			return;
		}
		onSelectVideoFromLibrary( media as AdminAjaxQueryAttachmentsResponseItemProps );
	}

	const shareVideoUrlBase = attributes.isPrivate
		? 'https://video.wordpress.com/v'
		: 'https://videopress.com/v';

	return (
		<MediaReplaceFlow
			mediaId={ attributes.id }
			handleUpload={ false }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onSelect={ selectMediaHandler }
			mediaURL={ `${ shareVideoUrlBase }/${ attributes.guid }` }
			onSelectURL={ onSelectURL }
		/>
	);
};

export default ReplaceControl;
