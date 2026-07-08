import { act, renderHook } from '@testing-library/react';
import { usePreviewPlayback } from '../use-preview-playback';
import type { CutRange, EditSession } from '../../state/edit-session';
import type { PreviewVideoElement, UsePreviewPlaybackOptions } from '../use-preview-playback';

/**
 * Scripted stand-in for an HTMLVideoElement: jsdom's <video> is inert (no
 * metadata, play() is unimplemented), so tests drive this fake instead.
 * Setting `currentTime` emits 'seeked' synchronously; `advanceToMs` moves
 * time silently, simulating playback progress between animation frames.
 */
class FakeVideoElement implements PreviewVideoElement {
	paused = true;
	duration = NaN;
	playCalls = 0;
	private timeSeconds = 0;
	private listeners = new Map< string, Set< () => void > >();

	get currentTime(): number {
		return this.timeSeconds;
	}

	set currentTime( seconds: number ) {
		this.timeSeconds = seconds;
		this.emit( 'seeked' );
	}

	addEventListener( type: string, listener: () => void ): void {
		if ( ! this.listeners.has( type ) ) {
			this.listeners.set( type, new Set() );
		}
		this.listeners.get( type )?.add( listener );
	}

	removeEventListener( type: string, listener: () => void ): void {
		this.listeners.get( type )?.delete( listener );
	}

	emit( type: string ): void {
		for ( const listener of [ ...( this.listeners.get( type ) ?? [] ) ] ) {
			listener();
		}
	}

	listenerCount(): number {
		let count = 0;
		for ( const set of this.listeners.values() ) {
			count += set.size;
		}
		return count;
	}

	play(): undefined {
		this.playCalls++;
		this.paused = false;
		this.emit( 'play' );
		return undefined;
	}

	pause(): void {
		if ( ! this.paused ) {
			this.paused = true;
			this.emit( 'pause' );
		}
	}

	/**
	 * Fire 'loadedmetadata' with the given duration.
	 *
	 * @param durationMs - Media duration in ms.
	 */
	loadMetadata( durationMs: number ): void {
		this.duration = durationMs / 1000;
		this.emit( 'loadedmetadata' );
	}

	/**
	 * Move the playhead without firing 'seeked' (playback progressing).
	 *
	 * @param ms - New playhead position in ms.
	 */
	advanceToMs( ms: number ): void {
		this.timeSeconds = ms / 1000;
	}
}

/**
 * Hand-build a session for the hook, bypassing the reducer.
 *
 * @param trimStartMs - Trim window start.
 * @param trimEndMs   - Trim window end.
 * @param cuts        - Cut ranges as [startMs, endMs] pairs.
 * @param durationMs  - Master duration (default 60000).
 * @return The session.
 */
function makeSession(
	trimStartMs: number,
	trimEndMs: number,
	cuts: [ number, number ][] = [],
	durationMs = 60000
): EditSession {
	return {
		durationMs,
		trimStartMs,
		trimEndMs,
		cuts: cuts.map( ( [ startMs, endMs ], i ): CutRange => ( { id: `c${ i }`, startMs, endMs } ) ),
		selectedCutId: null,
	};
}

let rafCallbacks: Map< number, FrameRequestCallback >;
let nextRafId: number;

beforeEach( () => {
	rafCallbacks = new Map();
	nextRafId = 1;
	jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( callback => {
		const id = nextRafId++;
		rafCallbacks.set( id, callback );
		return id;
	} );
	jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation( id => {
		rafCallbacks.delete( id );
	} );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

/**
 * Run every pending animation-frame callback once, inside act().
 */
function flushFrame(): void {
	const pending = [ ...rafCallbacks.values() ];
	rafCallbacks.clear();
	act( () => {
		pending.forEach( callback => callback( 0 ) );
	} );
}

/**
 * Number of animation frames currently scheduled.
 *
 * @return The pending frame count.
 */
function pendingFrames(): number {
	return rafCallbacks.size;
}

/**
 * Render the hook with an attached fake element.
 *
 * @param options - Initial hook options (previewCutsEnabled defaults true).
 * @return The renderHook result plus the fake element.
 */
function renderPlayback(
	options: Partial< UsePreviewPlaybackOptions > & { session: EditSession }
) {
	const initialProps: UsePreviewPlaybackOptions = { previewCutsEnabled: true, ...options };
	const utils = renderHook( ( props: UsePreviewPlaybackOptions ) => usePreviewPlayback( props ), {
		initialProps,
	} );
	const video = new FakeVideoElement();
	act( () => utils.result.current.attachVideo( video ) );
	return { ...utils, video };
}

describe( 'usePreviewPlayback', () => {
	describe( 'initial state and metadata', () => {
		it( 'starts paused at zero with the fallback duration', () => {
			const { result } = renderPlayback( {
				session: makeSession( 0, 60000 ),
				fallbackDurationMs: 60000,
			} );
			expect( result.current.currentMs ).toBe( 0 );
			expect( result.current.playing ).toBe( false );
			expect( result.current.durationMs ).toBe( 60000 );
		} );

		it( 'defaults durationMs to 0 without a fallback', () => {
			const { result } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			expect( result.current.durationMs ).toBe( 0 );
		} );

		it( 'prefers the element metadata duration once loaded', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 0, 60000 ),
				fallbackDurationMs: 60000,
			} );
			act( () => video.loadMetadata( 61500 ) );
			expect( result.current.durationMs ).toBe( 61500 );
		} );

		it( 'reads duration and position from an element attached after metadata', () => {
			const { result } = renderHook(
				( props: UsePreviewPlaybackOptions ) => usePreviewPlayback( props ),
				{ initialProps: { session: makeSession( 0, 60000 ), previewCutsEnabled: true } }
			);
			const video = new FakeVideoElement();
			video.duration = 42;
			video.advanceToMs( 5000 );
			act( () => result.current.attachVideo( video ) );
			expect( result.current.durationMs ).toBe( 42000 );
			expect( result.current.currentMs ).toBe( 5000 );
		} );
	} );

	describe( 'transport', () => {
		it( 'play() starts the element and the frame loop', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.play() );
			expect( video.playCalls ).toBe( 1 );
			expect( result.current.playing ).toBe( true );
			expect( pendingFrames() ).toBe( 1 );
		} );

		it( 'updates currentMs from the element on every frame', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.play() );
			video.advanceToMs( 16 );
			flushFrame();
			expect( result.current.currentMs ).toBe( 16 );
			video.advanceToMs( 33 );
			flushFrame();
			expect( result.current.currentMs ).toBe( 33 );
			expect( pendingFrames() ).toBe( 1 );
		} );

		it( 'pause() stops the element and the frame loop', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.play() );
			act( () => result.current.pause() );
			expect( result.current.playing ).toBe( false );
			expect( video.paused ).toBe( true );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'togglePlay() alternates between play and pause', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.togglePlay() );
			expect( video.paused ).toBe( false );
			act( () => result.current.togglePlay() );
			expect( video.paused ).toBe( true );
		} );

		it( 'reflects a native ended event as paused', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.play() );
			act( () => {
				video.advanceToMs( 60000 );
				video.emit( 'ended' );
			} );
			expect( result.current.playing ).toBe( false );
			expect( result.current.currentMs ).toBe( 60000 );
			expect( pendingFrames() ).toBe( 0 );
		} );
	} );

	describe( 'seeking', () => {
		it( 'seekTo() moves the element and currentMs', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 0, 60000 ),
				fallbackDurationMs: 60000,
			} );
			act( () => result.current.seekTo( 12345 ) );
			expect( video.currentTime ).toBe( 12.345 );
			expect( result.current.currentMs ).toBe( 12345 );
		} );

		it( 'clamps seeks into [0, duration] and rounds to integers', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 0, 60000 ),
				fallbackDurationMs: 60000,
			} );
			act( () => result.current.seekTo( -50 ) );
			expect( result.current.currentMs ).toBe( 0 );
			act( () => result.current.seekTo( 99999999 ) );
			expect( result.current.currentMs ).toBe( 60000 );
			act( () => result.current.seekTo( 100.6 ) );
			expect( result.current.currentMs ).toBe( 101 );
			expect( video.currentTime ).toBe( 0.101 );
		} );

		it( 'allows paused seeks outside the trim window (scrubbing the master)', () => {
			const { result } = renderPlayback( {
				session: makeSession( 10000, 20000 ),
				fallbackDurationMs: 60000,
			} );
			act( () => result.current.seekTo( 500 ) );
			expect( result.current.currentMs ).toBe( 500 );
		} );

		it( 'syncs currentMs from external seeks while paused', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => {
				video.currentTime = 3;
			} );
			expect( result.current.currentMs ).toBe( 3000 );
		} );
	} );

	describe( 'skip engine integration', () => {
		it( 'playing into a cut seeks past it', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 1000, 9000, [ [ 2000, 4000 ] ] ),
			} );
			act( () => result.current.seekTo( 1500 ) );
			act( () => result.current.play() );
			video.advanceToMs( 2500 );
			flushFrame();
			expect( video.currentTime ).toBe( 4 );
			expect( result.current.currentMs ).toBe( 4000 );
			expect( result.current.playing ).toBe( true );
			expect( pendingFrames() ).toBe( 1 );
		} );

		it( 'does not skip cuts when preview cuts is off', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 1000, 9000, [ [ 2000, 4000 ] ] ),
				previewCutsEnabled: false,
			} );
			act( () => result.current.seekTo( 1500 ) );
			act( () => result.current.play() );
			video.advanceToMs( 2500 );
			flushFrame();
			expect( video.currentTime ).toBe( 2.5 );
			expect( result.current.currentMs ).toBe( 2500 );
		} );

		it( 'honors a preview-cuts toggle mid-playback', () => {
			const session = makeSession( 1000, 9000, [ [ 2000, 4000 ] ] );
			const { result, video, rerender } = renderPlayback( {
				session,
				previewCutsEnabled: false,
			} );
			act( () => result.current.seekTo( 1500 ) );
			act( () => result.current.play() );
			video.advanceToMs( 2500 );
			flushFrame();
			expect( result.current.currentMs ).toBe( 2500 );
			rerender( { session, previewCutsEnabled: true } );
			flushFrame();
			expect( video.currentTime ).toBe( 4 );
			expect( result.current.currentMs ).toBe( 4000 );
		} );

		it( 'still enforces trim bounds when preview cuts is off', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 1000, 9000 ),
				previewCutsEnabled: false,
			} );
			act( () => result.current.play() );
			video.advanceToMs( 200 );
			flushFrame();
			expect( video.currentTime ).toBe( 1 );
			expect( result.current.currentMs ).toBe( 1000 );
		} );

		it( 'pauses at the trim end', () => {
			const { result, video } = renderPlayback( { session: makeSession( 1000, 9000 ) } );
			act( () => result.current.seekTo( 8900 ) );
			act( () => result.current.play() );
			video.advanceToMs( 9000 );
			flushFrame();
			expect( result.current.playing ).toBe( false );
			expect( video.paused ).toBe( true );
			expect( result.current.currentMs ).toBe( 9000 );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'clamps an overshoot back to the trim end before pausing', () => {
			const { result, video } = renderPlayback( { session: makeSession( 1000, 9000 ) } );
			act( () => result.current.seekTo( 8900 ) );
			act( () => result.current.play() );
			video.advanceToMs( 9250 );
			flushFrame();
			expect( video.currentTime ).toBe( 9 );
			expect( result.current.currentMs ).toBe( 9000 );
			expect( result.current.playing ).toBe( false );
		} );

		it( 'ends playback when a cut runs into the trim end', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 1000, 9000, [ [ 7000, 9000 ] ] ),
			} );
			act( () => result.current.seekTo( 6900 ) );
			act( () => result.current.play() );
			video.advanceToMs( 7100 );
			flushFrame();
			expect( video.currentTime ).toBe( 9 );
			expect( result.current.currentMs ).toBe( 9000 );
			expect( result.current.playing ).toBe( false );
		} );

		it( 'play() at the end restarts from the trim start', () => {
			const { result, video } = renderPlayback( { session: makeSession( 1000, 9000 ) } );
			act( () => result.current.seekTo( 9000 ) );
			act( () => result.current.play() );
			expect( video.currentTime ).toBe( 1 );
			expect( result.current.currentMs ).toBe( 1000 );
			expect( result.current.playing ).toBe( true );
		} );

		it( 'play() before the trim window snaps to the trim start first', () => {
			const { result, video } = renderPlayback( { session: makeSession( 1000, 9000 ) } );
			act( () => result.current.seekTo( 200 ) );
			act( () => result.current.play() );
			expect( video.currentTime ).toBe( 1 );
			expect( result.current.currentMs ).toBe( 1000 );
		} );

		it( 'play() inside a cut starts from the cut end when preview is on', () => {
			const { result, video } = renderPlayback( {
				session: makeSession( 1000, 9000, [ [ 2000, 4000 ] ] ),
			} );
			act( () => result.current.seekTo( 3000 ) );
			act( () => result.current.play() );
			expect( video.currentTime ).toBe( 4 );
			expect( result.current.currentMs ).toBe( 4000 );
		} );
	} );

	describe( 'cleanup', () => {
		it( 'detaches listeners when the element is removed', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			expect( video.listenerCount() ).toBeGreaterThan( 0 );
			act( () => result.current.attachVideo( null ) );
			expect( video.listenerCount() ).toBe( 0 );
		} );

		it( 'stops the loop and removes listeners on unmount', () => {
			const { result, video, unmount } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			act( () => result.current.play() );
			expect( pendingFrames() ).toBe( 1 );
			unmount();
			expect( video.listenerCount() ).toBe( 0 );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'swaps listeners when a new element is attached', () => {
			const { result, video } = renderPlayback( { session: makeSession( 0, 60000 ) } );
			const replacement = new FakeVideoElement();
			act( () => result.current.attachVideo( replacement ) );
			expect( video.listenerCount() ).toBe( 0 );
			expect( replacement.listenerCount() ).toBeGreaterThan( 0 );
		} );
	} );
} );
