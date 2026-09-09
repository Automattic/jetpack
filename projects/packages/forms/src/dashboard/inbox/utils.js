// Function to get the URL of the page or post where the form was submitted.
export const getPath = item => {
	try {
		const url = new URL( item.entry_permalink );
		return url.pathname;
	} catch {
		return '';
	}
};

/**
 * The Forms wp-admin submenu badge slug, duplicated from PHP
 * `Dashboard::FORMS_WPBUILD_ADMIN_SLUG`. Keep the two in step: see
 * getFormsMenuBadgeSlug() below for what drift costs.
 */
const FORMS_MENU_BADGE_SELECTOR = '[data-jp-menu-badge="jetpack-forms-responses-wp-admin"]';

/**
 * Fallback slug to use when no Forms menu badge is present in the DOM
 * (e.g. the count is already 0, or the badge simply hasn't rendered yet).
 */
const DEFAULT_FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

/**
 * Read the current Forms submenu badge count from the DOM, so callers can
 * compute an optimistic delta (e.g. -1 on mark-as-read) without waiting for
 * the authoritative server count.
 *
 * @return {number} The current badge count, or 0 if the badge isn't rendered (e.g. the count is already 0).
 */
export const getMenuBadgeCount = () => {
	const badge = document.querySelector( FORMS_MENU_BADGE_SELECTOR );
	if ( ! badge ) {
		return 0;
	}
	return parseInt( badge.getAttribute( 'data-jp-menu-count' ), 10 ) || 0;
};

/**
 * Resolve the Forms wp-admin submenu badge slug off the rendered
 * `data-jp-menu-badge` attribute.
 *
 * Constant in practice: selector and fallback are the same literal, so if the PHP slug
 * changed this returns the stale one and `setCount()` no-ops against nothing. Reading the
 * attribute does not catch that -- only keeping the literal in step with PHP does.
 *
 * @return {string} The Forms menu badge slug.
 */
export const getFormsMenuBadgeSlug = () => {
	const badge = document.querySelector( FORMS_MENU_BADGE_SELECTOR );
	return badge?.getAttribute( 'data-jp-menu-badge' ) ?? DEFAULT_FORMS_MENU_BADGE_SLUG;
};

/**
 * Get the ID of an item.
 *
 * @param {object} item - The item to get the ID of.
 * @return {string} The ID of the item.
 */
export const getItemId = item => item?.id?.toString() ?? '';

/**
 * Wraps a promise with a timeout to ensure it rejects after a reasonable time.
 * This is useful for network requests that might hang when the network is disabled.
 *
 * @param {Promise} promise   - The promise to wrap.
 * @param {number}  timeoutMs - The timeout in milliseconds (default: 30000).
 * @return {Promise} The wrapped promise that will reject on timeout.
 */
export const withTimeout = ( promise, timeoutMs = 30000 ) => {
	return Promise.race( [
		promise,
		new Promise( ( _, reject ) =>
			setTimeout( () => reject( new Error( 'Request timeout' ) ), timeoutMs )
		),
	] );
};
