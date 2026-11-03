/**
 * Tracks for the DIFM offer banner. The event names and props match the Calypso banners, so one
 * query covers every surface. These events carry only the offer's own props: the AI Launchpad
 * standard props and context in `lib/tracks.ts` describe the launchpad, not the offer.
 */

export const IMPRESSION_EVENT = 'calypso_banner_cta_impression';
export const CLICK_EVENT = 'calypso_banner_cta_click';
export const DISMISS_EVENT = 'calypso_banner_dismiss';

const UPSELL_ID = 'site-setup-difm-offer';

export interface DifmOfferTracksProps {
	upsell_id: string;
	upsell_feature_id: string;
	variation: string;
	// Calypso's Banner adds `cta_name` to impression, click and dismiss, and `cta_size` to impression
	// and click only. It passes no `feature` for this offer, so there is no `cta_feature`.
	cta_name: string;
	cta_size?: 'regular';
}

/**
 * The props every DIFM offer event on this page carries.
 *
 * @param variation - The user's experiment variation.
 * @return The base props.
 */
export function difmOfferTracksProps( variation: string ): DifmOfferTracksProps {
	return {
		upsell_id: UPSELL_ID,
		upsell_feature_id: 'difm-offer',
		variation,
		cta_name: UPSELL_ID,
		cta_size: 'regular',
	};
}

/**
 * The props for the dismiss event, which has no `cta_size`.
 *
 * @param props - The base props.
 * @return The dismiss props.
 */
export function difmOfferDismissProps( props: DifmOfferTracksProps ): DifmOfferTracksProps {
	const dismissProps = { ...props };
	delete dismissProps.cta_size;
	return dismissProps;
}

/**
 * Records a DIFM offer event through the Tracks queue.
 *
 * @param eventName - The event name.
 * @param props     - The event props.
 */
export function recordDifmOfferEvent(
	eventName: string,
	props: DifmOfferTracksProps & { selection_length?: number; use_beacon?: true }
): void {
	window._tkq = window._tkq || [];
	window._tkq.push( [ 'recordEvent', eventName, props ] );
}

/**
 * The preference key the Calypso surfaces share, so one dismissal hides the offer everywhere.
 * The server reads the same key in AI_Launchpad_Difm_Offer::DISMISSED_PREFERENCE.
 */
export const DISMISSED_PREFERENCE = 'hosting-dashboard-difm-offer-dismissed';

/**
 * The request that stores the dismissal.
 *
 * `global` keeps WordPress.com's wp-admin request bridge from scoping this user endpoint to the
 * site.
 *
 * @param now - The dismissal time.
 * @return The apiFetch options.
 */
export function dismissalRequest( now: Date ) {
	return {
		path: '/wpcom/v2/me/preferences',
		method: 'POST',
		global: true,
		data: { calypso_preferences: { [ DISMISSED_PREFERENCE ]: now.toISOString() } },
	};
}
