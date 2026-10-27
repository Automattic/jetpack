/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Action } from '@jetpack-premium-analytics/externals';

export const VIEW_LIVE_ACTION_ID = 'view-live';

/**
 * A report table's row action that opens the row's live post, page, video or
 * email in a new tab, as every row in classic Stats offered. DataViews draws a
 * primary action beside the row when it is hovered or focused, and in the row
 * menu on narrow viewports.
 *
 * @param getUrl - The URL `toViewLiveUrl()` resolved for the row, or undefined for a row that gets no action.
 * @return The action.
 */
export function createViewLiveAction< Item >(
	getUrl: ( item: Item ) => string | undefined
): Action< Item > {
	return {
		id: VIEW_LIVE_ACTION_ID,
		label: __( 'View in new tab', 'jetpack-premium-analytics-pkg' ),
		isPrimary: true,
		isEligible: item => getUrl( item ) !== undefined,
		callback: ( [ item ] ) => {
			const url = getUrl( item );

			if ( url ) {
				window.open( url, '_blank', 'noopener,noreferrer' );
			}
		},
	};
}
