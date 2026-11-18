<?php
/**
 * Links shared by the Jetpack admin footers.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Resolves the footer links that other Jetpack products own.
 *
 * Autoloaded from `src/` rather than shared through `Jetpack_Admin_Page`: WordPress.com
 * Simple declares its own stub of that class, so loading ours there fatals.
 */
class Footer_Links {

	/**
	 * Whether My Jetpack reports that its admin page is available to the current user.
	 *
	 * @since 16.3
	 *
	 * @return bool
	 */
	public static function is_my_jetpack_available() {
		return method_exists( My_Jetpack_Initializer::class, 'is_admin_page_available' )
			&& My_Jetpack_Initializer::is_admin_page_available();
	}

	/**
	 * Whether the Jetpack admin header and footers link to My Jetpack: its page is available and the host shows it.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function shows_my_jetpack_links() {
		return self::is_my_jetpack_available()
			/** This filter is documented in projects/packages/my-jetpack/src/class-initializer.php */
			&& apply_filters( 'jetpack_my_jetpack_modules_management_available', true );
	}
}
