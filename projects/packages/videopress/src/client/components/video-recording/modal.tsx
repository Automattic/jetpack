import { Button, Modal, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { getRecordingMimeType } from '../../lib/video-recording';
import { recordCamera } from '../../lib/video-recording/camera';
import { getRecordingFilter } from '../../lib/video-recording/effects';
import ConfirmationOverlay from '../caption-manager-modal/confirmation-overlay';
import EffectPicker from './effect-picker';
import RecordingEditor from './recording-editor';
import RecordingStage from './recording-stage';
import './style.scss';
import type { Recording } from '../../lib/video-recording';
import type { RecordingEffect } from '../../lib/video-recording/effects';

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
	const [ cameraVideo, setCameraVideo ] = useState< HTMLVideoElement | null >( null );
	const [ cameraReady, setCameraReady ] = useState( false );
	const [ mirrored, setMirrored ] = useState( true );
	const [ effect, setEffect ] = useState< RecordingEffect >( 'original' );
	const effectRef = useRef( effect );
	effectRef.current = effect;
	const [ elapsed, setElapsed ] = useState( 0 );
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
			.getUserMedia( { video: { facingMode: { ideal: 'user' } }, audio: true } )
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
		if ( state !== 'recording' ) {
			return;
		}
		const started = Date.now();
		setElapsed( 0 );
		const timer = setInterval(
			() => setElapsed( Math.floor( ( Date.now() - started ) / 1000 ) ),
			1000
		);
		return () => clearInterval( timer );
	}, [ state ] );

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
			stream?.getTracks().forEach( track => track.stop() );
			setState( 'error' );
			setError( __( 'Recording failed. Please try again.', 'jetpack-videopress-pkg' ) );
		}
	};
	const start = () => {
		if ( ! stream || ! cameraVideo || ! cameraReady ) {
			return;
		}
		try {
			recording.current = recordCamera( cameraVideo, stream, () => effectRef.current );
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
					<RecordingStage
						label={ __( 'Camera preview', 'jetpack-videopress-pkg' ) }
						stream={ stream }
						mirrored={ mirrored }
						filter={ getRecordingFilter( effect ) }
						onVideoReady={ setCameraVideo }
						onSourceReady={ setCameraReady }
						onSourceError={ failed }
					>
						<div className="videopress-recording__overlay-top">
							<span className="videopress-recording__status" role="status">
								{ state === 'recording' || state === 'stopping' ? (
									<>
										<span className="videopress-recording__status-dot" aria-hidden="true" />
										{ __( 'Recording', 'jetpack-videopress-pkg' ) }{ ' ' }
										<span aria-hidden="true">
											{ String( Math.floor( elapsed / 60 ) ).padStart( 2, '0' ) }:
											{ String( elapsed % 60 ).padStart( 2, '0' ) }
										</span>
									</>
								) : (
									__( 'Camera preview', 'jetpack-videopress-pkg' )
								) }
							</span>
							<button
								type="button"
								className="videopress-recording__overlay-button"
								aria-pressed={ mirrored }
								onClick={ () => setMirrored( value => ! value ) }
								disabled={ confirmation !== null || state === 'stopping' }
							>
								{ __( 'Mirror preview', 'jetpack-videopress-pkg' ) }
							</button>
						</div>
						{ state === 'loading' && (
							<div className="videopress-recording__overlay-message" role="status">
								<Spinner />
								{ __( 'Waiting for camera and microphone access…', 'jetpack-videopress-pkg' ) }
							</div>
						) }
						{ error && (
							<div className="videopress-recording__overlay-message">
								<Notice.Root intent="error">
									<Notice.Description>{ error }</Notice.Description>
								</Notice.Root>
								<Button variant="secondary" onClick={ () => setAttempt( value => value + 1 ) }>
									{ __( 'Try again', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						) }
						<div className="videopress-recording__overlay-bottom">
							<EffectPicker
								value={ effect }
								onChange={ setEffect }
								disabled={
									confirmation !== null ||
									! cameraReady ||
									state === 'error' ||
									state === 'stopping'
								}
							/>
							<button
								type="button"
								className={ `videopress-recording__record-toggle${ state === 'recording' || state === 'stopping' ? ' is-recording' : '' }` }
								disabled={
									! cameraReady ||
									confirmation !== null ||
									state === 'loading' ||
									state === 'error' ||
									state === 'stopping'
								}
								onClick={ () => ( state === 'recording' ? void stop() : start() ) }
							>
								<span className="videopress-recording__record-ring" aria-hidden="true">
									<span />
								</span>
								<span>
									{ state === 'recording' || state === 'stopping'
										? __( 'Stop recording', 'jetpack-videopress-pkg' )
										: __( 'Start recording', 'jetpack-videopress-pkg' ) }
								</span>
							</button>
						</div>
					</RecordingStage>
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
