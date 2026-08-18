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

type LiveVideoMetadata = {
	title?: string;
	poster?: string;
};

/**
 * Fetch a video's live display metadata from the public videos API.
 *
 * Lookups are anonymous: private videos (and API failures) return null and
 * the entry keeps its server-rendered fallback.
 *
 * @param guid - The video GUID.
 * @return The metadata, or null when it can't be read.
 */
async function fetchLiveMetadata( guid: string ): Promise< LiveVideoMetadata | null > {
	try {
		const response = await fetch(
			`https://public-api.wordpress.com/rest/v1.1/videos/${ encodeURIComponent( guid ) }`
		);
		if ( ! response.ok ) {
			return null;
		}
		return ( await response.json() ) as LiveVideoMetadata;
	} catch {
		return null;
	}
}

/**
 * Replace the server-rendered fallbacks with live video data: each entry's
 * title and poster (and the now-playing title) always reflect the videos'
 * current metadata rather than anything stored with the block.
 *
 * @param root - The block wrapper element.
 * @return Promise resolving once every entry has been processed.
 */
export function hydratePlaylistMetadata( root: HTMLElement ): Promise< void[] > {
	const nowTitle = root.querySelector( '.videopress-playlist__now-title' );
	const entries = Array.from(
		root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' )
	);

	return Promise.all(
		entries.map( async entry => {
			const guid = entry.dataset.guid;
			if ( ! guid ) {
				return;
			}

			const metadata = await fetchLiveMetadata( guid );
			if ( ! metadata ) {
				return;
			}

			if ( typeof metadata.title === 'string' && metadata.title ) {
				entry.dataset.title = metadata.title;
				const titleElement = entry.querySelector( '.videopress-playlist__entry-title' );
				if ( titleElement ) {
					titleElement.textContent = metadata.title;
				}
				if ( nowTitle && entry.classList.contains( 'is-current' ) ) {
					nowTitle.textContent = metadata.title;
				}
			}

			if ( typeof metadata.poster === 'string' && metadata.poster ) {
				const thumb = entry.querySelector( '.videopress-playlist__entry-thumb' );
				if ( thumb ) {
					let image = thumb.querySelector( 'img' );
					if ( ! image ) {
						image = document.createElement( 'img' );
						image.alt = '';
						image.loading = 'lazy';
						thumb.prepend( image );
					}
					if ( image.src !== metadata.poster ) {
						image.src = metadata.poster;
					}
				}
			}
		} )
	);
}

/**
 * Wire up one Video Playlist block on the front end.
 *
 * Clicking an entry loads its video into the player; when "Autoplay next"
 * is on, a `videopress_ended` message from the player advances to the
 * following entry. Titles and posters are hydrated from live video data;
 * the numeric meta lines and counters are server-rendered.
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

	// Fire-and-forget: the list is usable with the server-rendered fallbacks
	// while (or if) the live metadata lookups are still pending.
	hydratePlaylistMetadata( root );

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
