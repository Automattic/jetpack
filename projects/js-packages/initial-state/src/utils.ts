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
 * @param {string} [path] - The path to append to the admin URL. e.g. `admin.php?page=jetpack`.
 *
 * @returns {string} The admin URL.
 */
export function getAdminUrl( path = '' ) {
	return `${ getInitialState().site.admin_url }${ path }`;
}

/**
 * Get the url for the Jetpack admin page.
 *
 * @param {string} [section] - The section to append to the My Jetpack URL. e.g. `#/settings`.
 *
 * @returns {string} The Jetpack admin page URL.
 */
export function getJetpackAdminPageUrl( section = '' ) {
	return getAdminUrl( `admin.php?page=jetpack${ section }` );
}

/**
 * Get the url for the My Jetpack page.
 *
 * @param {string} [section] - The section to append to the My Jetpack URL. e.g. `#/connection`.
 *
 * @returns {string} The My Jetpack URL.
 */
export function getMyJetpackUrl( section = '' ) {
	return getAdminUrl( `admin.php?page=my-jetpack${ section }` );
}

/**
 * Get the current user data from the initial state.
 *
 * @returns {import('./types').SitePlan['features']['active']} The active features.
 */
export function getActiveFeatures() {
	return getInitialState().site.plan?.features?.active ?? [];
}
