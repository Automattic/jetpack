/**
 * Returns true if the Super Cache plugin is installed and active.
 */
export function isSuperCachePluginActive(): boolean {
	return !! Jetpack_Boost?.superCache?.pluginActive;
}

/**
 * Returns true if the Super Cache plugin is installed, active, and enabled.
 */
export function isSuperCacheEnabled() {
	return !! Jetpack_Boost?.superCache?.cacheEnabled;
}
