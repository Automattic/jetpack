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

type UrlFileProp = {
	url: `blob:${ string }`;
};

type ReplaceControlProps = {
	attributes: VideoBlockAttributes;
	onUploadFileStart: ( media: File ) => void;
	onSelectVideoFromLibrary: (
		media: AdminAjaxQueryAttachmentsResponseItemProps | UrlFileProp
	) => void;
};

const ReplaceControl = ( {
	attributes,
	onUploadFileStart,
	onSelectVideoFromLibrary,
}: ReplaceControlProps ) => {
	/**
	 * Uploading file handler.
	 *
	 * @param {FileList} media - media file to upload
	 */
	function onFileUploadHandler( media: FileList ): void {
		/*
		 * Allow uploading only (the first) one file
		 * @todo: Allow uploading multiple files
		 */
		const file = media?.[ 0 ] ? media[ 0 ] : media;

		const isFileUploading = file instanceof File;
		if ( ! isFileUploading ) {
			return;
		}

		onUploadFileStart( file );
	}

	return (
		<MediaReplaceFlow
			mediaId={ attributes.id }
			handleUpload={ true }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onFilesUpload={ onFileUploadHandler }
			onSelect={ onSelectVideoFromLibrary }
		/>
	);
};

export default ReplaceControl;
