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
 * Validate an embed URL and switch autoplay on, so swapping a track starts
 * playback immediately instead of waiting for another click.
 *
 * The server only ever emits videopress.com embed URLs (get_embed_url), but
 * the JSON config travels through the DOM, which is a trust boundary:
 * anything able to inject markup ahead of this script could plant a
 * `javascript:` URL that assigning to iframe.src would execute. The same
 * allowlist that gates the player's postMessage events gates where the
 * iframe may go, and only the re-serialized parse ever reaches the sink —
 * an unparseable or off-origin URL yields null, never a raw passthrough.
 *
 * @param {string} embedUrl - The embed URL from the block config.
 * @return {string|null} The trusted embed URL with autoPlay=1, or null.
 */
function trustedAutoplayEmbedUrl( embedUrl: string ): string | null {
	let url: URL;
	try {
		url = new URL( embedUrl );
	} catch {
		return null;
	}
	if ( ! isAllowedOrigin( url.origin ) ) {
		return null;
	}
	url.searchParams.set( 'autoPlay', '1' );
	return url.toString();
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
		// The untrusted-URL skip guards the sink below, and deliberately does
		// NOT filter config.videos up front: track buttons line up with the
		// videos array by index, so dropping entries would swap the wrong
		// tracks for every video after the dropped one.
		const embedUrl = trustedAutoplayEmbedUrl( video.embedUrl );
		if ( embedUrl === null ) {
			return;
		}
		activeIndex = index;

		/*
		 * Swap in a fresh iframe node instead of assigning src on the current
		 * one: navigating an existing iframe pushes a browser history entry
		 * per swap, hijacking the visitor's back button.
		 */
		const nextIframe = iframe.cloneNode( false ) as HTMLIFrameElement;
		nextIframe.src = embedUrl;
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
