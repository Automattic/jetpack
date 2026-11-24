<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_Monetize bootstrap class.
/**
 * A Monetize page for WoA sites that turned the Jetpack plugin's `monetize` module off.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../wpcom-hosting-feature-page/class-wpcom-hosting-feature-page.php';

/**
 * Claims the Monetize slug while its module is off, so links into it get a way to turn it back on rather than core's access error.
 */
class WPCOM_Monetize extends WPCOM_Hosting_Feature_Page {

	/**
	 * The slug the Monetize package serves its dashboard from.
	 */
	const MENU_SLUG = 'jetpack-monetize';

	/**
	 * The Jetpack plugin module that serves MENU_SLUG with the Monetize package's dashboard.
	 */
	const DASHBOARD_MODULE = 'monetize';

	/**
	 * As declared in routes/wpcom-monetize/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-monetize';

	/**
	 * The admin-post action, and nonce action, that turns the Monetize dashboard back on.
	 */
	const ENABLE_ACTION = 'wpcom_enable_monetize_dashboard';

	/**
	 * Monetize needs no plan, so the page only ever offers to turn it back on.
	 *
	 * @return bool
	 */
	public static function should_register() {
		return is_admin() && self::offers_enable();
	}

	/**
	 * The only prompt this page shows.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string
	 */
	public static function get_state( $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Matches the parent signature.
		return self::STATE_ENABLE;
	}

	/**
	 * The page title.
	 *
	 * @return string
	 */
	public static function get_page_title() {
		return __( 'Monetize', 'jetpack-mu-wpcom' );
	}

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	public static function get_menu_title() {
		return __( 'Monetize', 'jetpack-mu-wpcom' );
	}
}

add_action( 'init', array( WPCOM_Monetize::class, 'init' ) );
add_action( 'admin_post_' . WPCOM_Monetize::ENABLE_ACTION, array( WPCOM_Monetize::class, 'handle_enable' ) );
