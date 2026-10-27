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
	 * Calypso's Scan page, since nothing serves this slug on WoA once Scan is live.
	 *
	 * Drop this override to land back on `jetpack-protect` once the Jetpack plugin serves it.
	 *
	 * @param string|null $new_host The site's address after a transfer, when it changes.
	 * @return string
	 */
	public static function get_live_feature_url( $new_host = null ) {
		$host = $new_host ?? wp_parse_url( home_url(), PHP_URL_HOST );

		return 'https://wordpress.com/scan/' . rawurlencode( (string) $host );
	}

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

	/**
	 * Keep the Jetpack plugin's Protect page out of the sidebar while Calypso's Scan owns the nav.
	 *
	 * Matched on the item's module: the standalone Protect plugin shares the slug and keeps its entry.
	 *
	 * @param array $states     Map of Jetpack menu item key to visibility state.
	 * @param array $menu_items The registered Jetpack menu items.
	 * @return array
	 */
	public static function filter_admin_menu_visibility( $states, $menu_items ) {
		// With the standalone Protect plugin active, its users keep a Protect entry, whichever page serves it.
		if ( class_exists( 'Jetpack_Protect' ) ) {
			return $states;
		}

		foreach ( (array) $menu_items as $item ) {
			if ( self::MENU_SLUG === ( $item['menu_slug'] ?? null ) && self::DASHBOARD_MODULE === ( $item['args']['module'] ?? null ) ) {
				$states[ $item['args']['key'] ?? self::MENU_SLUG ] = 'hidden';
			}
		}

		return $states;
	}
}

add_action( 'init', array( WPCOM_Scan::class, 'init' ) );
add_filter( 'jetpack_admin_menu_visibility', array( WPCOM_Scan::class, 'filter_admin_menu_visibility' ), 10, 2 );
