/**
 * Collects a signed-in viewer's playback on a channel video page, from the iframe player
 * ( postMessage from a trusted VideoPress origin ) or the inline player ( its <video> element ),
 * and records it in their history.
 */
import { isAllowedOrigin } from '../videopress-allowed-origins';
import { PlayTracker } from './tracker';

type Config = {
	guid: string;
	path: string;
	nonce: string;
	epoch: number;
	generation: number;
};

declare global {
	interface Window {
		videoPressViewerHistory?: Config;
	}
}

const FLUSH_MS = 15000;

/**
 * Start collecting playback for the page's video.
 *
 * @param config - Video, route, nonce and the epoch and generation the page was rendered with.
 */
export function startViewerHistory( config: Config ): void {
	const tracker = new PlayTracker();
	const session =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: String( Date.now() ) + Math.random().toString( 16 ).slice( 2 );
	let seq = 0;
	let { epoch, generation } = config;
	let stopped = false;

	const flush = ( keepalive = false ) => {
		if ( stopped || ! tracker.hasActivity() ) {
			return;
		}
		const segments = tracker.take();
		seq += 1;
		fetch( config.path, {
			method: 'POST',
			credentials: 'same-origin',
			keepalive,
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
			body: JSON.stringify( {
				action: 'progress',
				epoch,
				generation,
				session,
				seq,
				position_ms: tracker.positionMs,
				duration_ms: tracker.durationMs,
				segments,
			} ),
		} )
			.then( response => {
				// A reset or clear happened elsewhere; this session's events no longer count.
				if ( response.status === 409 || response.status === 401 || response.status === 403 ) {
					stopped = true;
				}
				return response.ok ? response.json() : null;
			} )
			.then( data => {
				if ( data ) {
					epoch = data.epoch;
					generation = data.generation;
				}
			} )
			.catch( () => {} );
	};

	// Iframe player: only events about this video, from a VideoPress iframe on this page.
	window.addEventListener( 'message', event => {
		const data = event.data;
		if (
			! data ||
			typeof data !== 'object' ||
			data.id !== config.guid ||
			! isAllowedOrigin( event.origin )
		) {
			return;
		}
		const fromFrame = Array.from( document.querySelectorAll( 'iframe' ) ).some(
			frame => frame.contentWindow === event.source
		);
		if ( ! fromFrame ) {
			return;
		}
		switch ( data.event ) {
			case 'videopress_playing':
				tracker.play();
				break;
			case 'videopress_pause':
			case 'videopress_seeking':
			case 'videopress_ended':
				tracker.stop();
				flush();
				break;
			case 'videopress_timeupdate':
				tracker.time( Number( data.currentTimeMs ?? ( data.currentTime ?? 0 ) * 1000 ) );
				break;
			case 'videopress_durationchange':
				tracker.duration( Number( data.durationMs ?? ( data.duration ?? 0 ) * 1000 ) );
				break;
		}
	} );

	// Inline player: the <video> it mounts in the block's wrapper.
	const attach = ( video: HTMLVideoElement ) => {
		if ( video.dataset.vpHistory ) {
			return;
		}
		video.dataset.vpHistory = '1';
		video.addEventListener( 'playing', () => tracker.play() );
		video.addEventListener( 'timeupdate', () => tracker.time( video.currentTime * 1000 ) );
		video.addEventListener( 'durationchange', () => tracker.duration( video.duration * 1000 ) );
		[ 'pause', 'seeking', 'ended' ].forEach( name =>
			video.addEventListener( name, () => {
				tracker.stop();
				flush();
			} )
		);
	};
	const scan = () =>
		document
			.querySelectorAll< HTMLVideoElement >( '.jetpack-videopress-player__wrapper video' )
			.forEach( attach );
	scan();
	new MutationObserver( scan ).observe( document.body, { childList: true, subtree: true } );

	setInterval( () => flush(), FLUSH_MS );
	document.addEventListener( 'visibilitychange', () => {
		if ( document.visibilityState === 'hidden' ) {
			flush( true );
		}
	} );
	window.addEventListener( 'pagehide', () => flush( true ) );
}

if ( typeof window !== 'undefined' && window.videoPressViewerHistory ) {
	startViewerHistory( window.videoPressViewerHistory );
}
