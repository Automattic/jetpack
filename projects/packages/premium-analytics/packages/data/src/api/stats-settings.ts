/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const STATS_SETTINGS_PATH = '/jetpack/v4/stats/settings';

export type StatsSettings = {
	admin_bar: boolean;
	roles: string[];
	count_roles: string[];
	wpcom_reader_views_enabled: boolean;
};

export type StatsSettingsResponse = {
	settings: StatsSettings;
	roles: Array< { slug: string; name: string } >;
	/** The screen that switches the Stats module on and off, when the site has one. */
	modules_url: string | null;
};

/**
 * Read the Stats settings and the site's roles from the site itself, not through the WordPress.com proxy.
 *
 * @return The settings and the roles the screen lists.
 */
export function fetchStatsSettings(): Promise< StatsSettingsResponse > {
	return apiFetch< StatsSettingsResponse >( { path: STATS_SETTINGS_PATH } );
}

/**
 * Save some Stats settings.
 *
 * @param values - The settings to change.
 * @return The settings after the save.
 */
export function saveStatsSettings(
	values: Partial< StatsSettings >
): Promise< StatsSettingsResponse > {
	return apiFetch< StatsSettingsResponse >( {
		path: STATS_SETTINGS_PATH,
		method: 'POST',
		data: values,
	} );
}
