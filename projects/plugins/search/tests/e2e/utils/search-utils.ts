import { executeWpCommand } from '@automattic/_jetpack-e2e-commons/utils/cli';

/**
 * Enable Instant Search.
 * @return {string} wp-cli command output
 */
export async function enableInstantSearch(): Promise< string > {
	return executeWpCommand( 'option update instant_search_enabled 1' );
}

/**
 * Disable Instant Search.
 * @return {string} wp-cli command output
 */
export async function disableInstantSearch(): Promise< string > {
	return executeWpCommand( 'option update instant_search_enabled 0' );
}

/**
 * Set Search result format setting.
 * @param {string} format - Setting value.
 * @return {string} wp-cli command output
 */
export async function setResultFormat( format: string = 'expanded' ): Promise< string > {
	return executeWpCommand( `option update jetpack_search_result_format ${ format }` );
}

/**
 * Set Search theme setting.
 * @param {string} theme - Setting value.
 * @return {string} wp-cli command output
 */
export async function setTheme( theme: string = 'light' ): Promise< string > {
	return executeWpCommand( `option update jetpack_search_color_theme ${ theme }` );
}

/**
 * Set highlight color setting.
 * @param {string} color - Setting value.
 * @return {string} wp-cli command output
 */
export async function setHighlightColor( color: string = '#FFFFFF' ): Promise< string > {
	return executeWpCommand( `option update jetpack_search_highlight_color ${ color }` );
}

/**
 * Set default sort setting.
 * @param {string} defaultSort - Setting value.
 * @return {string} wp-cli command output
 */
export async function setDefaultSort( defaultSort: string = 'relevance' ): Promise< string > {
	return executeWpCommand( `option update jetpack_search_default_sort ${ defaultSort }` );
}

/**
 * Enable Search auto-config
 * @return {string} wp-cli command output
 */
export async function searchAutoConfig(): Promise< string > {
	// Run auto config to add search widget / block with user ID `1`.
	return await executeWpCommand( 'jetpack-search auto_config 1' );
}

/**
 * Clear Search plan info
 * @return {string} wp-cli command output
 */
export async function clearSearchPlanInfo(): Promise< string > {
	// When running locally, sometimes there could be data in the option - better clear it.
	return await executeWpCommand( 'option delete jetpack_search_plan_info' );
}
