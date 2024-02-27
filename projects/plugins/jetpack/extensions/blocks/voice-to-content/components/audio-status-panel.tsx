/**
 * External dependencies
 */
import { AudioDurationDisplay } from '@automattic/jetpack-ai-client';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Oscilloscope from './oscilloscope';
/**
 * Types
 */
import type { TranscriptionState } from '@automattic/jetpack-ai-client';

export default function AudioStatusPanel( {
	state,
	error = null,
	analyser,
	duration = 0,
}: {
	state: TranscriptionState;
	error: string;
	analyser: AnalyserNode;
	duration: number;
} ) {
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
					duration={ duration }
				/>
				<Oscilloscope analyser={ analyser } paused={ false } />
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
					duration={ duration }
				/>
				<Oscilloscope analyser={ analyser } paused={ true } />
				<span className="jetpack-ai-voice-to-content__information">
					{ __( 'Paused', 'jetpack' ) }
				</span>
			</div>
		);
	}

	if ( state === 'processing' ) {
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
