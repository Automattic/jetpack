// How much of the device's memory the shell may spend keeping dashboards live, prewarmed or mounted.

/**
 * How many dashboards may be live in one document, the host included.
 *
 * @param {number|null} override - A limit the site set with `jetpack_admin_shell_max_live_apps`.
 * @param {Navigator}   nav      - Reports the device's memory in GB, where the browser shares it.
 * @return {number} The limit; Infinity for none.
 */
export function liveAppLimit( override, nav = globalThis.navigator ) {
	if ( Number.isInteger( override ) && override > 0 ) {
		return override;
	}
	const memory = nav?.deviceMemory;
	// Firefox and Safari don't report it.
	if ( ! memory ) {
		return 6;
	}
	if ( memory <= 2 ) {
		return 3;
	}
	return memory < 8 ? 6 : Infinity;
}
