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
 * Slug the Forms wp-admin submenu badge is registered under. Must match
 * `Dashboard::FORMS_WPBUILD_ADMIN_SLUG` in the PHP class of the same name, and
 * the `data-jp-menu-badge` attribute the shared menu-badges renderer tags the
 * Forms badge with.
 */
export const FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

/**
 * Read the current Forms submenu badge count from the DOM, so callers can
 * compute an optimistic delta (e.g. -1 on mark-as-read) without waiting for
 * the authoritative server count.
 *
 * @return {number} The current badge count, or 0 if the badge isn't rendered (e.g. the count is already 0).
 */
export const getMenuBadgeCount = () => {
	const badge = document.querySelector( `[data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }"]` );
	if ( ! badge ) {
		return 0;
	}
	return parseInt( badge.getAttribute( 'data-jp-menu-count' ), 10 ) || 0;
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
