import { Button, Modal, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { getRecordingMimeType, recordStream } from '../../lib/video-recording';
import ConfirmationOverlay from '../caption-manager-modal/confirmation-overlay';
import RecordingEditor from './recording-editor';
import './style.scss';
import type { Recording } from '../../lib/video-recording';

/**
 * Own camera permission, recording, preview, and cleanup until upload handoff.
 *
 * @param props            - Modal actions.
 * @param props.onClose    - Close the workspace.
 * @param props.onRecorded - Standard-upload handoff.
 * @return Recording workspace.
 */
export default function RecordingModal( {
	onClose,
	onRecorded,
}: {
	onClose: () => void;
	onRecorded: ( file: File ) => void;
} ) {
	const [ stream, setStream ] = useState< MediaStream | null >( null );
	const [ file, setFile ] = useState< File | null >( null );
	const [ state, setState ] = useState< 'loading' | 'ready' | 'recording' | 'stopping' | 'error' >(
		'loading'
	);
	const [ error, setError ] = useState< string | null >( null );
	const [ attempt, setAttempt ] = useState( 0 );
	const [ confirmation, setConfirmation ] = useState< 'close' | 'again' | null >( null );
	const videoRef = useRef< HTMLVideoElement >( null );
	const recording = useRef< Recording | null >( null );
	const active = useRef( true );

	useEffect( () => {
		active.current = true;
		return () => {
			active.current = false;
			recording.current?.cancel();
		};
	}, [] );

	useEffect( () => {
		let disposed = false;
		let camera: MediaStream | null = null;
		setState( 'loading' );
		setError( null );
		if ( ! navigator.mediaDevices?.getUserMedia || ! getRecordingMimeType() ) {
			setState( 'error' );
			setError(
				__(
					'Video recording is unavailable in this browser. Try a browser that supports MP4 recording and allow camera access on a secure connection.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}
		void navigator.mediaDevices
			.getUserMedia( { video: true, audio: true } )
			.then( media => {
				camera = media;
				if ( disposed ) {
					media.getTracks().forEach( track => track.stop() );
					return;
				}
				setStream( media );
				setState( 'ready' );
			} )
			.catch( () => {
				if ( ! disposed ) {
					setState( 'error' );
					setError(
						__(
							'The camera or microphone could not be accessed. Check your browser permissions and try again.',
							'jetpack-videopress-pkg'
						)
					);
				}
			} );
		return () => {
			disposed = true;
			camera?.getTracks().forEach( track => track.stop() );
		};
	}, [ attempt ] );

	useEffect( () => {
		if ( videoRef.current ) {
			videoRef.current.srcObject = stream;
		}
	}, [ stream, file ] );

	useEffect( () => {
		if ( ! file && state !== 'recording' && state !== 'stopping' ) {
			return;
		}
		const beforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', beforeUnload );
		return () => window.removeEventListener( 'beforeunload', beforeUnload );
	}, [ file, state ] );

	const failed = () => {
		if ( active.current ) {
			setState( 'error' );
			setError( __( 'Recording failed. Please try again.', 'jetpack-videopress-pkg' ) );
		}
	};
	const start = () => {
		if ( ! stream ) {
			return;
		}
		try {
			recording.current = recordStream( stream );
			void recording.current.finished.then( result => {
				if ( active.current ) {
					setFile( result );
					setState( 'ready' );
				}
			}, failed );
			setState( 'recording' );
		} catch {
			failed();
		}
	};
	const stop = async () => {
		setState( 'stopping' );
		try {
			const result = await recording.current!.stop();
			if ( active.current ) {
				setFile( result );
				setState( 'ready' );
			}
		} catch {
			failed();
		}
	};
	const close = () => {
		if ( file || state === 'recording' || state === 'stopping' ) {
			setConfirmation( 'close' );
		} else {
			onClose();
		}
	};

	return (
		<Modal
			title={ __( 'Record a video', 'jetpack-videopress-pkg' ) }
			className="videopress-recording"
			onRequestClose={ close }
			shouldCloseOnClickOutside={ false }
		>
			<div className="videopress-recording__workspace vp-chapters-tokens">
				{ file ? (
					<RecordingEditor
						file={ file }
						onUpload={ onRecorded }
						onRecordAgain={ () => setConfirmation( 'again' ) }
						blocked={ confirmation !== null }
					/>
				) : (
					<>
						<video
							ref={ videoRef }
							className="videopress-recording__video"
							autoPlay
							muted
							playsInline
							aria-label={ __( 'Camera preview', 'jetpack-videopress-pkg' ) }
						/>
						{ state === 'loading' && (
							<p role="status">
								<Spinner />
								{ __( 'Waiting for camera and microphone access…', 'jetpack-videopress-pkg' ) }
							</p>
						) }
						{ error && (
							<Notice.Root intent="error">
								<Notice.Description>{ error }</Notice.Description>
							</Notice.Root>
						) }
						<div className="videopress-recording__actions">
							{ state === 'ready' && (
								<Button variant="primary" onClick={ start } disabled={ confirmation !== null }>
									{ __( 'Start recording', 'jetpack-videopress-pkg' ) }
								</Button>
							) }
							{ ( state === 'recording' || state === 'stopping' ) && (
								<>
									<span role="status">{ __( 'Recording…', 'jetpack-videopress-pkg' ) }</span>
									<Button
										variant="primary"
										onClick={ () => void stop() }
										disabled={ state === 'stopping' || confirmation !== null }
									>
										{ __( 'Stop recording', 'jetpack-videopress-pkg' ) }
									</Button>
								</>
							) }
							{ state === 'error' && (
								<Button variant="secondary" onClick={ () => setAttempt( value => value + 1 ) }>
									{ __( 'Try again', 'jetpack-videopress-pkg' ) }
								</Button>
							) }
						</div>
					</>
				) }
				{ confirmation && (
					<ConfirmationOverlay
						message={ __( 'Discard this recording?', 'jetpack-videopress-pkg' ) }
						confirmLabel={ __( 'Discard recording', 'jetpack-videopress-pkg' ) }
						onCancel={ () => setConfirmation( null ) }
						onConfirm={ () => {
							if ( confirmation === 'close' ) {
								onClose();
							} else {
								recording.current = null;
								setFile( null );
								setAttempt( value => value + 1 );
								setConfirmation( null );
							}
						} }
					/>
				) }
			</div>
		</Modal>
	);
}
