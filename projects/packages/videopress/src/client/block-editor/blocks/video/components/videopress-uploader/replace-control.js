/**
 * WordPress dependencies
 */
import { MediaReplaceFlow } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import './style.scss';

const ReplaceControl = ( { onUploadFileStart, onSelectVideoFromLibrary } ) => {
	/**
	 * Uploading file handler.
	 *
	 * @param {File} media - media file to upload
	 * @returns {void}
	 */
	function onSelectVideo( media ) {
		/*
		 * Allow uploading only (the first) one file
		 * @todo: Allow uploading multiple files
		 */
		media = media?.[ 0 ] ? media[ 0 ] : media;

		const isFileUploading = media instanceof File;
		if ( ! isFileUploading ) {
			return;
		}

		onUploadFileStart( media );
	}

	return (
		<MediaReplaceFlow
			handleUpload={ true }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onFilesUpload={ onSelectVideo }
			onSelect={ onSelectVideoFromLibrary }
		/>
	);
};

export default ReplaceControl;
