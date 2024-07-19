/**
 * Get the initial state from the window object.
 *
 * @returns {import('./types').JetpackInitialState} The initial state.
 */
export function getInitialState() {
	return window.JETPACK_INITIAL_STATE;
}

/**
 * Get the site data from the initial state.
 *
 * @returns {import('./types').SiteData} The site data.
 */
export function getSiteData() {
	return getInitialState().site;
}

/**
 * Get the admin URL from the initial state.
 *
 * @param {string} [path] - The path to append to the admin URL.
 *
 * @returns {string} The admin URL.
 */
export function getAdminUrl( path = '' ) {
	return `${ getInitialState().site.admin_url }${ path }`;
}

/**
 * Get the url for the My Jetpack page.
 *
 * @param {string} [section] - The section to append to the My Jetpack URL.
 *
 * @returns {string} The My Jetpack URL.
 */
export function getMyJetpackUrl( section = '' ) {
	return getAdminUrl( `admin.php?page=my-jetpack${ section }` );
}
