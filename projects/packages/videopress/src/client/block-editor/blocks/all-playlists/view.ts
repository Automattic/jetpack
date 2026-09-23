/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
/**
 * Internal dependencies
 */
import { fetchLiveMetadata } from '../playlist/fetch-live-metadata';
import './view.scss';

const ITEM_SELECTOR = '.videopress-all-playlists__item';

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

/**
 * Wire the "Load more" button: each click reveals the next page of cards and
 * refreshes the summary, until every playlist is shown.
 *
 * @param root - The block wrapper element.
 */
function initLoadMore( root: HTMLElement ) {
	const button = root.querySelector< HTMLButtonElement >(
		'.videopress-all-playlists__load-more-button'
	);
	if ( ! button ) {
		return;
	}

	const perPage = Math.max( 1, Number( root.dataset.perPage ) || 1 );
	const summaryTemplate = root.dataset.summary ?? '';
	const summary = root.querySelector< HTMLElement >( '.videopress-all-playlists__summary' );
	const labelTemplate = button.dataset.label ?? '';

	const update = () => {
		const items = Array.from( root.querySelectorAll< HTMLElement >( ITEM_SELECTOR ) );
		const shown = items.filter( item => ! item.hidden ).length;
		const remaining = items.length - shown;

		if ( summary && summaryTemplate ) {
			summary.textContent = summaryTemplate
				.replace( '%1$s', String( shown ) )
				.replace( '%2$s', String( items.length ) );
		}
		if ( remaining > 0 ) {
			button.textContent = labelTemplate.replace( '%s', String( Math.min( perPage, remaining ) ) );
		} else {
			button.parentElement?.remove();
		}
	};

	button.addEventListener( 'click', () => {
		const hidden = Array.from( root.querySelectorAll< HTMLElement >( ITEM_SELECTOR ) ).filter(
			item => item.hidden
		);
		const nextPage = hidden[ 0 ]?.dataset.page;
		hidden
			.filter( item => item.dataset.page === nextPage )
			.forEach( item => {
				item.hidden = false;
				hydratePoster( item );
			} );
		update();
	} );
}

/**
 * Initialize one All Playlists block: posters for the visible cards, and the
 * "Load more" button when the block paginates that way.
 *
 * @param root - The block wrapper element.
 */
export function initAllPlaylistsBlock( root: HTMLElement ) {
	root
		.querySelectorAll< HTMLElement >( ITEM_SELECTOR )
		.forEach( item => ! item.hidden && hydratePoster( item ) );
	initLoadMore( root );
}

/**
 * Initialize every All Playlists block on the page.
 */
export function initAllPlaylistsBlocks() {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-videopress-all-playlists' )
		.forEach( initAllPlaylistsBlock );
}

domReady( initAllPlaylistsBlocks );
