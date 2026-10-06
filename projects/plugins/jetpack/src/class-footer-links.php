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
	 * Get the slug and label of My Jetpack's Features tab.
	 *
	 * @since 16.3
	 * @deprecated $$next-version$$ Use the Features route directly.
	 *
	 * @return array{slug: string, label: string}
	 */
	public static function get_my_jetpack_products_section() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );

		return array(
			'slug'  => 'features',
			'label' => _x( 'Features', 'Navigation item', 'jetpack' ),
		);
	}
}
