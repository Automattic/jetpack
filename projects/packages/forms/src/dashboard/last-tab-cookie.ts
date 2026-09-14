/**
 * Remembers which top tab the user last chose, so the dashboard reopens on it.
 */

export const LAST_TAB_COOKIE = 'jetpack_forms_last_tab';

const ONE_YEAR_IN_SECONDS = 31536000;

export type TopTab = 'forms' | 'responses';

/**
 * Stores the tab the user just chose.
 *
 * @param tab - The tab to reopen the dashboard on.
 */
export function saveLastTab( tab: TopTab ): void {
	// `/wp-admin/admin.php` -> `/wp-admin/`, which is both where the redirect that reads
	// this lives and narrow enough to keep the cookie off every front-end request.
	const path = window.location.pathname.replace( /[^/]*$/, '' );
	const secure = window.location.protocol === 'https:' ? '; Secure' : '';

	document.cookie = `${ LAST_TAB_COOKIE }=${ tab }; path=${ path }; max-age=${ ONE_YEAR_IN_SECONDS }; SameSite=Lax${ secure }`;
}
