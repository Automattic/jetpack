/**
 * External dependencies
 */
import {
	AudioDurationDisplay,
	micIcon,
	playerPauseIcon,
	useMediaRecording,
} from '@automattic/jetpack-ai-client';
import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import oscilloscope from './assets/oscilloscope.svg';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Oscilloscope( { audioURL } ) {
	return <img src={ oscilloscope } alt="" />;
}

function ContextualRow( { state, error = null, audioURL = null } ) {
	if ( state === 'inactive' ) {
		return (
			<div className="jetpack-ai-voice-to-content__information">
				{ __( 'File size limit: 25MB. Recording time limit: 25 minutes.', 'jetpack' ) }
			</div>
		);
	}

	if ( state === 'recording' ) {
		return (
			<div className="jetpack-ai-voice-to-content__audio">
				<AudioDurationDisplay
					className="jetpack-ai-voice-to-content__audio--duration"
					url={ audioURL }
				/>
				<Oscilloscope audioURL={ audioURL } />
				<span className="jetpack-ai-voice-to-content__information">
					{ __( 'Recording…', 'jetpack' ) }
				</span>
			</div>
		);
	}

	if ( state === 'paused' ) {
		return (
			<div className="jetpack-ai-voice-to-content__audio">
				<AudioDurationDisplay
					className="jetpack-ai-voice-to-content__audio--duration"
					url={ audioURL }
				/>
				<Oscilloscope audioURL={ audioURL } />
				<span className="jetpack-ai-voice-to-content__information">
					{ __( 'Paused', 'jetpack' ) }
				</span>
			</div>
		);
	}

	if ( state === 'transcribing' ) {
		return (
			<div className="jetpack-ai-voice-to-content__information">
				{ __( 'Uploading and transcribing audio…', 'jetpack' ) }
			</div>
		);
	}

	if ( state === 'error' ) {
		return <div className="jetpack-ai-voice-to-content__information--error">{ error }</div>;
	}

	return null;
}

function ActionButtons( { state, mediaControls } ) {
	const { start, pause, resume, stop } = mediaControls ?? {};

	const recordingHandler = useCallback( () => {
		if ( state === 'inactive' ) {
			start?.( 1000 ); // Stream audio on 1 second intervals
		} else if ( state === 'recording' ) {
			pause?.();
		} else if ( state === 'paused' ) {
			resume?.();
		}
	}, [ state, start, pause, resume ] );

	const uploadHandler = () => {
		throw new Error( 'Not implemented' );
	};

	const doneHandler = useCallback( () => {
		stop?.();
	}, [ stop ] );

	const cancelHandler = () => {
		throw new Error( 'Not implemented' );
	};

	let buttonLabel = __( 'Begin recording', 'jetpack' );
	if ( state === 'recording' ) {
		buttonLabel = __( 'Pause recording', 'jetpack' );
	} else if ( state === 'paused' ) {
		buttonLabel = __( 'Resume recording', 'jetpack' );
	}

	return (
		<div className="jetpack-ai-voice-to-content__action-buttons">
			{ [ 'inactive', 'recording', 'paused', 'error' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					icon={ state === 'recording' ? playerPauseIcon : micIcon }
					variant="secondary"
					onClick={ recordingHandler }
				>
					{ buttonLabel }
				</Button>
			) }
			{ [ 'inactive', 'error' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="secondary"
					onClick={ uploadHandler }
				>
					{ __( 'Upload audio', 'jetpack' ) }
				</Button>
			) }
			{ [ 'recording', 'paused' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="primary"
					onClick={ doneHandler }
				>
					{ __( 'Done', 'jetpack' ) }
				</Button>
			) }
			{ [ 'recording', 'paused', 'transcribing' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="secondary"
					onClick={ cancelHandler }
				>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			) }
		</div>
	);
}

export default function VoiceToContentEdit( { clientId } ) {
	const { state, controls, url } = useMediaRecording( {
		onDone: blob => {
			console.log( 'Blob created: ', blob ); // eslint-disable-line no-console
		},
	} );

	const error = null;

	const dispatch = useDispatch( 'core/block-editor' );

	const destroyBlock = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'VTC: destroy' );

		// Remove the block from the editor
		setTimeout( () => {
			dispatch.removeBlock( clientId );
		}, 100 );
	}, [ dispatch, clientId ] );

	const handleClose = () => {
		// eslint-disable-next-line no-console
		console.log( 'VTC: close' );
		destroyBlock();
	};

	// To avoid a wrong TS warning
	const iconProps = { className: 'icon' };

	return (
		<Modal
			onRequestClose={ handleClose }
			title={ __( 'Jetpack AI Voice to content', 'jetpack' ) }
			className="jetpack-ai-voice-to-content__modal"
		>
			<ThemeProvider>
				<div className="jetpack-ai-voice-to-content__wrapper">
					<div className="jetpack-ai-voice-to-content__body">
						<span className="jetpack-ai-voice-to-content__description">
							{ __(
								'Transform your spoken words into a post ready to publish with AI.',
								'jetpack'
							) }
						</span>
						<div className="jetpack-ai-voice-to-content__contextual-row">
							<ContextualRow state={ state } audioURL={ url } error={ error } />
						</div>
						<ActionButtons state={ state } mediaControls={ controls } />
					</div>
					<div className="jetpack-ai-voice-to-content__footer">
						<Button
							variant="link"
							className="jetpack-ai-voice-to-content__feedback-button"
							href="https://a8c.slack.com/archives/C054LN8RNVA" // Jetpack AI Slack channel
							target="_blank"
						>
							<span>{ __( 'Provide feedback', 'jetpack' ) }</span>
							<Icon icon={ external } { ...iconProps } />
						</Button>
					</div>
				</div>
			</ThemeProvider>
		</Modal>
	);
}
