<?php
/**
 * Boot configuration emitted to the Premium Analytics client.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Emits `window.jpaConfig` ahead of the boot script on the Premium Analytics
 * admin page.
 *
 * A much smaller take on `Odyssey_Config_Data::get_js_config_data()` from the
 * jetpack-stats-admin package: only the site ID, REST root, and REST nonce the
 * client data layer needs to call the Jetpack Stats proxy endpoints.
 */
class Config_Data {

	/**
	 * Hook the config emitter into both generated page variants.
	 *
	 * The wp-build page renderers register the `*-prerequisites` script handle
	 * and apply the `*_boot_dependencies` filter immediately afterwards, which
	 * makes that filter the earliest reliable point to attach an inline script
	 * to the handle. The full-page interceptor never fires
	 * `admin_print_scripts`, so a regular print hook would not run there.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter(
			'jetpack-premium-analytics_boot_dependencies',
			function ( $boot_dependencies ) {
				self::add_inline_config( 'jetpack-premium-analytics-prerequisites' );
				return $boot_dependencies;
			}
		);
		add_filter(
			'jetpack-premium-analytics-wp-admin_boot_dependencies',
			function ( $boot_dependencies ) {
				self::add_inline_config( 'jetpack-premium-analytics-wp-admin-prerequisites' );
				return $boot_dependencies;
			}
		);
	}

	/**
	 * Attach the inline config to the given prerequisites script handle so it
	 * runs before the boot module import.
	 *
	 * @param string $handle Registered prerequisites script handle.
	 * @return void
	 */
	public static function add_inline_config( $handle ) {
		wp_add_inline_script( $handle, self::get_js_config_data(), 'before' );
	}

	/**
	 * Build the inline script assigning the config to `window.jpaConfig`.
	 *
	 * @return string
	 */
	public static function get_js_config_data() {
		return 'window.jpaConfig = ' . wp_json_encode(
			self::get_data(),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		) . ';';
	}

	/**
	 * Return the config for the app.
	 *
	 * The site ID comes from the Jetpack connection (`Jetpack_Options`),
	 * which this package assumes is present at runtime (Jetpack is installed
	 * alongside Premium Analytics) without declaring a composer dependency.
	 *
	 * @return array
	 */
	public static function get_data() {
		$site_id = 0;
		if ( class_exists( 'Jetpack_Options' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Provided by Jetpack at runtime; guarded by class_exists().
			$site_id = (int) \Jetpack_Options::get_option( 'id' );
		}

		return array(
			'siteId'  => $site_id,
			'apiRoot' => esc_url_raw( rest_url() ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		);
	}
}
