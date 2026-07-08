/**
 * The DOM-backed frame grabber behind useFilmstrip's client-side extraction:
 * a detached, muted, CORS-anonymous <video> that seeks to requested times and
 * draws the current frame onto one small reused canvas, returning JPEG object
 * URLs.
 *
 * Deliberately never exercised by jsdom tests — jsdom media elements neither
 * load nor seek. The orchestration around it (ordering, cancellation,
 * error → unavailable) is tested against a fake FrameGrabber instead; this
 * file stays a thin adapter over the real media/canvas APIs.
 */

/**
 * The native width extracted frames are captured at; height follows the
 * source aspect ratio. Exported so the filmstrip can cover-crop an extracted
 * frame without ever drawing it wider than this (the never-upscale invariant).
 */
export const FRAME_WIDTH = 160;

/** Height/width fallback (16:9 → 160×90) when the metadata reports no size. */
const FALLBACK_ASPECT = 9 / 16;

/** Filmstrip tiles are tiny; favor size over fidelity. */
const JPEG_QUALITY = 0.7;

/**
 * The seam between the extraction orchestration and the media APIs. Kept
 * tiny on purpose: tests drive the orchestrator with a fake implementation.
 */
export interface FrameGrabber {
	/** Resolve once the media's metadata (duration, dimensions) is known. */
	load: () => Promise< void >;
	/** Seek to a master-timeline time and capture one frame as an object URL. */
	grabFrame: ( timeMs: number ) => Promise< string >;
	/** Release the media element and canvas resources. */
	destroy: () => void;
}

/**
 * Create a FrameGrabber over a hidden <video> element.
 *
 * There is deliberately no timeout at this layer: the extraction pool
 * (frame-extraction-pool.ts) races every load/seek against its per-seek
 * timeout, fails that one frame, and revokes any URL a late-settling grab
 * produces afterwards. A superseding grabFrame call re-assigns currentTime,
 * which per the media spec cancels the abandoned seek; its stale 'seeked'
 * waiter resolves on the new seek's event and self-removes.
 *
 * @param src - The video source URL (already token-signed when private).
 * @return The grabber.
 */
export function createVideoFrameGrabber( src: string ): FrameGrabber {
	const video = document.createElement( 'video' );
	video.preload = 'metadata';
	video.muted = true;
	// Without CORS approval drawing to the canvas would taint it and toBlob
	// would throw a SecurityError (which the orchestrator maps to
	// 'unavailable'); VideoPress file URLs serve permissive CORS headers.
	video.crossOrigin = 'anonymous';

	let canvas: HTMLCanvasElement | null = null;
	let context: CanvasRenderingContext2D | null = null;

	/**
	 * Wait for one occurrence of a media event, rejecting on 'error'.
	 *
	 * @param eventName - The event that resolves the wait.
	 * @return A promise settling on the event or on a media error.
	 */
	const waitForEvent = ( eventName: string ): Promise< void > => {
		return new Promise< void >( ( resolve, reject ) => {
			const cleanup = () => {
				video.removeEventListener( eventName, onEvent );
				video.removeEventListener( 'error', onError );
			};
			const onEvent = () => {
				cleanup();
				resolve();
			};
			const onError = () => {
				cleanup();
				reject( new Error( 'The filmstrip source video failed to load.' ) );
			};
			video.addEventListener( eventName, onEvent );
			video.addEventListener( 'error', onError );
		} );
	};

	// Attach the metadata wait before setting src so a fast (cached) load
	// can't slip between the two; park the rejection until load() awaits it.
	const metadataReady = waitForEvent( 'loadedmetadata' );
	metadataReady.catch( () => {} );
	video.src = src;

	return {
		load: () => metadataReady,

		async grabFrame( timeMs: number ): Promise< string > {
			const durationSec = Number.isFinite( video.duration ) ? video.duration : Infinity;
			const target = Math.min( Math.max( timeMs / 1000, 0 ), durationSec );
			// Assigning the current time again would never fire 'seeked'.
			if ( video.currentTime !== target ) {
				const seeked = waitForEvent( 'seeked' );
				video.currentTime = target;
				await seeked;
			}

			if ( ! canvas ) {
				canvas = document.createElement( 'canvas' );
				const aspect =
					video.videoWidth > 0 && video.videoHeight > 0
						? video.videoHeight / video.videoWidth
						: FALLBACK_ASPECT;
				canvas.width = FRAME_WIDTH;
				canvas.height = Math.max( 1, Math.round( FRAME_WIDTH * aspect ) );
				context = canvas.getContext( '2d' );
			}
			if ( ! context ) {
				throw new Error( 'Canvas 2D context unavailable.' );
			}

			context.drawImage( video, 0, 0, canvas.width, canvas.height );
			const blob = await new Promise< Blob >( ( resolve, reject ) => {
				// On a tainted canvas toBlob throws synchronously; the executor
				// turns that into a rejection.
				( canvas as HTMLCanvasElement ).toBlob(
					result =>
						result ? resolve( result ) : reject( new Error( 'Frame encoding produced no blob.' ) ),
					'image/jpeg',
					JPEG_QUALITY
				);
			} );
			return URL.createObjectURL( blob );
		},

		destroy() {
			// Per the media-element spec, removing src and re-invoking the load
			// algorithm releases the network and decoder resources.
			video.removeAttribute( 'src' );
			video.load();
			canvas = null;
			context = null;
		},
	};
}
