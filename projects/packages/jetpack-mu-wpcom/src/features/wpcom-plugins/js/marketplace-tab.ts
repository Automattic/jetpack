import { wpcomTrackEvent } from '../../../common/tracks';
import { VIEW_EVENT, clickEvent } from './marketplace-tab-events.ts';

/**
 * Records the Marketplace tab's view, then each tracked click on its cards.
 */
function wpcomMarketplaceTabTracks() {
	const grid = document.querySelector< HTMLElement >( '.wpcom-marketplace-grid' );

	wpcomTrackEvent( VIEW_EVENT, {
		plugin_count: grid?.querySelectorAll( '.wpcom-marketplace-card' ).length ?? 0,
	} );

	// Listens on the grid so it runs before thickbox and updates.js, which delegate from further up.
	grid?.addEventListener( 'click', event => {
		const link = ( event.target as Element ).closest< HTMLElement >(
			'a[data-wpcom-marketplace-track]'
		);
		const card = link?.closest< HTMLElement >( '.wpcom-marketplace-card' );
		const tracked =
			link && card ? clickEvent( link.dataset.wpcomMarketplaceTrack, card.dataset ) : null;

		if ( tracked ) {
			wpcomTrackEvent( ...tracked );
		}
	} );
}

document.addEventListener( 'DOMContentLoaded', wpcomMarketplaceTabTracks );
