/**
 * Tracks events for the links on a Marketplace card, keyed by their `data-wpcom-marketplace-track`.
 */
const CLICK_EVENTS = new Map( [
	[ 'details', 'wpcom_marketplace_tab_details_click' ],
	[ 'get_started', 'wpcom_marketplace_tab_get_started_click' ],
	[ 'purchase', 'wpcom_marketplace_tab_purchase_click' ],
] );

const VIEW_EVENT = 'wpcom_marketplace_tab_view';

type Track = ( name: string, props: Record< string, unknown > ) => void;

/**
 * The event a click on a card's link records, with the props Calypso sends for the same click.
 *
 * @param action      - The link's `data-wpcom-marketplace-track` value.
 * @param card        - The card's dataset.
 * @param card.plugin - Marketplace product slug.
 * @param card.saas   - 'true' for a product sold by the vendor.
 * @return Event name and props, or null when the click is not one we track.
 */
export function clickEvent(
	action: string | undefined,
	card: { plugin?: string; saas?: string }
): [ string, { plugin: string; is_saas_product: boolean } ] | null {
	const name = action ? CLICK_EVENTS.get( action ) : undefined;

	if ( ! name || ! card.plugin ) {
		return null;
	}

	return [ name, { plugin: card.plugin, is_saas_product: card.saas === 'true' } ];
}

/**
 * Records the tab's view, then each tracked click on its cards.
 *
 * @param doc   - The Add Plugins page.
 * @param track - Records one Tracks event.
 */
export function trackMarketplaceTab( doc: Document, track: Track ) {
	const grid = doc.querySelector< HTMLElement >( '.wpcom-marketplace-grid' );

	track( VIEW_EVENT, {
		plugin_count: grid?.querySelectorAll( '.wpcom-marketplace-card' ).length ?? 0,
	} );

	// On the grid, not the document: plugin-install.js stops a Details click at .wrap.
	grid?.addEventListener( 'click', event => {
		const link = ( event.target as Element ).closest< HTMLElement >(
			'a[data-wpcom-marketplace-track]'
		);
		const card = link?.closest< HTMLElement >( '.wpcom-marketplace-card' );
		const tracked =
			link && card ? clickEvent( link.dataset.wpcomMarketplaceTrack, card.dataset ) : null;

		if ( tracked ) {
			track( ...tracked );
		}
	} );
}
