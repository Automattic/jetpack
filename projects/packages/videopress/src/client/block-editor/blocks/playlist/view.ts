/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import { isAllowedOrigin } from '../../../lib/videopress-allowed-origins';
import './view.scss';

// The per-video slice of the JSON config emitted by
// Playlist_Block::render_config().
type PlaylistConfigVideo = {
	guid: string;
	embedUrl: string;
	title: string;
};

type PlaylistConfig = {
	videos: PlaylistConfigVideo[];
	autoplayNext: boolean;
};

/**
 * Return the embed URL with autoplay switched on, so swapping a track starts
 * playback immediately instead of waiting for another click.
 *
 * @param {string} embedUrl - The server-rendered embed URL.
 * @return {string} The embed URL with autoPlay=1.
 */
function withAutoplay( embedUrl: string ): string {
	try {
		const url = new URL( embedUrl );
		url.searchParams.set( 'autoPlay', '1' );
		return url.toString();
	} catch {
		return embedUrl;
	}
}

/**
 * Wire up a single playlist block instance: track-list clicks swap the main
 * player, and (when enabled) the sanctioned `videopress_ended` player event
 * advances to the next track.
 *
 * @param {HTMLElement} blockElement - The block wrapper element.
 * @return {void}
 */
function initPlaylistBlock( blockElement: HTMLElement ): void {
	/*
	 * Pick the JSON config emitted by the server render. If it fails to
	 * parse, leave the block as a static list; the main player still works.
	 */
	const configElement = blockElement.querySelector( 'script.wp-block-videopress-playlist__config' );
	if ( ! configElement ) {
		return;
	}

	let config: PlaylistConfig;

	try {
		config = JSON.parse( configElement.textContent || '' );
	} catch ( error ) {
		console.error( error ); // eslint-disable-line no-console
		return;
	}

	// Clean the config element. It isn't needed anymore.
	configElement.remove();

	if ( ! config || ! Array.isArray( config.videos ) || config.videos.length === 0 ) {
		return;
	}

	const initialIframe = blockElement.querySelector< HTMLIFrameElement >(
		'.wp-block-videopress-playlist__player iframe'
	);
	if ( ! initialIframe ) {
		return;
	}
	let iframe = initialIframe;

	/*
	 * The track buttons are rendered from the same ordered array as the
	 * config videos (Playlist_Block::render), so indexes line up 1:1.
	 */
	const buttons = Array.from(
		blockElement.querySelectorAll< HTMLButtonElement >(
			'.wp-block-videopress-playlist__item-button'
		)
	);

	let activeIndex = 0;

	const activate = ( index: number ) => {
		const video = config.videos[ index ];
		if ( ! video ) {
			return;
		}
		activeIndex = index;

		/*
		 * Swap in a fresh iframe node instead of assigning src on the current
		 * one: navigating an existing iframe pushes a browser history entry
		 * per swap, hijacking the visitor's back button.
		 */
		const nextIframe = iframe.cloneNode( false ) as HTMLIFrameElement;
		nextIframe.src = withAutoplay( video.embedUrl );
		if ( video.title ) {
			nextIframe.title = video.title;
			nextIframe.setAttribute( 'aria-label', video.title );
		}
		iframe.replaceWith( nextIframe );
		iframe = nextIframe;

		buttons.forEach( ( button, buttonIndex ) => {
			if ( buttonIndex === index ) {
				button.setAttribute( 'aria-current', 'true' );
				// Keep the active row visible in long lists. Guarded because
				// jsdom (tests) does not implement scrollIntoView.
				if ( typeof button.scrollIntoView === 'function' ) {
					button.scrollIntoView( { block: 'nearest' } );
				}
			} else {
				button.removeAttribute( 'aria-current' );
			}
		} );
	};

	buttons.forEach( ( button, buttonIndex ) => {
		button.addEventListener( 'click', () => {
			activate( buttonIndex );
		} );
	} );

	if ( ! config.autoplayNext ) {
		return;
	}

	window.addEventListener( 'message', ( event: MessageEvent< { event?: string } > ) => {
		// Only trust playback events from the VideoPress player origins…
		if ( ! isAllowedOrigin( event.origin ) ) {
			return;
		}

		// …carrying the sanctioned ended event (player-bridge event list)…
		if ( event.data?.event !== 'videopress_ended' ) {
			return;
		}

		// …emitted by this block's main player, not some other embed on the page.
		if ( ! iframe.contentWindow || event.source !== iframe.contentWindow ) {
			return;
		}

		if ( activeIndex + 1 < config.videos.length ) {
			activate( activeIndex + 1 );
		}
	} );
}

/**
 * Wire up every playlist block instance on the page.
 *
 * Exported for tests; the page entry point is the domReady call below.
 *
 * @return {void}
 */
export function initPlaylistBlocks(): void {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-videopress-playlist' )
		.forEach( initPlaylistBlock );
}

domReady( function () {
	initPlaylistBlocks();
} );
