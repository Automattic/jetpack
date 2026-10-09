/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_7_DAYS,
	PRESET_MONTH_TO_DATE,
	PRESET_TODAY,
	PRESET_YEAR_TO_DATE,
	isSelectablePreset,
} from '@jetpack-premium-analytics/datetime';
import { dispatch, select } from '@wordpress/data';
import type { PresetType } from '../utils/search';

/** Preferences scope the dashboard stores its settings under; the server mirrors it. */
export const DASHBOARD_PREFERENCES_SCOPE = 'jetpack-premium-analytics/dashboard';

const DATE_PRESET_KEY = 'datePreset';

// By name: importing `@wordpress/preferences` would pull its UI into every consumer of this package.
const PREFERENCES_STORE = 'core/preferences';

// wp-calypso's date-range shortcut IDs. v2 has no three-year window, so that one takes the longest it has.
const STATS_V1_SHORTCUTS = new Map< string, PresetType >( [
	[ 'today', PRESET_TODAY ],
	[ 'last_7_days', PRESET_LAST_7_DAYS ],
	[ 'last_30_days', PRESET_LAST_30_DAYS ],
	[ 'month_to_date', PRESET_MONTH_TO_DATE ],
	[ 'year_to_date', PRESET_YEAR_TO_DATE ],
	[ 'last_12_months', PRESET_LAST_12_MONTHS ],
	[ 'last_3_years', PRESET_LAST_12_MONTHS ],
] );

type PreferencesSelectors = { get: ( scope: string, name: string ) => unknown };
type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

/**
 * The preset the reader last applied in the dashboard header.
 */
export function getRememberedPreset(): PresetType | undefined {
	const preferences = select( PREFERENCES_STORE ) as unknown as PreferencesSelectors | undefined;
	const value = preferences?.get( DASHBOARD_PREFERENCES_SCOPE, DATE_PRESET_KEY );

	return isSelectablePreset( value ) ? value : undefined;
}

/**
 * Remember a preset the reader applied, so the next visit without dates opens on it.
 *
 * @param preset - The applied preset.
 */
export function rememberPreset( preset: PresetType ): void {
	// Every set saves the reader's preferences to the server.
	if ( getRememberedPreset() === preset ) {
		return;
	}

	( dispatch( PREFERENCES_STORE ) as PreferencesActions | undefined )?.set(
		DASHBOARD_PREFERENCES_SCOPE,
		DATE_PRESET_KEY,
		preset
	);
}

/**
 * The range the reader last applied in Jetpack Stats v1 in this browser.
 * Only readable where v1 and this dashboard share an origin.
 */
export function getStatsV1Preset(): PresetType | undefined {
	const blogId = getScriptData()?.site?.wpcom?.blog_id;

	try {
		const siteShortcutId = blogId
			? window.localStorage.getItem( `jetpack_stats_stored_date_range_shortcut_id_${ blogId }` )
			: null;
		// v1 still reads its key from before it was per site.
		const shortcutId =
			siteShortcutId ||
			window.localStorage.getItem( 'jetpack_stats_stored_date_range_shortcut_id' );

		return shortcutId ? STATS_V1_SHORTCUTS.get( shortcutId ) : undefined;
	} catch {
		return undefined;
	}
}
