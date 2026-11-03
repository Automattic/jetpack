/**
 * Remembers which top tab the user last chose, so the dashboard reopens on it.
 *
 * A cookie rather than `localStorage` so tabs remembered before the root route existed still apply.
 */

import { isTopTab, type TopTab } from './top-tabs.ts';

export const LAST_TAB_COOKIE = 'jetpack_forms_last_tab';

const ONE_YEAR_IN_SECONDS = 31536000;

/**
 * Stores the tab the user just chose.
 *
 * @param tab - The tab to reopen the dashboard on.
 */
export function saveLastTab( tab: TopTab ): void {
	// `/wp-admin/admin.php` -> `/wp-admin/`: narrow enough to keep the cookie off every
	// front-end request.
	const path = window.location.pathname.replace( /[^/]*$/, '' );
	const secure = window.location.protocol === 'https:' ? '; Secure' : '';

	document.cookie = `${ LAST_TAB_COOKIE }=${ tab }; path=${ path }; max-age=${ ONE_YEAR_IN_SECONDS }; SameSite=Lax${ secure }`;
}

/**
 * Reads the tab the user last chose.
 *
 * @return The remembered tab, or null when none is stored or the value is unrecognised.
 */
export function getLastTab(): TopTab | null {
	const value = document.cookie
		.split( '; ' )
		.find( pair => pair.startsWith( `${ LAST_TAB_COOKIE }=` ) )
		?.slice( LAST_TAB_COOKIE.length + 1 );

	return isTopTab( value ) ? value : null;
}
