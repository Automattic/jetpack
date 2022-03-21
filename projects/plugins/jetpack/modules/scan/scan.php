<?php
/**
 * Jetpack Scan features that show up on the jetpack admin side.
 * - Adds a admin bar notice when the site has threats.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Scan;

require_once __DIR__ . '/class-admin-bar-notice.php';
require_once __DIR__ . '/class-admin-sidebar-link.php';

Admin_Bar_Notice::instance();
Admin_Sidebar_Link::instance();

if ( ! class_exists( 'Jetpack_Backup' ) && defined( 'JETPACK__BACKUP_UI_BETA_ENABLED' ) && JETPACK__BACKUP_UI_BETA_ENABLED ) {
	define( 'JETPACK_BACKUP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
	define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE', __FILE__ );
	define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
	define( 'JETPACK_BACKUP_PLUGIN_SLUG', 'jetpack-backup' );
	define( 'JETPACK_BACKUP_PLUGIN_NAME', 'Jetpack Backup' );
	define( 'JETPACK_BACKUP_PLUGIN_URI', 'https://jetpack.com/jetpack-backup' );
	define( 'JETPACK_BACKUP_REQUIRED_JETPACK_VERSION', '10.0' );
	define( 'JETPACK_BACKUP_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
	define( 'JETPACK_BACKUP_PROMOTED_PRODUCT', 'jetpack_backup_t1_yearly' );
	define( 'JETPACK_BACKUP_DB_VERSION', '2' );

	require_once __DIR__ . '/class-jetpack-backup-ui.php';
	new \Jetpack_Backup_UI();
}
