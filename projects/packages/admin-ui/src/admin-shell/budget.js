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

/**
 * Whether to prewarm a dashboard on hover: not when the user saves data, memory is low or the connection is slow.
 *
 * @param {Navigator} nav - Reports the device's memory and connection, where the browser shares them.
 * @return {boolean} False to wait for the click.
 */
export function mayPrewarm( nav = globalThis.navigator ) {
	const connection = nav?.connection;
	return ! (
		connection?.saveData ||
		( nav?.deviceMemory && nav.deviceMemory <= 2 ) ||
		[ 'slow-2g', '2g' ].includes( connection?.effectiveType )
	);
}
