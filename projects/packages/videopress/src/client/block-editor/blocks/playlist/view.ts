/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import { isAllowedOrigin } from '../../../lib/videopress-allowed-origins';
import './view.scss';

type PlayerEventMessage = {
	event?: string;
	id?: string;
};

/**
 * Wire up one Video Playlist block on the front end.
 *
 * Clicking an entry loads its video into the player; when "Autoplay next"
 * is on, a `videopress_ended` message from the player advances to the
 * following entry. All entry text (titles, meta lines, counters) is
 * server-rendered — this script only moves it around.
 *
 * @param root - The block wrapper element.
 */
export function initPlaylistBlock( root: HTMLElement ) {
	const player = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
	const entries = Array.from(
		root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' )
	);

	if ( ! player || ! entries.length ) {
		return;
	}

	const nowTitle = root.querySelector( '.videopress-playlist__now-title' );
	const nowPosition = root.querySelector( '.videopress-playlist__now-position' );
	const nowDetails = root.querySelector( '.videopress-playlist__now-details' );
	const listProgress = root.querySelector( '.videopress-playlist__list-progress' );

	let currentIndex = Math.max(
		0,
		entries.findIndex( entry => entry.classList.contains( 'is-current' ) )
	);

	const activate = ( index: number, autoplay: boolean ) => {
		const entry = entries[ index ];
		if ( ! entry || ! entry.dataset.embedUrl ) {
			return;
		}

		currentIndex = index;
		player.src = autoplay
			? entry.dataset.embedUrl
			: entry.dataset.embedUrl.replace( 'autoPlay=1', 'autoPlay=0' );

		entries.forEach( ( other, i ) => {
			other.classList.toggle( 'is-current', i === index );
			if ( i === index ) {
				other.setAttribute( 'aria-current', 'true' );
			} else {
				other.removeAttribute( 'aria-current' );
			}
		} );

		if ( nowTitle ) {
			nowTitle.textContent = entry.dataset.title ?? '';
		}
		if ( nowPosition && entry.dataset.position ) {
			nowPosition.textContent = entry.dataset.position;
		}
		if ( nowDetails ) {
			nowDetails.textContent = entry.dataset.details ?? '';
		}
		if ( listProgress && entry.dataset.progress ) {
			listProgress.textContent = entry.dataset.progress;
		}
	};

	entries.forEach( ( entry, index ) => {
		entry.addEventListener( 'click', () => activate( index, true ) );
	} );

	if ( root.dataset.autoplayNext !== '1' ) {
		return;
	}

	window.addEventListener( 'message', ( event: MessageEvent< PlayerEventMessage > ) => {
		if ( ! isAllowedOrigin( event.origin ) ) {
			return;
		}

		const { event: eventName, id } = event.data || {};

		// React only to the end of the video this playlist is showing.
		if (
			eventName !== 'videopress_ended' ||
			! id ||
			id !== entries[ currentIndex ]?.dataset.guid
		) {
			return;
		}

		if ( currentIndex + 1 < entries.length ) {
			activate( currentIndex + 1, true );
		}
	} );
}

/**
 * Initialize every Video Playlist block on the page.
 */
export function initAllPlaylistBlocks() {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-videopress-playlist' )
		.forEach( initPlaylistBlock );
}

domReady( initAllPlaylistBlocks );
