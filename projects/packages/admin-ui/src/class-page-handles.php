<?php
/**
 * Page_Handles class.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Lists the handles a page printed, since concatenated ones have no tag id for `loadMediaLibrary()` and the admin shell to skip.
 */
class Page_Handles {

	/**
	 * Id of the JSON script tag that lists the handles.
	 */
	const ELEMENT_ID = 'jetpack-page-handles';

	/**
	 * Print the list on admin shell member pages, the only ones that load more.
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
	 * Print one tag per handle for the rest of the request.
	 *
	 * @return void
	 */
	public static function print_one_tag_per_handle() {
		$GLOBALS['concatenate_scripts'] = false; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Core's load-scripts.php.
		// WordPress.com's stylesheet ids are positions, which also collide with the page's.
		add_filter( 'wpcom_js_do_concat', '__return_false' );
		add_filter( 'wpcom_css_do_concat', '__return_false' );
	}
}
