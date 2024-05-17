/**
 * External dependencies
 */
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { buildVideoPressURL } from '../../../../../lib/url';
import isLocalFile from '../../../../utils/is-local-file.native';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import { title } from '../../index';
import { VideoPressIcon } from '../icons';
import UploadProgress from './uploader-progress';
import './style.scss';

const VideoPressUploader = ( {
	autoOpenMediaUpload,
	fileToUpload,
	handleDoneUpload,
	isInteractionDisabled,
	onFocus,
	onStartUpload,
	onStopUpload,
} ) => {
	const [ uploadFile, setFile ] = useState( null );
	const [ isUploadingInProgress, setIsUploadingInProgress ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	const startUpload = file => {
		setFile( file );
		setIsUploadingInProgress( true );
		onStartUpload( file );
	};

	// Start the upload process when a file to upload is set.
	useEffect( () => {
		if ( ! fileToUpload ) {
			return;
		}

		startUpload( fileToUpload );
	}, [ fileToUpload ] );

	const onSelectURL = useCallback(
		( videoSource, id ) => {
			// If the video source is a VideoPress URL, we can use it directly.
			const { guid, url: videoPressURL } = buildVideoPressURL( videoSource );
			if ( ! guid ) {
				createErrorNotice( __( 'Invalid VideoPress URL', 'jetpack-videopress-pkg' ) );
				return;
			}
			handleDoneUpload( { guid, src: videoPressURL, id } );
		},
		[ createErrorNotice, handleDoneUpload ]
	);

	const onSelectVideo = useCallback(
		media => {
			const isUploadingFile = isLocalFile( media?.url ) && media?.type;

			// Upload local file.
			if ( isUploadingFile ) {
				startUpload( media );
				return;
			}

			// Insert media library VideoPress attachment.
			const videoPressGuid = media?.metadata?.videopressGUID;
			if ( videoPressGuid ) {
				onSelectURL( videoPressGuid, media?.id );
				return;
			}
			// eslint-disable-next-line no-console
			console.error( `Media item with ID ${ media?.id } can't be added.` );
		},
		[ onSelectURL ]
	);

	const onResetUpload = useCallback( () => {
		setIsUploadingInProgress( false );
		onStopUpload();
	}, [] );

	if ( isUploadingInProgress ) {
		return (
			<UploadProgress
				file={ uploadFile }
				onDone={ handleDoneUpload }
				onReset={ onResetUpload }
				isInteractionDisabled={ isInteractionDisabled }
			/>
		);
	}

	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ VideoPressIcon } /> }
			labels={ {
				title,
			} }
			onSelect={ onSelectVideo }
			onSelectURL={ onSelectURL }
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			autoOpenMediaUpload={ autoOpenMediaUpload }
			onFocus={ onFocus }
		/>
	);
};

export default VideoPressUploader;
