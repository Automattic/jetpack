const PURCHASE_EVENT = 'wpcom_marketplace_tab_theme_purchase_click';
const PRICING_EVENT = 'wpcom_marketplace_tab_theme_pricing_filter';

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
				source: 'tab' | 'search';
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
			source: dataset.source === 'search' ? 'search' : 'tab',
		},
	];
}

/**
 * Records each click on a purchase link the Marketplace tab offers, and each change of its pricing filter.
 *
 * @param doc   - The Add Themes page.
 * @param track - Records one Tracks event.
 */
export function trackThemesTab( doc: Document, track: Track ) {
	const onClick = ( event: MouseEvent ) => {
		// A middle-click opens checkout in a new tab and fires only auxclick; skip right-clicks.
		if ( event.type === 'auxclick' && event.button !== 1 ) {
			return;
		}

		const link = ( event.target as Element ).closest< HTMLElement >( 'a[data-wpcom-themes-track]' );
		const tracked = link ? clickEvent( link.dataset ) : null;

		if ( tracked ) {
			track( ...tracked );
		}
	};

	// On the document, as the links are created as cards render; capturing, so no handler can stop it.
	doc.addEventListener( 'click', onClick, true );
	doc.addEventListener( 'auxclick', onClick, true );

	doc.addEventListener(
		'change',
		( event: Event ) => {
			const select = event.target as HTMLSelectElement;

			if ( select.dataset?.wpcomThemesPricing !== undefined ) {
				track( PRICING_EVENT, { pricing: select.value } );
			}
		},
		true
	);
}
