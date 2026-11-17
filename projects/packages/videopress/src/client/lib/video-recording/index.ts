/**
 * Select a recording container accepted by the regular VideoPress uploader.
 *
 * @return Supported MP4 MIME type, or undefined when recording is unavailable.
 */
export function getRecordingMimeType(): string | undefined {
	if ( typeof MediaRecorder === 'undefined' ) {
		return undefined;
	}
	return [ 'video/mp4;codecs=avc1.424028,mp4a.40.2', 'video/mp4' ].find( type =>
		MediaRecorder.isTypeSupported( type )
	);
}

export type Recording = {
	finished: Promise< File >;
	stop: () => Promise< File >;
	cancel: () => void;
	pause: () => void;
	resume: () => void;
};

/**
 * Record a camera stream, releasing its tracks on completion or cancellation.
 *
 * @param stream - Camera and microphone stream.
 * @return Recording controls.
 */
export function recordStream( stream: MediaStream ): Recording {
	const release = () => stream.getTracks().forEach( track => track.stop() );
	const mimeType = getRecordingMimeType();
	if ( ! mimeType ) {
		release();
		throw new Error( 'This browser cannot record MP4 video.' );
	}
	let recorder: MediaRecorder;
	try {
		recorder = new MediaRecorder( stream, { mimeType } );
	} catch ( error ) {
		release();
		throw error;
	}
	const chunks: Blob[] = [];
	let cancelled = false;
	let resolveFile: ( file: File ) => void;
	let rejectFile: ( error: Error ) => void;
	const result = new Promise< File >( ( resolve, reject ) => {
		resolveFile = resolve;
		rejectFile = reject;
	} );
	// A device can fail before the user requests the completed file.
	void result.catch( () => {} );
	recorder.ondataavailable = event => {
		if ( event.data.size && ! cancelled ) {
			chunks.push( event.data );
		}
	};
	recorder.onerror = () => {
		release();
		rejectFile( new Error( 'Video recording failed.' ) );
	};
	recorder.onstop = () => {
		release();
		if ( cancelled || ! chunks.length ) {
			rejectFile( new Error( 'No video was recorded.' ) );
			return;
		}
		resolveFile( new File( chunks, `recording-${ Date.now() }.mp4`, { type: 'video/mp4' } ) );
	};
	try {
		recorder.start( 1000 );
	} catch ( error ) {
		release();
		throw error;
	}
	return {
		finished: result,
		pause: () => recorder.pause(),
		resume: () => recorder.resume(),
		stop: () => {
			if ( recorder.state !== 'inactive' ) {
				recorder.stop();
			}
			return result;
		},
		cancel: () => {
			cancelled = true;
			chunks.length = 0;
			if ( recorder.state !== 'inactive' ) {
				recorder.stop();
			}
			release();
		},
	};
}
