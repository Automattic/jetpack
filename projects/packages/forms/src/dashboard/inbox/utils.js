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
 * The Forms wp-admin submenu badge can be registered under either of two
 * slugs, depending on the `jetpack_forms_alpha` filter: the wp-build slug
 * (`jetpack-forms-responses-wp-admin`), or the legacy slug
 * (`jetpack-forms-admin`, i.e. `Dashboard::ADMIN_SLUG`) when the filter
 * returns false. This selector matches whichever one is actually rendered so
 * callers don't have to hardcode (and potentially mismatch) the active slug.
 */
const FORMS_MENU_BADGE_SELECTOR =
	'[data-jp-menu-badge="jetpack-forms-responses-wp-admin"],[data-jp-menu-badge="jetpack-forms-admin"]';

/**
 * Fallback slug to use when no Forms menu badge is present in the DOM
 * (e.g. the count is already 0, or the badge simply hasn't rendered yet).
 * This matches the default wp-build slug.
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
 * Resolve the slug the Forms wp-admin submenu badge is currently registered
 * under, by reading it off the rendered `data-jp-menu-badge` attribute rather
 * than assuming a fixed slug. This is needed because the active slug depends
 * on the `jetpack_forms_alpha` filter (see `FORMS_MENU_BADGE_SELECTOR`
 * above), and using the wrong slug means `window.jetpackMenuBadges.setCount()`
 * silently no-ops against a badge element that doesn't exist.
 *
 * @return {string} The active Forms menu badge slug, or the default wp-build slug if no badge is rendered.
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
