import { act, renderHook } from '@testing-library/react';
import { usePreviewPlayback } from '../use-preview-playback';
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
 * @param options - Initial hook options.
 * @return The renderHook result plus the fake element.
 */
function renderPlayback( options: UsePreviewPlaybackOptions = {} ) {
	const utils = renderHook( ( props: UsePreviewPlaybackOptions ) => usePreviewPlayback( props ), {
		initialProps: options,
	} );
	const video = new FakeVideoElement();
	act( () => utils.result.current.attachVideo( video ) );
	return { ...utils, video };
}

describe( 'usePreviewPlayback', () => {
	describe( 'initial state and metadata', () => {
		it( 'starts paused at zero with the fallback duration', () => {
			const { result } = renderPlayback( { fallbackDurationMs: 60000 } );
			expect( result.current.currentMs ).toBe( 0 );
			expect( result.current.playing ).toBe( false );
			expect( result.current.durationMs ).toBe( 60000 );
		} );

		it( 'defaults durationMs to 0 without a fallback', () => {
			const { result } = renderPlayback();
			expect( result.current.durationMs ).toBe( 0 );
		} );

		it( 'prefers the element metadata duration once loaded', () => {
			const { result, video } = renderPlayback( { fallbackDurationMs: 60000 } );
			act( () => video.loadMetadata( 61500 ) );
			expect( result.current.durationMs ).toBe( 61500 );
		} );

		it( 'reads duration and position from an element attached after metadata', () => {
			const { result } = renderHook(
				( props: UsePreviewPlaybackOptions ) => usePreviewPlayback( props ),
				{ initialProps: {} }
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
			const { result, video } = renderPlayback();
			act( () => result.current.play() );
			expect( video.playCalls ).toBe( 1 );
			expect( result.current.playing ).toBe( true );
			expect( pendingFrames() ).toBe( 1 );
		} );

		it( 'updates currentMs from the element on every frame', () => {
			const { result, video } = renderPlayback();
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
			const { result, video } = renderPlayback();
			act( () => result.current.play() );
			act( () => result.current.pause() );
			expect( result.current.playing ).toBe( false );
			expect( video.paused ).toBe( true );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'togglePlay() alternates between play and pause', () => {
			const { result, video } = renderPlayback();
			act( () => result.current.togglePlay() );
			expect( video.paused ).toBe( false );
			act( () => result.current.togglePlay() );
			expect( video.paused ).toBe( true );
		} );

		it( 'reflects a native ended event as paused', () => {
			const { result, video } = renderPlayback();
			act( () => result.current.play() );
			act( () => {
				video.advanceToMs( 60000 );
				video.emit( 'ended' );
			} );
			expect( result.current.playing ).toBe( false );
			expect( result.current.currentMs ).toBe( 60000 );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'reflects an external pause detected by the frame loop', () => {
			const { result, video } = renderPlayback();
			act( () => result.current.play() );
			// Something outside the hook paused the element (OS media keys,
			// another script) without our pause() running.
			video.paused = true;
			flushFrame();
			expect( result.current.playing ).toBe( false );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'play() at the media end restarts from the beginning', () => {
			const { result, video } = renderPlayback( { fallbackDurationMs: 60000 } );
			act( () => result.current.seekTo( 60000 ) );
			act( () => result.current.play() );
			expect( video.currentTime ).toBe( 0 );
			expect( result.current.currentMs ).toBe( 0 );
			expect( result.current.playing ).toBe( true );
		} );
	} );

	describe( 'seeking', () => {
		it( 'seekTo() moves the element and currentMs', () => {
			const { result, video } = renderPlayback( { fallbackDurationMs: 60000 } );
			act( () => result.current.seekTo( 12345 ) );
			expect( video.currentTime ).toBe( 12.345 );
			expect( result.current.currentMs ).toBe( 12345 );
		} );

		it( 'clamps seeks into [0, duration] and rounds to integers', () => {
			const { result, video } = renderPlayback( { fallbackDurationMs: 60000 } );
			act( () => result.current.seekTo( -50 ) );
			expect( result.current.currentMs ).toBe( 0 );
			act( () => result.current.seekTo( 99999999 ) );
			expect( result.current.currentMs ).toBe( 60000 );
			act( () => result.current.seekTo( 100.6 ) );
			expect( result.current.currentMs ).toBe( 101 );
			expect( video.currentTime ).toBe( 0.101 );
		} );

		it( 'syncs currentMs from external seeks while paused', () => {
			const { result, video } = renderPlayback();
			act( () => {
				video.currentTime = 3;
			} );
			expect( result.current.currentMs ).toBe( 3000 );
		} );
	} );

	describe( 'cleanup', () => {
		it( 'detaches listeners when the element is removed', () => {
			const { result, video } = renderPlayback();
			expect( video.listenerCount() ).toBeGreaterThan( 0 );
			act( () => result.current.attachVideo( null ) );
			expect( video.listenerCount() ).toBe( 0 );
		} );

		it( 'stops the loop and removes listeners on unmount', () => {
			const { result, video, unmount } = renderPlayback();
			act( () => result.current.play() );
			expect( pendingFrames() ).toBe( 1 );
			unmount();
			expect( video.listenerCount() ).toBe( 0 );
			expect( pendingFrames() ).toBe( 0 );
		} );

		it( 'swaps listeners when a new element is attached', () => {
			const { result, video } = renderPlayback();
			const replacement = new FakeVideoElement();
			act( () => result.current.attachVideo( replacement ) );
			expect( video.listenerCount() ).toBe( 0 );
			expect( replacement.listenerCount() ).toBeGreaterThan( 0 );
		} );
	} );
} );
