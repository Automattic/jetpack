import { __ } from '@wordpress/i18n';
import { captureVideo, caution, Icon, lock } from '@wordpress/icons';
import { useEffect, useRef } from 'react';
import type { CameraProblem } from '../../lib/video-recording/camera-problems';
import type { ReactElement } from 'react';

type Explanation = {
	icon: ReactElement;
	title: string;
	description: string;
	steps: string[];
	retry: boolean;
};

const tryAgain = () => __( 'Select Try again.', 'jetpack-videopress-pkg' );

/**
 * Describe a camera problem and the steps that fix it.
 *
 * @param problem - Why the camera can't be used.
 * @return Copy and whether retrying can help.
 */
function explain( problem: CameraProblem ): Explanation {
	switch ( problem ) {
		case 'blocked':
			return {
				icon: lock,
				title: __( 'Camera and microphone access is blocked', 'jetpack-videopress-pkg' ),
				description: __(
					'Your browser is set to block this site from using your camera or microphone.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Select the camera or site settings icon in your browser’s address bar.',
						'jetpack-videopress-pkg'
					),
					__( 'Allow the camera and microphone for this site.', 'jetpack-videopress-pkg' ),
					tryAgain(),
				],
				retry: true,
			};
		case 'blocked-by-system':
			return {
				icon: lock,
				title: __( 'Your computer is blocking the camera', 'jetpack-videopress-pkg' ),
				description: __(
					'Your operating system doesn’t let this browser use the camera or microphone.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Open your computer’s privacy settings for the camera and microphone.',
						'jetpack-videopress-pkg'
					),
					__(
						'Allow your browser to use them. You may need to restart the browser.',
						'jetpack-videopress-pkg'
					),
					tryAgain(),
				],
				retry: true,
			};
		case 'missing-camera':
		case 'missing-microphone':
		case 'missing-devices':
			return {
				icon: captureVideo,
				title: {
					'missing-camera': __( 'No camera found', 'jetpack-videopress-pkg' ),
					'missing-microphone': __( 'No microphone found', 'jetpack-videopress-pkg' ),
					'missing-devices': __( 'No camera or microphone found', 'jetpack-videopress-pkg' ),
				}[ problem ],
				description: __(
					'Recording needs both a camera and a microphone.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Connect a camera and microphone, or turn on the built-in ones.',
						'jetpack-videopress-pkg'
					),
					__(
						'Check that your computer recognizes them in its sound and camera settings.',
						'jetpack-videopress-pkg'
					),
					tryAgain(),
				],
				retry: true,
			};
		case 'in-use':
			return {
				icon: captureVideo,
				title: __( 'The camera or microphone is busy', 'jetpack-videopress-pkg' ),
				description: __(
					'Another app or browser tab may be using it, or the device stopped responding.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Close video calls and other apps or tabs that use the camera.',
						'jetpack-videopress-pkg'
					),
					__(
						'If you use an external camera, unplug it and plug it back in.',
						'jetpack-videopress-pkg'
					),
					tryAgain(),
				],
				retry: true,
			};
		case 'insecure':
			return {
				icon: lock,
				title: __( 'Recording needs a secure connection', 'jetpack-videopress-pkg' ),
				description: __(
					'Browsers only allow camera access on pages loaded over HTTPS.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Open this page from an address that starts with https://.',
						'jetpack-videopress-pkg'
					),
					__(
						'Or record with another app and upload the video file instead.',
						'jetpack-videopress-pkg'
					),
				],
				retry: false,
			};
		case 'unsupported':
			return {
				icon: caution,
				title: __( 'This browser can’t record video', 'jetpack-videopress-pkg' ),
				description: __(
					'It doesn’t support camera access or MP4 recording.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Open this page in the latest Chrome, Edge, Firefox, or Safari.',
						'jetpack-videopress-pkg'
					),
					__(
						'Or record with another app and upload the video file instead.',
						'jetpack-videopress-pkg'
					),
				],
				retry: false,
			};
		case 'recording-failed':
			return {
				icon: caution,
				title: __( 'Recording stopped unexpectedly', 'jetpack-videopress-pkg' ),
				description: __(
					'The camera or microphone stopped sending video before the recording finished.',
					'jetpack-videopress-pkg'
				),
				steps: [
					__(
						'Check that your camera and microphone are still connected.',
						'jetpack-videopress-pkg'
					),
					__( 'Keep this tab open and visible while you record.', 'jetpack-videopress-pkg' ),
					tryAgain(),
				],
				retry: true,
			};
		default:
			return {
				icon: caution,
				title: __( 'The camera couldn’t start', 'jetpack-videopress-pkg' ),
				description: __(
					'Something went wrong while connecting to your camera or microphone.',
					'jetpack-videopress-pkg'
				),
				steps: [
					tryAgain(),
					__(
						'If it keeps happening, reload the page or try another browser.',
						'jetpack-videopress-pkg'
					),
				],
				retry: true,
			};
	}
}

type Props = {
	problem: CameraProblem;
	onRetry: () => void;
	onClose: () => void;
};

/**
 * Explain why the camera can't be used and how to fix it, in place of the recording controls.
 *
 * @param props         - Problem and actions.
 * @param props.problem - Why the camera can't be used.
 * @param props.onRetry - Ask for the camera again.
 * @param props.onClose - Close the recording workspace.
 * @return Error panel.
 */
export default function CameraError( { problem, onRetry, onClose }: Props ) {
	const { icon, title, description, steps, retry } = explain( problem );
	const action = useRef< HTMLButtonElement >( null );

	useEffect( () => {
		action.current?.focus();
	}, [ problem ] );

	return (
		<div
			className="videopress-recording__error"
			role="alert"
			aria-labelledby="videopress-recording-error-title"
		>
			<span className="videopress-recording__error-icon" aria-hidden="true">
				<Icon icon={ icon } size={ 28 } />
			</span>
			<h2 id="videopress-recording-error-title" className="videopress-recording__error-title">
				{ title }
			</h2>
			<p className="videopress-recording__error-description">{ description }</p>
			<div className="videopress-recording__error-solution">
				<h3>{ __( 'How to fix it', 'jetpack-videopress-pkg' ) }</h3>
				<ol>
					{ steps.map( step => (
						<li key={ step }>{ step }</li>
					) ) }
				</ol>
			</div>
			<div className="videopress-recording__error-actions">
				{ retry && (
					<button
						ref={ action }
						type="button"
						className="videopress-recording__error-retry"
						onClick={ onRetry }
					>
						{ __( 'Try again', 'jetpack-videopress-pkg' ) }
					</button>
				) }
				<button
					ref={ retry ? undefined : action }
					type="button"
					className="videopress-recording__overlay-button"
					onClick={ onClose }
				>
					{ __( 'Close', 'jetpack-videopress-pkg' ) }
				</button>
			</div>
		</div>
	);
}
