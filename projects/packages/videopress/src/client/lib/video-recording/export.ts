import { recordStream } from '.';
import type { EditSession } from '../../../dashboard/components/editor/state/edit-session';

/**
 * Derive the retained source ranges from the shared trim and cut session.
 *
 * @param session - Local edits.
 * @return Retained source ranges in milliseconds.
 */
export function getRecordingRanges( session: EditSession ): { startMs: number; endMs: number }[] {
	const ranges: { startMs: number; endMs: number }[] = [];
	let startMs = session.trimStartMs;
	for ( const cut of session.cuts ) {
		if ( cut.startMs > startMs ) {
			ranges.push( { startMs, endMs: cut.startMs } );
		}
		startMs = Math.max( startMs, cut.endMs );
	}
	if ( startMs < session.trimEndMs ) {
		ranges.push( { startMs, endMs: session.trimEndMs } );
	}
	return ranges;
}

/**
 * Wait for a local media operation without leaving listeners behind on failure.
 *
 * @param video  - Source element.
 * @param event  - Completion event.
 * @param signal - Cancellation signal.
 * @param start  - Start the media operation after subscribing.
 * @return Completion promise.
 */
function waitForMedia(
	video: HTMLVideoElement,
	event: string,
	signal: AbortSignal,
	start: () => void
): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		const finish = ( error?: unknown ) => {
			clearTimeout( timeout );
			video.removeEventListener( event, done );
			video.removeEventListener( 'error', failed );
			signal.removeEventListener( 'abort', aborted );
			if ( error ) {
				reject( error );
			} else {
				resolve();
			}
		};
		const done = () => finish();
		const failed = () => finish( new Error( 'The recording could not be decoded.' ) );
		const aborted = () => finish( signal.reason ?? new DOMException( 'Aborted', 'AbortError' ) );
		const timeout = setTimeout( failed, 15000 );
		video.addEventListener( event, done, { once: true } );
		video.addEventListener( 'error', failed, { once: true } );
		signal.addEventListener( 'abort', aborted, { once: true } );
		if ( signal.aborted ) {
			aborted();
		} else {
			try {
				start();
			} catch ( error ) {
				finish( error );
			}
		}
	} );
}

/**
 * Render retained ranges to a local MP4 before handing it to the regular uploader.
 *
 * @param file       - Original camera recording.
 * @param session    - Shared timeline edits.
 * @param signal     - Cancellation signal.
 * @param onProgress - Output progress, from zero to one.
 * @return Edited MP4 file, or the original file when no edits were made.
 */
export async function exportRecording(
	file: File,
	session: EditSession,
	signal: AbortSignal,
	onProgress: ( progress: number ) => void
): Promise< File > {
	const controller = new AbortController();
	const abort = () => controller.abort( signal.reason );
	const visibilityChanged = () => {
		if ( document.hidden ) {
			controller.abort( new Error( 'Keep the recording tab visible while preparing the video.' ) );
		}
	};
	signal.addEventListener( 'abort', abort, { once: true } );
	document.addEventListener( 'visibilitychange', visibilityChanged );
	try {
		signal.throwIfAborted();
		visibilityChanged();
		return await renderRecording( file, session, controller.signal, onProgress );
	} finally {
		signal.removeEventListener( 'abort', abort );
		document.removeEventListener( 'visibilitychange', visibilityChanged );
	}
}

/**
 * Encode local playback while pausing output across the removed source ranges.
 *
 * @param file       - Original camera recording.
 * @param session    - Shared timeline edits.
 * @param signal     - Cancellation signal.
 * @param onProgress - Output progress, from zero to one.
 * @return Local MP4 file.
 */
async function renderRecording(
	file: File,
	session: EditSession,
	signal: AbortSignal,
	onProgress: ( progress: number ) => void
): Promise< File > {
	signal.throwIfAborted();
	if (
		session.trimStartMs === 0 &&
		session.trimEndMs === session.durationMs &&
		session.cuts.length === 0
	) {
		return file;
	}
	const ranges = getRecordingRanges( session );
	if ( ! ranges.length ) {
		throw new Error( 'The edited video is empty.' );
	}
	const video = document.createElement( 'video' );
	video.playsInline = true;
	video.preload = 'auto';
	const audio = new AudioContext();
	const destination = audio.createMediaStreamDestination();
	const source = audio.createMediaElementSource( video );
	source.connect( destination );
	const url = URL.createObjectURL( file );
	let output: ReturnType< typeof recordStream > | undefined;
	let frame = 0;
	let stream: MediaStream | undefined;
	try {
		await Promise.all( [
			audio.resume(),
			waitForMedia( video, 'loadeddata', signal, () => {
				video.src = url;
				video.load();
			} ),
		] );
		const canvas = document.createElement( 'canvas' );
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext( '2d' );
		if ( ! context || ! canvas.captureStream ) {
			throw new Error( 'This browser cannot prepare edited recordings.' );
		}
		const draw = () => {
			if ( video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ) {
				context.drawImage( video, 0, 0, canvas.width, canvas.height );
			}
			frame = requestAnimationFrame( draw );
		};
		const durationMs = ranges.reduce( ( total, range ) => total + range.endMs - range.startMs, 0 );
		let completedMs = 0;
		for ( const range of ranges ) {
			if ( Math.abs( video.currentTime * 1000 - range.startMs ) > 1 ) {
				await waitForMedia( video, 'seeked', signal, () => {
					video.currentTime = range.startMs / 1000;
				} );
			}
			context.drawImage( video, 0, 0, canvas.width, canvas.height );
			if ( ! output ) {
				stream = canvas.captureStream( 30 );
				destination.stream.getAudioTracks().forEach( track => stream!.addTrack( track ) );
				output = recordStream( stream );
				draw();
			} else {
				output.resume();
			}
			const recording = output;
			await new Promise< void >( ( resolve, reject ) => {
				let settled = false;
				let timer: ReturnType< typeof setTimeout >;
				const finish = ( error?: unknown ) => {
					if ( settled ) {
						return;
					}
					settled = true;
					clearTimeout( timer );
					clearTimeout( deadline );
					video.pause();
					signal.removeEventListener( 'abort', abort );
					video.removeEventListener( 'error', fail );
					error ? reject( error ) : resolve();
				};
				const abort = () => finish( signal.reason ?? new DOMException( 'Aborted', 'AbortError' ) );
				const fail = () => finish( new Error( 'The recording could not be played.' ) );
				const deadline = setTimeout( fail, ( range.endMs - range.startMs ) * 2 + 15000 );
				const tick = () => {
					if ( settled ) {
						return;
					}
					const currentMs = video.currentTime * 1000;
					onProgress( Math.min( 1, ( completedMs + currentMs - range.startMs ) / durationMs ) );
					if ( currentMs >= range.endMs || video.ended ) {
						finish();
					} else {
						timer = setTimeout( tick, 10 );
					}
				};
				signal.addEventListener( 'abort', abort, { once: true } );
				video.addEventListener( 'error', fail, { once: true } );
				void recording.finished.then(
					() => finish( new Error( 'Recording ended before the video was prepared.' ) ),
					finish
				);
				if ( signal.aborted ) {
					abort();
				} else {
					void video.play().then( tick, finish );
				}
			} );
			output.pause();
			completedMs += range.endMs - range.startMs;
		}
		const result = await output!.stop();
		onProgress( 1 );
		return result;
	} finally {
		cancelAnimationFrame( frame );
		output?.cancel();
		stream?.getTracks().forEach( track => track.stop() );
		destination.stream.getTracks().forEach( track => track.stop() );
		source.disconnect();
		void audio.close();
		video.pause();
		video.removeAttribute( 'src' );
		video.load();
		URL.revokeObjectURL( url );
	}
}
