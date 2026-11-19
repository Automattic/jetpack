<?php
/**
 * The shared dashboard page layout stylesheet.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Jetpack's dashboard page layout, printed once as a stylesheet: the viewport-pinned content column
 * and the resets of wp-admin's chrome around it.
 *
 * A class of its own, not a method on Admin_Menu: another plugin can load an older Admin_Menu early,
 * but no older admin-ui has this class, so the autoloader always serves the newest copy of it.
 *
 * @since $$next-version$$
 */
class Page_Layout {

	/**
	 * Handle of the stylesheet.
	 *
	 * @var string
	 */
	const HANDLE = 'jetpack-admin-ui-page-layout';

	/**
	 * Enqueue the layout. Call it from the dashboard page's own asset hook: printed in <head>, the
	 * layout applies before the dashboard's JavaScript runs, so the page doesn't shift when it does.
	 *
	 * @return void
	 */
	public static function enqueue() {
		if ( ! wp_style_is( self::HANDLE, 'registered' ) ) {
			$build_dir  = dirname( __DIR__ ) . '/build/';
			$asset_file = $build_dir . 'admin-page-layout.asset.php';
			$asset      = file_exists( $asset_file ) ? require $asset_file : array();
			// Not `wp_style_add_data( 'rtl', 'replace' )`: core looks for `-rtl.css`, webpack writes `.rtl.css`.
			$file = is_rtl() && file_exists( $build_dir . 'admin-page-layout.rtl.css' ) ? 'admin-page-layout.rtl.css' : 'admin-page-layout.css';

			wp_register_style(
				self::HANDLE,
				plugins_url( '../build/' . $file, __FILE__ ),
				$asset['dependencies'] ?? array(),
				$asset['version'] ?? false
			);
		}

		wp_enqueue_style( self::HANDLE );
	}
}
