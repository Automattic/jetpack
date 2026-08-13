/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import { isAllowedOrigin } from '../../../lib/videopress-allowed-origins';
import './view.scss';

type PlayerMessage = {
	event?: string;
	id?: string;
};

/**
 * Wire up a single playlist block: item clicks swap the player iframe,
 * and `videopress_ended` messages from the player advance the playlist.
 *
 * @param block - The playlist block wrapper element.
 */
function initPlaylist( block: HTMLElement ) {
	const player = block.querySelector< HTMLIFrameElement >( '.videopress-playlist__player' );
	const items = Array.from(
		block.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__item' )
	);

	if ( ! player || ! items.length ) {
		return;
	}

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

domReady( () => {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-videopress-playlist' )
		.forEach( initPlaylist );
} );
