import { POST_DETAIL_TAB_IDS } from './tabs';
import type { PostDetailTabId } from './tabs';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

export type PostDetailTabLayouts = Partial< Record< PostDetailTabId, DashboardWidget[] > >;

const TAB_IDS = new Set< string >( POST_DETAIL_TAB_IDS );

/**
 * Check whether a value can be used as the persisted tab layout map.
 *
 * @param value - Candidate preference value.
 * @return Whether the value is a valid tab layout map.
 */
export function isPostDetailTabLayouts( value: unknown ): value is PostDetailTabLayouts {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	return Object.entries( value ).every(
		( [ tabId, layout ] ) => TAB_IDS.has( tabId ) && Array.isArray( layout )
	);
}
