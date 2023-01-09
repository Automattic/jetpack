/**
 * WordPress dependencies
 */
import { MediaReplaceFlow } from '@wordpress/block-editor';
import { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import { VideoBlockAttributes } from '../../types';
import './style.scss';

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

	return (
		<MediaReplaceFlow
			mediaId={ attributes.id }
			handleUpload={ false }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onSelect={ selectMediaHandler }
			mediaURL={ attributes.src }
			onSelectURL={ onSelectURL }
		/>
	);
};

export default ReplaceControl;
