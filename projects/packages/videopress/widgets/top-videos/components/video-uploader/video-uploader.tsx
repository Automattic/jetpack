/**
 * External dependencies
 */
import { Stack, WidgetFooter } from '@automattic/jetpack-premium-analytics-sdk';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useState, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import UploadDropzone from '../../../../src/dashboard/components/upload-dropzone';
import { startVideoUpload } from '../../../../src/dashboard/utils/start-video-upload';
import { UploadProgress } from '../upload-progress';
import { UploadedVideo } from '../uploaded-video';
import './video-uploader.scss';
import type { VideoMediaProps } from '../../../../src/client/lib/resumable-file-uploader/types';

type UploadPhase =
	| { status: 'idle' }
	| { status: 'uploading'; file: File; progress: number }
	| { status: 'failed'; file: File }
	| { status: 'uploaded'; file: File; media: VideoMediaProps };

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
	 * Rendered under the body, as the leaderboard renders its footer.
	 */
	footer: ReactNode;

	/**
	 * Called once the upload lands, with the media it created.
	 */
	onUploaded: ( media: VideoMediaProps ) => void;
};

/**
 * The widget's empty-library body: the dashboard's dropzone, then the upload's
 * progress, then the video it created while it transcodes, all inside the tile.
 *
 * @param {VideoUploaderProps} props - Component props.
 * @return The widget body.
 */
export function VideoUploader( { footer, onUploaded }: VideoUploaderProps ) {
	const [ phase, setPhase ] = useState< UploadPhase >( { status: 'idle' } );
	const { createInfoNotice } = useDispatch( noticesStore );

	const upload = useCallback(
		( file: File ) => {
			setPhase( { status: 'uploading', file, progress: 0 } );
			void startVideoUpload( file, {
				onProgress: ( sent, total ) =>
					setPhase( current =>
						current.status === 'uploading' && current.file === file
							? { ...current, progress: total > 0 ? sent / total : 0 }
							: current
					),
				onSuccess: media => {
					setPhase( { status: 'uploaded', file, media } );
					onUploaded( media );
				},
				onError: () => setPhase( { status: 'failed', file } ),
			} );
		},
		[ onUploaded ]
	);

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
			upload( files[ 0 ] );
		},
		[ createInfoNotice, upload ]
	);

	return (
		<Stack direction="column" className="vp-top-videos-uploader">
			<Stack direction="column" justify="safe center" className="vp-top-videos-uploader__body">
				<UploaderBody phase={ phase } onFiles={ onFiles } onRetry={ upload } />
			</Stack>

			<WidgetFooter>{ footer }</WidgetFooter>
		</Stack>
	);
}
