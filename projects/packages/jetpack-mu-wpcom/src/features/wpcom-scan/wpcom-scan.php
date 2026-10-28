<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_Scan bootstrap class.
/**
 * An in-wp-admin Protect page for WordPress.com Simple and WoA sites.
 * Prompts for a plan upgrade or activation of Scan.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../wpcom-hosting-feature-page/class-wpcom-hosting-feature-page.php';

/**
 * Registers the Protect admin page and its wp-build assets.
 */
class WPCOM_Scan extends WPCOM_Hosting_Feature_Page {

	/**
	 * The slug the Jetpack plugin is expected to serve Protect from on WoA once Scan is live.
	 */
	const MENU_SLUG = 'jetpack-protect';

	/**
	 * The Jetpack plugin module that serves MENU_SLUG with the Protect package's dashboard.
	 */
	const DASHBOARD_MODULE = 'protect-dashboard';

	/**
	 * As declared in routes/wpcom-scan/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-scan';

	/**
	 * Product name, do not translate.
	 */
	const PAGE_TITLE = 'Jetpack Protect';

	/**
	 * Product name, do not translate.
	 */
	const MENU_TITLE = 'Protect';

	/**
	 * SCAN_SELF_SERVE, not SCAN: SCAN also covers Personal and Premium plans, which run scans
	 * without exposing Scan's UI. It is also what the dashboard's Scan page gates on.
	 */
	const FEATURE = 'SCAN_SELF_SERVE';

	/**
	 * Keep the Jetpack plugin's Protect dashboard off a WoA site whose plan lacks Scan, so this page's upgrade prompt keeps the slug.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! self::has_feature() ) {
			unset( $modules[ self::DASHBOARD_MODULE ] );
		}

		return $modules;
	}
}

add_action( 'init', array( WPCOM_Scan::class, 'init' ) );
