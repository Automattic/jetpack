/**
 * External dependencies
 */
import type { Promo } from '@jetpack-premium-analytics/data';

/**
 * What the card frame hands a promo's render module.
 */
export type PromoRenderProps = {
	promo: Promo;

	/** Present when the promo is dismissible. The frame already draws the close control. */
	onDismiss?: () => void;

	/** Records a click on one of the module's own links; the label tells them apart. */
	trackClick: ( label: string ) => void;
};
