const PURCHASE_EVENT = 'wpcom_marketplace_tab_theme_purchase_click';

type Track = ( name: string, props: Record< string, unknown > ) => void;

/**
 * The event a click on a theme's purchase link records.
 *
 * @param dataset - The link's dataset, set by `offerPurchase()` in themes-tab.js.
 * @return Event name and props, or null when the click is not one we track.
 */
export function clickEvent( dataset: DOMStringMap ):
	| [
			'wpcom_marketplace_tab_theme_purchase_click',
			{
				theme: string;
				theme_tier: string;
				action: 'upgrade' | 'subscribe';
				required_plan: string;
				context: 'card' | 'preview';
			},
	  ]
	| null {
	const action = dataset.wpcomThemesTrack;

	if ( ( action !== 'upgrade' && action !== 'subscribe' ) || ! dataset.theme ) {
		return null;
	}

	return [
		PURCHASE_EVENT,
		{
			theme: dataset.theme,
			theme_tier: dataset.themeTier ?? '',
			action,
			required_plan: dataset.requiredPlan ?? '',
			context: dataset.context === 'preview' ? 'preview' : 'card',
		},
	];
}

/**
 * Records each click on a purchase link the Marketplace tab offers.
 *
 * @param doc   - The Add Themes page.
 * @param track - Records one Tracks event.
 */
export function trackThemesTab( doc: Document, track: Track ) {
	// On the document: the links are created as cards render, long after this runs.
	doc.addEventListener( 'click', event => {
		const link = ( event.target as Element ).closest< HTMLElement >( 'a[data-wpcom-themes-track]' );
		const tracked = link ? clickEvent( link.dataset ) : null;

		if ( tracked ) {
			track( ...tracked );
		}
	} );
}
