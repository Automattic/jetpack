/**
 * External dependencies
 */
import { Stack, WidgetFooter, getVideoPosterUrl } from '@automattic/jetpack-premium-analytics-sdk';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, video as videoIcon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Progress, VisuallyHidden } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useState, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import UploadDropzone from '../../src/dashboard/components/upload-dropzone';
import { startVideoUpload } from '../../src/dashboard/utils/start-video-upload';
import { useUploadedVideo } from './use-uploaded-video';
import './style.scss';
import type { VideoMediaProps } from '../../src/client/lib/resumable-file-uploader/types';

type UploadPhase =
	| { status: 'idle' }
	| { status: 'uploading'; file: File; progress: number }
	| { status: 'failed'; file: File }
	| { status: 'uploaded'; file: File; media: VideoMediaProps };

type UploadStatusProps =
	| { file: File; status: 'uploading'; progress: number; onRetry?: never }
	| { file: File; status: 'failed'; progress?: never; onRetry: () => void };

/**
 * The file in flight: its name, a phase message and a progress bar, or a Retry.
 *
 * @param props          - Component props.
 * @param props.file     - The file being uploaded.
 * @param props.status   - Whether the upload is running or has failed.
 * @param props.progress - Uploaded fraction, from zero to one.
 * @param props.onRetry  - Starts the failed upload again.
 * @return The status block.
 */
function UploadStatus( { file, status, progress = 0, onRetry }: UploadStatusProps ) {
	const failed = status === 'failed';
	const percent = Math.round( progress * 100 );
	const phaseMessage = failed
		? __( 'The upload failed. Please try again.', 'jetpack-videopress-pkg' )
		: __( 'Uploading…', 'jetpack-videopress-pkg' );
	let message: string = phaseMessage;
	if ( ! failed && progress >= 1 ) {
		message = __( 'Finishing upload…', 'jetpack-videopress-pkg' );
	} else if ( ! failed ) {
		message = sprintf(
			/* translators: %d: upload progress percentage. */
			__( 'Uploading %d%%', 'jetpack-videopress-pkg' ),
			percent
		);
	}

	return (
		<div className="vp-top-videos-upload__status">
			{ /* Announce the phase, not every progress tick. */ }
			<VisuallyHidden>
				<span role={ failed ? 'alert' : 'status' }>{ phaseMessage }</span>
			</VisuallyHidden>
			<Icon icon={ videoIcon } size={ 40 } className="vp-top-videos-upload__icon" />
			<span className="vp-top-videos-upload__name">{ file.name }</span>
			<span className="vp-top-videos-upload__message" aria-hidden="true">
				{ message }
			</span>
			{ failed ? (
				<Button variant="secondary" __next40pxDefaultSize onClick={ onRetry }>
					{ __( 'Retry upload', 'jetpack-videopress-pkg' ) }
				</Button>
			) : (
				<Progress.Root
					className="vp-top-videos-upload__bar"
					aria-label={ __( 'Upload progress', 'jetpack-videopress-pkg' ) }
					value={ progress >= 1 ? null : percent }
				>
					<Progress.Track>
						<Progress.Indicator />
					</Progress.Track>
				</Progress.Root>
			) }
		</div>
	);
}

/**
 * The video the upload created, followed while it transcodes.
 *
 * @param props       - Component props.
 * @param props.file  - The uploaded file, for a title until the record answers.
 * @param props.media - The media the upload created.
 * @return The video block.
 */
function UploadedVideo( { file, media }: { file: File; media: VideoMediaProps } ) {
	const video = useUploadedVideo( media.id );
	const title = video?.title || file.name.replace( /\.[^.]+$/, '' );
	const poster = getVideoPosterUrl( video?.thumbnailUrl, 320, 180 );
	const detailsUrl = addQueryArgs( getAdminUrl( 'admin.php' ), {
		page: 'jetpack-videopress',
		p: `/video/${ media.id }`,
	} );

	let message: string;
	if ( video?.conversionFailed ) {
		message = __(
			'Your video was uploaded, but it couldn’t be processed.',
			'jetpack-videopress-pkg'
		);
	} else if ( ! video || video.isProcessing ) {
		message = __(
			'Your video is uploaded and being processed. Plays will show up here once people watch it.',
			'jetpack-videopress-pkg'
		);
	} else {
		message = __(
			'Your video is ready. Plays will show up here once people watch it.',
			'jetpack-videopress-pkg'
		);
	}

	return (
		<div className="vp-top-videos-upload__status" role="status">
			{ poster ? (
				<img className="vp-top-videos-upload__poster" src={ poster } alt="" />
			) : (
				<Icon icon={ videoIcon } size={ 40 } className="vp-top-videos-upload__icon" />
			) }
			<span className="vp-top-videos-upload__name">{ title }</span>
			<span className="vp-top-videos-upload__message">{ message }</span>
			<Button variant="secondary" __next40pxDefaultSize href={ detailsUrl }>
				{ __( 'View video', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
}

type UploadFirstVideoProps = {
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
 * @param props            - Component props.
 * @param props.footer     - The widget footer.
 * @param props.onUploaded - Receives the media once the upload lands.
 * @return The widget body.
 */
export default function UploadFirstVideo( { footer, onUploaded }: UploadFirstVideoProps ) {
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

	const renderBody = () => {
		switch ( phase.status ) {
			case 'uploading':
				return <UploadStatus file={ phase.file } status="uploading" progress={ phase.progress } />;
			case 'failed':
				return (
					<UploadStatus
						file={ phase.file }
						status="failed"
						onRetry={ () => upload( phase.file ) }
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
	};

	return (
		<Stack direction="column" className="vp-top-videos-upload">
			<div className="vp-top-videos-upload__body">{ renderBody() }</div>
			<WidgetFooter>{ footer }</WidgetFooter>
		</Stack>
	);
}
