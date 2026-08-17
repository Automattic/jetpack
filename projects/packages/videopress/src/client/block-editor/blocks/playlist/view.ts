/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import { isAllowedOrigin } from '../../../lib/videopress-allowed-origins';
import { formatDuration, formatRuntimeLong, qualityLabel } from './utils';
import './view.scss';

export { formatDuration, formatRuntimeLong, qualityLabel };

type PlayerMessage = {
	event?: string;
	id?: string;
};

type VideoMetadata = {
	title?: string;
	duration?: number;
	height?: number;
	poster?: string;
};

/**
 * Refresh a playlist's item metadata (title, thumbnail, duration, quality)
 * from the VideoPress API, so the list always reflects the videos' current
 * data, and update the header's total runtime.
 *
 * Lookups are anonymous: private videos (or API failures) keep their
 * server-rendered fields and simply get no duration/quality badge.
 *
 * @param block - The playlist block wrapper element.
 * @return Promise resolving once every item has been processed.
 */
export function refreshPlaylistMetadata( block: HTMLElement ): Promise< void > {
	const items = Array.from(
		block.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__item' )
	);

	return Promise.all(
		items.map( async item => {
			const guid = item.dataset.guid;
			if ( ! guid ) {
				return;
			}

			let metadata: VideoMetadata;
			try {
				const response = await fetch(
					`https://public-api.wordpress.com/rest/v1.1/videos/${ encodeURIComponent( guid ) }`
				);
				if ( ! response.ok ) {
					return;
				}
				metadata = await response.json();
			} catch {
				return;
			}

			if ( metadata?.title ) {
				const titleElement = item.querySelector( '.videopress-playlist__item-title' );
				if ( titleElement ) {
					titleElement.textContent = metadata.title;
				}
			}

			if ( Number.isFinite( metadata?.duration ) && metadata.duration > 0 ) {
				item.dataset.durationMs = String( metadata.duration );
			}

			const durationElement = item.querySelector( '.videopress-playlist__item-duration' );
			if ( durationElement ) {
				durationElement.textContent = formatDuration( metadata?.duration );
			}

			const thumbDurationElement = item.querySelector(
				'.videopress-playlist__item-thumb-duration'
			);
			if ( thumbDurationElement ) {
				thumbDurationElement.textContent = formatDuration( metadata?.duration );
			}

			const badgeElement = item.querySelector( '.videopress-playlist__item-badge' );
			if ( badgeElement ) {
				badgeElement.textContent = qualityLabel( metadata?.height );
			}

			const thumbElement = item.querySelector( '.videopress-playlist__item-thumb' );
			if ( thumbElement && metadata?.poster ) {
				let image = thumbElement.querySelector( 'img' );
				if ( ! image ) {
					image = document.createElement( 'img' );
					image.alt = '';
					image.loading = 'lazy';
					thumbElement.prepend( image );
				}
				if ( image.src !== metadata.poster ) {
					image.src = metadata.poster;
				}
			}
		} )
	).then( () => {
		// Recompute the header's total runtime from the freshest durations.
		const runtimeElement = block.querySelector( '.videopress-playlist__runtime' );
		if ( ! runtimeElement ) {
			return;
		}

		const total = items.reduce( ( sum, item ) => {
			const durationMs = Number( item.dataset.durationMs );
			return Number.isFinite( durationMs ) && durationMs > 0 ? sum + durationMs : sum;
		}, 0 );

		const runtime = formatRuntimeLong( total );
		if ( runtime ) {
			runtimeElement.textContent = runtime;
		}
	} );
}

/**
 * Wire up a single playlist block: item clicks swap the player iframe,
 * and `videopress_ended` messages from the player advance the playlist.
 *
 * @param block - The playlist block wrapper element.
 */
export function initPlaylist( block: HTMLElement ) {
	const player = block.querySelector< HTMLIFrameElement >( '.videopress-playlist__player' );
	const items = Array.from(
		block.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__item' )
	);

	if ( ! player || ! items.length ) {
		return;
	}

	// Fire-and-forget: the list stays usable with the server-rendered labels
	// while (or if) the metadata lookups are still pending.
	refreshPlaylistMetadata( block );

	const autoAdvance = block.dataset.autoAdvance === '1';
	const loop = block.dataset.loop === '1';
	let currentIndex = items.findIndex( item => item.dataset.guid === player.dataset.guid );

	if ( currentIndex === -1 ) {
		currentIndex = 0;
	}

	const setCurrent = ( index: number ) => {
		const item = items[ index ];
		if ( ! item || ! item.dataset.src ) {
			return;
		}

		currentIndex = index;
		player.src = item.dataset.src;
		player.dataset.guid = item.dataset.guid;

		items.forEach( ( entry, i ) => {
			entry.classList.toggle( 'is-current', i === index );
			entry.setAttribute( 'aria-current', i === index ? 'true' : 'false' );
		} );
	};

	items.forEach( ( item, index ) => {
		item.addEventListener( 'click', () => setCurrent( index ) );
	} );

	if ( ! autoAdvance ) {
		return;
	}

	window.addEventListener( 'message', ( event: MessageEvent< PlayerMessage > ) => {
		if ( ! isAllowedOrigin( event.origin ) ) {
			return;
		}

		const { event: eventName, id } = event.data || {};
		if ( eventName !== 'videopress_ended' || ! id ) {
			return;
		}

		// Only react to the video currently loaded in this playlist's player.
		if ( id !== items[ currentIndex ]?.dataset.guid ) {
			return;
		}

		const nextIndex = currentIndex + 1;
		if ( nextIndex < items.length ) {
			setCurrent( nextIndex );
		} else if ( loop ) {
			setCurrent( 0 );
		}
	} );
}

/**
 * Initialize every playlist block on the page.
 */
export function initAllPlaylists() {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-videopress-playlist' )
		.forEach( initPlaylist );
}

domReady( initAllPlaylists );
