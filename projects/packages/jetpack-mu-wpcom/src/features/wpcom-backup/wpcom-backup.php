<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_Backup bootstrap class.
/**
 * An in-wp-admin Backup page for WordPress.com Simple and WoA sites.
 * Prompts for a plan upgrade or activation of backups.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../wpcom-hosting-feature-page/class-wpcom-hosting-feature-page.php';

/**
 * Registers the Backup admin page and its wp-build assets.
 */
class WPCOM_Backup extends WPCOM_Hosting_Feature_Page {

	/**
	 * Matches Jetpack_Backup::JETPACK_BACKUP_SLUG, which the Jetpack plugin takes over once
	 * backups are live.
	 */
	const MENU_SLUG = 'jetpack-backup';

	/**
	 * Filter that switches Backup to wp-admin, shared with the Backup package's dashboard.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_backup';

	/**
	 * Blog sticker that puts a site back on the legacy Backup experience, shared with the Backup package.
	 */
	const LEGACY_DASHBOARD_STICKER = 'use-backup-legacy-dashboard';

	/**
	 * As declared in routes/wpcom-backup/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-backup';

	/**
	 * Product name, do not translate.
	 */
	const PAGE_TITLE = 'Jetpack VaultPress Backup';

	/**
	 * Product name, do not translate.
	 */
	const MENU_TITLE = 'Backup';

	/**
	 * Self-serve backups.
	 */
	const FEATURE = 'BACKUPS_SELF_SERVE';

	/**
	 * Whether Backup opens in wp-admin rather than Calypso.
	 *
	 * Defaults on unless the site has the legacy dashboard sticker, like the Backup package's dashboard.
	 *
	 * @return bool
	 */
	public static function is_modernized() {
		$has_legacy_sticker = wpcom_has_blog_sticker( self::LEGACY_DASHBOARD_STICKER, get_wpcom_blog_id() );

		return (bool) apply_filters( self::MODERNIZATION_FILTER, ! $has_legacy_sticker );
	}

	/**
	 * Keep the Jetpack plugin's Backup dashboard off a WoA site whose plan lacks backups.
	 *
	 * Otherwise it claims the slug first and this page's upgrade prompt steps aside.
	 *
	 * @param bool $enabled Whether the Jetpack plugin offers its Backup dashboard.
	 * @return bool
	 */
	public static function filter_jetpack_backup_dashboard( $enabled ) {
		return $enabled && self::has_feature();
	}
}

add_action( 'init', array( WPCOM_Backup::class, 'init' ) );
