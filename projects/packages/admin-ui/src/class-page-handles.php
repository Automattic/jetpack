<?php
/**
 * The handles a dashboard page printed, for clients that add more scripts and styles to it later.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Lets `loadMediaLibrary()` and the admin shell skip what the page already runs.
 *
 * Both skip a tag whose id is on the page, but concatenation, core's load-scripts.php or WordPress.com's, prints a handle with no id.
 */
class Page_Handles {

	/**
	 * Id of the JSON script tag that lists the handles.
	 */
	const ELEMENT_ID = 'jetpack-page-handles';

	/**
	 * Whether init() has run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Print the list on admin pages.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		// After _wp_footer_scripts(), so the late scripts and styles are done too.
		add_action( 'admin_print_footer_scripts', array( __CLASS__, 'print_handles' ), 100 );
	}

	/**
	 * Print the scripts and styles the page printed, on admin shell member pages, the only ones that load more.
	 *
	 * @return void
	 */
	public static function print_handles() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks which page this is.
		$page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page || ! isset( Admin_Shell::get_members()[ $page ] ) ) {
			return;
		}
		wp_print_inline_script_tag(
			(string) wp_json_encode(
				array(
					'scripts' => array_values( wp_scripts()->done ),
					'styles'  => array_values( wp_styles()->done ),
				),
				JSON_HEX_TAG | JSON_UNESCAPED_SLASHES
			),
			array(
				'type' => 'application/json',
				'id'   => self::ELEMENT_ID,
			)
		);
	}

	/**
	 * Print one tag per handle, with its id, for the rest of the request.
	 *
	 * @return void
	 */
	public static function print_one_tag_per_handle() {
		$GLOBALS['concatenate_scripts'] = false; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Core's load-scripts.php.
		// WordPress.com's: its stylesheet ids are positions, so they also collide with the page's.
		add_filter( 'wpcom_js_do_concat', '__return_false' );
		add_filter( 'wpcom_css_do_concat', '__return_false' );
	}
}
