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
	 * Get the slug and label of My Jetpack's products tab, for footer links to it.
	 *
	 * @since $$next-version$$
	 *
	 * @return array{slug: string, label: string}
	 */
	public static function get_my_jetpack_products_section() {
		$products_section = method_exists( My_Jetpack_Initializer::class, 'get_products_section' )
			? My_Jetpack_Initializer::get_products_section()
			: null;

		return $products_section ?? array(
			'slug'  => 'products',
			'label' => _x( 'Products', 'Navigation item', 'jetpack' ),
		);
	}
}
