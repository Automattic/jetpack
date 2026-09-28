/**
 * Tracks events for the links on a Marketplace card, keyed by their `data-wpcom-marketplace-track`.
 */
const CLICK_EVENTS = new Map( [
	[ 'details', 'wpcom_marketplace_tab_details_click' ],
	[ 'get_started', 'wpcom_marketplace_tab_get_started_click' ],
	[ 'purchase', 'wpcom_marketplace_tab_purchase_click' ],
] );

export const VIEW_EVENT = 'wpcom_marketplace_tab_view';

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
