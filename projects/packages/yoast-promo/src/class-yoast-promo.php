<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-yoast-promo
 */

namespace Automattic\Jetpack;

/**
 * Class description.
 */
class Yoast_Promo {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Script handle for the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'yoast-promo-editor';

	/**
	 * Path of the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	public static $script_path = '../build/editor.js';

	/**
	 * The configuration method that is called from the jetpack-config package.
	 *
	 * @return void
	 */
	public static function init() {
		// Do not do anything if promotions are disabled on the site
		if (
			/** This filter is documented in _inc/lib/admin-pages/class.jetpack-react-page.php */
			! apply_filters( 'jetpack_show_promotions', true )
		) {
			return;
		}

		// In the post editor, add a pre-publish panel to promote Yoast
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		/*
		 * We do not want (nor need) Yoast promo in the site editor, or the widget editor, or the classic editor.
		 * We only want it in the post editor.
		 * Enqueueing the script in those editors would cause a fatal error.
		 * See #20357 for more info.
		*/
		if ( ! function_exists( 'get_current_screen' ) ) { // When Gutenberg is loaded in the frontend.
			return;
		}
		$current_screen = get_current_screen();
		if (
			empty( $current_screen )
			|| $current_screen->base !== 'post'
			|| ! $current_screen->is_block_editor()
		) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			self::$script_path,
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-yoast-promo',
			)
		);
	}
}
