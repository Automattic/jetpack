<?php
/**
 * SEO dashboard visibility.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Makes the dashboard discoverable on supported hosts.
 */
class Surface_Visibility {

	/**
	 * Whether the dashboard is available on this host.
	 *
	 * @return bool
	 */
	public static function is_visible() {
		return Initializer::is_available();
	}

	/**
	 * Expose dashboard visibility to other admin screens.
	 *
	 * @param array $data Script data being injected onto the page.
	 * @return array
	 */
	public static function inject_surface_visibility( $data ) {
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] = self::is_visible();

		return $data;
	}
}
