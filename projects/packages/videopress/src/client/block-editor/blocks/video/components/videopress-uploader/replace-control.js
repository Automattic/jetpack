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
	function onFileUploadHandler( media ) {
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

	/**
	 * Selecting media handler.
	 *
	 * @param {object} media - media file to upload
	 * @returns {void}
	 */
	function onSelectHandler( media ) {
		// videopress_guid is an array of guids ¯\_(ツ)_/¯
		media.videopress_guid = media.videopress_guid?.[ 0 ] ?? media.videopress_guid;

		if ( media?.guid ) {
			media.videopress_url = `https://videopress.com/v/${ media.guid }`;
		}
		onSelectVideoFromLibrary( media );
	}

	return (
		<MediaReplaceFlow
			handleUpload={ true }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onFilesUpload={ onFileUploadHandler }
			onSelect={ onSelectHandler }
		/>
	);
};

export default ReplaceControl;
