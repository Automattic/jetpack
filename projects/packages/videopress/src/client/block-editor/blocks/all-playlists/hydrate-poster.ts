/**
 * Internal dependencies
 */
import { fetchLiveMetadata } from '../playlist/fetch-live-metadata';

/**
 * Resolve a card's poster from its first video's live data. A private or
 * deleted video leaves the card in the "no poster" state.
 *
 * @param item - The card element.
 * @return Promise resolving once the card is settled.
 */
export async function hydratePoster( item: HTMLElement ): Promise< void > {
	const guid = item.querySelector< HTMLElement >( '[data-guid]' )?.dataset.guid;
	const image = item.querySelector< HTMLImageElement >( '.videopress-all-playlists__poster-image' );
	if ( ! guid || ! image || ! item.classList.contains( 'is-poster-loading' ) ) {
		return;
	}

	const result = await fetchLiveMetadata( guid );
	const poster = result && result !== 'locked' ? result.poster : undefined;

	item.classList.remove( 'is-poster-loading' );
	if ( typeof poster === 'string' && poster ) {
		image.src = poster;
		image.hidden = false;
	} else {
		item.classList.add( 'is-poster-missing' );
	}
}
