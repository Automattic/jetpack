export type JpaConfig = {
	/**
	 * WordPress.com blog ID of the connected site.
	 */
	siteId: number;

	/**
	 * REST API root URL, e.g. `https://example.com/wp-json/`.
	 */
	apiRoot: string;

	/**
	 * REST API nonce (`wp_rest`).
	 */
	nonce: string;
};

declare global {
	interface Window {
		jpaConfig?: JpaConfig;
	}
}

/**
 * Read the boot configuration emitted by the PHP `Config_Data` class as
 * `window.jpaConfig` ahead of the boot script on the Premium Analytics admin
 * page.
 *
 * @return The boot configuration.
 * @throws {Error} If called outside a browser context or before the config is emitted.
 */
export function getJpaConfig(): JpaConfig {
	if ( typeof window === 'undefined' || ! window.jpaConfig ) {
		throw new Error(
			'window.jpaConfig is not available. It is emitted by the Config_Data PHP class on the Premium Analytics admin page; outside that page (or in tests) it must be stubbed.'
		);
	}

	return window.jpaConfig;
}
