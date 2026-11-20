import { drawRecordingFrame } from './effects';
import { recordStream } from '.';
import type { Recording } from '.';
import type { RecordingEffect } from './effects';

/**
 * Capture effected camera frames and the original microphone audio into a local recording.
 *
 * @param video     - Live camera monitor.
 * @param camera    - Camera and microphone stream.
 * @param getEffect - Read the current preset, including changes during recording.
 * @return Recording controls that also release the camera and rendering loop.
 */
export function recordCamera(
	video: HTMLVideoElement,
	camera: MediaStream,
	getEffect: () => RecordingEffect
): Recording {
	let frame = 0;
	let output: MediaStream | undefined;
	let recording: Recording | undefined;
	const doc = video.ownerDocument;
	const release = () => {
		cancelAnimationFrame( frame );
		camera.getTracks().forEach( track => {
			track.removeEventListener( 'ended', stop );
			track.stop();
		} );
		output?.getTracks().forEach( track => track.stop() );
		doc.removeEventListener( 'visibilitychange', visibilityChanged );
	};
	const stop = () => {
		void recording?.stop();
	};
	const visibilityChanged = () => {
		if ( doc.hidden ) {
			stop();
		}
	};
	try {
		if (
			! video.videoWidth ||
			! video.videoHeight ||
			video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
		) {
			throw new Error( 'The camera is not ready.' );
		}
		const canvas = doc.createElement( 'canvas' );
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext( '2d' );
		if ( ! context || ! canvas.captureStream ) {
			throw new Error( 'This browser cannot record video effects.' );
		}
		drawRecordingFrame( context, video, getEffect() );
		output = canvas.captureStream( 30 );
		camera.getAudioTracks().forEach( track => output!.addTrack( track ) );
		recording = recordStream( output );
		let lastPaint = -Infinity;
		const draw = ( now: number ) => {
			try {
				if ( video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && now - lastPaint >= 30 ) {
					drawRecordingFrame( context, video, getEffect() );
					lastPaint = now;
				}
				frame = requestAnimationFrame( draw );
			} catch {
				recording!.cancel();
				release();
			}
		};
		frame = requestAnimationFrame( draw );
		camera.getTracks().forEach( track => track.addEventListener( 'ended', stop, { once: true } ) );
		doc.addEventListener( 'visibilitychange', visibilityChanged );
		void recording.finished.then( release, release );
		return {
			...recording,
			cancel: () => {
				recording!.cancel();
				release();
			},
		};
	} catch ( error ) {
		release();
		throw error;
	}
}
