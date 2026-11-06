/**
 * External dependencies
 */
import { Stack } from '@automattic/jetpack-premium-analytics-sdk';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import UploadDropzone from '../../../../src/dashboard/components/upload-dropzone';
import { UploadProgress } from '../upload-progress';
import { UploadedVideo } from '../uploaded-video';
import './video-uploader.scss';
import type { UploadPhase } from './use-video-upload';

type UploaderBodyProps = {
	/**
	 * The upload phase.
	 */
	phase: UploadPhase;

	/**
	 * Receives the dropped or picked files.
	 */
	onFiles: ( files: File[] ) => void;

	/**
	 * Starts a failed upload again.
	 */
	onRetry: ( file: File ) => void;
};

/**
 * What the tile shows for the phase: the dropzone, the file in flight, or the video it created.
 *
 * @param {UploaderBodyProps} props - Component props.
 * @return The body for the phase.
 */
function UploaderBody( { phase, onFiles, onRetry }: UploaderBodyProps ) {
	switch ( phase.status ) {
		case 'uploading':
			return <UploadProgress file={ phase.file } status="uploading" progress={ phase.progress } />;
		case 'failed':
			return (
				<UploadProgress
					file={ phase.file }
					status="failed"
					onRetry={ () => onRetry( phase.file ) }
				/>
			);
		case 'uploaded':
			return <UploadedVideo file={ phase.file } media={ phase.media } />;
		default:
			return (
				<UploadDropzone
					onFiles={ onFiles }
					copyVariant="single"
					subCopy={ __(
						'Upload a video to start tracking its plays here.',
						'jetpack-videopress-pkg'
					) }
				/>
			);
	}
}

export type VideoUploaderProps = {
	/**
	 * The upload phase, held by the widget so it outlives a stats reload.
	 */
	phase: UploadPhase;

	/**
	 * Starts an upload of the file.
	 */
	onUpload: ( file: File ) => void;
};

/**
 * The widget's empty-library body: the dashboard's dropzone, then the upload's
 * progress, then the video it created while it transcodes, all inside the tile.
 *
 * @param {VideoUploaderProps} props - Component props.
 * @return The widget body.
 */
export function VideoUploader( { phase, onUpload }: VideoUploaderProps ) {
	const { createInfoNotice } = useDispatch( noticesStore );

	// The widget invites one video; a multi-file drop still says what happened to the rest.
	const onFiles = useCallback(
		( files: File[] ) => {
			if ( files.length > 1 ) {
				createInfoNotice(
					__(
						'Uploading the first video. Add the rest from the VideoPress dashboard.',
						'jetpack-videopress-pkg'
					),
					{ type: 'snackbar' }
				);
			}
			onUpload( files[ 0 ] );
		},
		[ createInfoNotice, onUpload ]
	);

	return (
		<Stack direction="column" justify="safe center" className="vp-top-videos-uploader">
			<UploaderBody phase={ phase } onFiles={ onFiles } onRetry={ onUpload } />
		</Stack>
	);
}
