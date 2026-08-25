/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../lib/get-media-token';
import { isAllowedOrigin } from '../../../lib/videopress-allowed-origins';
import { withMetadataToken } from './utils';
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
 * The first lookup is anonymous. When it is denied — a private video — and the
 * page carries the token bridge configuration (enqueued whenever the block
 * renders), the lookup is retried with a playback token so authorized viewers
 * still get live metadata. 'locked' means the video is private and could not be
 * authorized for this viewer; null means the data is unreachable (network
 * failure, deleted video) and the entry just keeps its server-rendered
 * fallback.
 *
 * @param guid - The video GUID.
 * @return The metadata, 'locked', or null.
 */
async function fetchLiveMetadata( guid: string ): Promise< LiveVideoMetadata | 'locked' | null > {
	const endpoint = `https://public-api.wordpress.com/rest/v1.1/videos/${ encodeURIComponent(
		guid
	) }`;

	try {
		const response = await fetch( endpoint );
		if ( response.ok ) {
			return ( await response.json() ) as LiveVideoMetadata;
		}
		if ( response.status !== 401 && response.status !== 403 ) {
			return null;
		}
	} catch {
		// Network failure: a token retry would not fare better.
		return null;
	}

	if ( ! window.videopressAjax ) {
		return 'locked';
	}

	try {
		const postId = Number( window.videopressAjax.post_id ) || 0;
		const { token } = await getMediaToken( 'playback', { guid, id: postId } );
		if ( ! token ) {
			return 'locked';
		}

		const response = await fetch( `${ endpoint }?metadata_token=${ encodeURIComponent( token ) }` );
		if ( ! response.ok ) {
			return 'locked';
		}
		const metadata = ( await response.json() ) as LiveVideoMetadata;

		// The API returns the private poster's bare file URL, which the file host
		// refuses without a token — sign it with the same one.
		if ( typeof metadata.poster === 'string' && metadata.poster ) {
			return { ...metadata, poster: withMetadataToken( metadata.poster, token ) };
		}
		return metadata;
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
	const entries = Array.from(
		root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' )
	);

	return Promise.all(
		entries.map( async entry => {
			const guid = entry.dataset.guid;
			if ( ! guid ) {
				return;
			}

			const result = await fetchLiveMetadata( guid );
			if ( 'locked' === result ) {
				// Show the server-rendered lock placeholder in the thumbnail.
				entry.classList.add( 'is-locked' );
				return;
			}
			if ( ! result ) {
				return;
			}
			entry.classList.remove( 'is-locked' );
			const metadata = result;

			if ( typeof metadata.title === 'string' && metadata.title ) {
				entry.dataset.title = metadata.title;
				const titleElement = entry.querySelector( '.videopress-playlist__entry-title' );
				if ( titleElement ) {
					titleElement.textContent = metadata.title;
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

	/*
	 * While more entries hide beyond the scroll position — below it in the
	 * capped side rail, past its trailing edge in the horizontal strip — the
	 * list carries a class that shows the matching fade.
	 */
	const list = root.querySelector< HTMLElement >( '.videopress-playlist__list' );
	const entriesContainer = root.querySelector< HTMLElement >( '.videopress-playlist__entries' );
	const updateScrollHint = () => {
		if ( ! list || ! entriesContainer ) {
			return;
		}
		const moreBelow =
			entriesContainer.scrollHeight - entriesContainer.scrollTop - entriesContainer.clientHeight >
			1;
		// scrollLeft is negative in right-to-left scrollers.
		const moreInline =
			entriesContainer.scrollWidth -
				Math.abs( entriesContainer.scrollLeft ) -
				entriesContainer.clientWidth >
			1;
		list.classList.toggle( 'has-more-videos', moreBelow || moreInline );
	};
	entriesContainer?.addEventListener( 'scroll', updateScrollHint, { passive: true } );
	updateScrollHint();

	// Fire-and-forget: the list is usable with the server-rendered fallbacks
	// while (or if) the live metadata lookups are still pending. Hydrated
	// posters can change entry heights, so refresh the scroll hint after.
	hydratePlaylistMetadata( root ).then( updateScrollHint );

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
		} else if ( root.dataset.loop === '1' ) {
			activate( 0, true );
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
