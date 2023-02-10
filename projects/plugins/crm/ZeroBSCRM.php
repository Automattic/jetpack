<?php
/**
 * Plugin Name: Jetpack CRM
 * Plugin URI: https://jetpackcrm.com
 * Description: Jetpack CRM is the simplest CRM for WordPress. Self host your own Customer Relationship Manager using WP.
 * Version: 5.5.3
 * Author: Automattic - Jetpack CRM team
 * Author URI: https://jetpackcrm.com
 * Text Domain: zero-bs-crm
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * License: GPLv2
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/* ======================================================
  Breaking Checks
   ====================================================== */

// stops direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Performs some checks before the plugin activation
 *
 * @param $plugin
 */
function jpcrm_activation_checks( $plugin ) {
	jpcrm_check_api_connector();
}
add_action( 'activate_plugin', 'jpcrm_activation_checks', 10, 2 );

/**
 * Check for the minimum PHP version
 *
 * @return bool
 */
function jpcrm_check_min_php_version() {
	$min_php_version = '7.2';

	if ( version_compare( PHP_VERSION, $min_php_version, '<' ) ) {

		$error_message = sprintf( __( 'Jetpack CRM requires PHP version %s or greater. Older versions of PHP are no longer supported. Your current version of PHP is %s.', 'zero-bs-crm' ), $min_php_version, PHP_VERSION );
		$error_message .= '<br><a href="https://kb.jetpackcrm.com/knowledge-base/php-version-jetpack-crm/" target="_blank">' . __( 'Click here for more information', 'zero-bs-crm' ) . '</a>';
		jpcrm_register_admin_notice( 'error', $error_message );
		return false;
	}

	return true;
}

/**
 * Determines if dev mode is enabled with JPCRM_DEVOVERRIDE constant
 *
 * @return bool
 */
function jpcrm_is_devmode_override() {
	if ( defined( 'JPCRM_DEVOVERRIDE' ) ) {
		return true;
	}
	return false;
}

/**
 * Check if the plugin API Connector is installed
 */
function jpcrm_check_api_connector() {
	global $zbs;
	if ( class_exists( 'ZeroBSCRM_APIConnector' ) ) {
		$error_msg = '<b>' . __( 'API Connector is currently installed and activated on this site.', 'zero-bs-crm' ) . '</b>';
		$error_msg .= '<br>' . __( 'API Connector is a plugin used to connect external websites to your CRM. You should not install it on the same website as your CRM. Please deactivate it first if you plan to install the CRM on this site.', 'zero-bs-crm' );
		$error_msg .= '<br><br><a href="' . $zbs->urls['kbapi'] . '">' . __( 'Learn more', 'zero-bs-crm' ) . '</a>';
		wp_die( $error_msg );
	}
}

/**
 * Verifies various critical checks pass:
 *   - PHP version
 */
function jpcrm_do_critical_prerun_checks() {
	$all_clear = true;
	if ( !jpcrm_check_min_php_version() ) {
		$all_clear = false;
	}

	// yay, all clear
	if ( $all_clear ) {
		return true;
	}

	// at this point something failed, so disable this plugin

	$error_message = __( 'Jetpack CRM was unable to load and has been deactivated.', 'zero-bs-crm' );
	jpcrm_register_admin_notice( 'error', $error_message );

	// this file isn't always available, so include it in case
	require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

	deactivate_plugins( __FILE__ );

	// if the plugin was just activated, this keeps it from saying "plugin activated"
	if ( isset( $_GET['activate'] ) ) {
		unset( $_GET['activate'] );
	}

	return false;
}

/**
 * Show admin notice with `admin_notices` action
 * 
 * @param string $notice_class e.g. "error"|"notice"
 * @param string $message
 */
function jpcrm_register_admin_notice( $notice_class, $message ) {
	$admin_notice_fn = function() use( $notice_class, $message ) {
		jpcrm_show_admin_notice( $notice_class, $message );
	};
	add_action( 'admin_notices', $admin_notice_fn );
}

/**
 * Show admin notice
 * 
 * @param string $notice_class e.g. "error"|"notice"
 * @param string $message
 */
function jpcrm_show_admin_notice( $notice_class, $message ) {
	?>
	<div class="<?php echo esc_attr( $notice_class ); ?>">
		<p>
			<?php echo $message; ?>
		</p>
	</div>
	<?php
}

/* ======================================================
  / Breaking Checks
   ====================================================== */


// ====================================================================
// =========================== Definitions ============================

// Enabling THIS will start LOGGING PERFORMANCE TESTS
// NOTE: This will do for EVERY page load, so just add temporarily else adds rolling DRAIN on sys
//  define( 'ZBSPERFTEST', 1 );

if ( ! defined( 'ZBS_ROOTFILE' ) ) {

	define( 'ZBS_ROOTFILE', __FILE__ );
	define( 'ZBS_ROOTDIR', basename(dirname(__FILE__)) ); // zero-bs-crm
	define(	'ZBS_ROOTPLUGIN', ZBS_ROOTDIR.'/'.basename( ZBS_ROOTFILE ) ); // zero-bs-crm/ZeroBSCRM.php
	define( 'ZBS_LANG_DIR', basename( dirname( __FILE__ ) ) . '/languages' );

}

// ========================= / Definitions ============================
// ====================================================================


// ====================================================================
// =================  Legacy (pre v2.53) Support ======================

	// LEGACY SUPPORT - all ext settings 
	global $zbsLegacySupport;
	$zbsLegacySupport = array('extsettingspostinit' => array());

	// support for old - to be removed in time.
	global $zeroBSCRM_Settings;

	// this gets run post init :)
	function zeroBSCRM_legacySupport(){

		// map old global, for NOW... remove once all ext's removed
		// only needed in old wh.config.lib's, which we can replace now :)
		global $zeroBSCRM_Settings, $zbs, $zbsLegacySupport;
		$zeroBSCRM_Settings = $zbs->settings;

		if (count($zbsLegacySupport) > 0) foreach ($zbsLegacySupport as $key => $defaultConfig){

			// init with a throwaway var (just get)

			// this checks is the setting is accessible, and if not (fresh installs) then uses the caught defaultConfig from wh.config.lib legacy support
			$existingSettings = $zbs->settings->dmzGetConfig($key);
			// Create if not existing
			if (!is_array($existingSettings)){

				// init
				$zbs->settings->dmzUpdateConfig($key,$defaultConfig);

			}

		} // / foreach loaded with legacy support

	}

	// legacy support for removal of _we() - to be fixed in ext
	// still used in a few plugins as of 1922-07-28
	if (!function_exists('_we')){
		function _we($str,$domain="zero-bs-crm"){
			_e($str,$domain);
		}
		function __w($str,$domain="zero-bs-crm"){
			return __($str,$domain);
		}
	}

// ================ / Legacy (pre v2.53) Support ======================
// ====================================================================


// ====================================================================
// ==================== General Perf Testing ==========================


function zeroBSCRM_init_perfTest() {
	if ( defined( 'ZBSPERFTEST' ) && zeroBSCRM_isWPAdmin() ) {

		// retrieve our global (may have had any number of test res added)
		global $zbsPerfTest;

		// If admin, clear any prev perf test ifset
		if ( isset( $_GET['delperftest'] ) ) {
			delete_option( 'zbs-global-perf-test' );
		}

		// retrieve opt + add to it (up to 50 tests)
		$zbsPerfTestOpt = get_option( 'zbs-global-perf-test', array() );
		if ( is_array( $zbsPerfTestOpt ) && count( $zbsPerfTestOpt ) < 50 ) {

			// add
			$zbsPerfTestOpt[] = $zbsPerfTest;

			// save
			update_option( 'zbs-global-perf-test', $zbsPerfTestOpt, false );
		}
	}
}

// =================== / General Perf Testing =========================
// ====================================================================


// ====================================================================
// =================  Main Include ====================================
if ( jpcrm_do_critical_prerun_checks() ) {


	// full perf test mode
	if ( defined( 'ZBSPERFTEST' ) ) {

		// store a global arr for this "test"
		global $zbsPerfTest;
		$zbsPerfTest = array(
			'init'    => time(),
			'get'     => $_GET,
			'results' => array(),
		);

		// include if not already
		if ( !function_exists( 'zeroBSCRM_performanceTest_finishTimer' ) ) {
				include_once dirname( __FILE__ ) . '/includes/ZeroBSCRM.PerformanceTesting.php';
		}

		// start timer
		zeroBSCRM_performanceTest_startTimer( 'plugin-load' );
	}

	// Include the main Jetpack CRM class.
	if ( !class_exists( 'ZeroBSCRM' ) ) {
		include_once dirname( __FILE__ ) . '/includes/ZeroBSCRM.Core.php';
	}

	// Initiate ZBS Main Core
	global $zbs;
	$zbs = ZeroBSCRM::instance();

	// close timer (at this point we'll have perf library)
	if ( defined( 'ZBSPERFTEST' ) ) {

		// retrieve our global (may have had any number of test res added)
		global $zbsPerfTest;

		// close it
		zeroBSCRM_performanceTest_finishTimer( 'plugin-load' );

		// store in perf-reports
		$zbsPerfTest['results']['plugin-load'] = zeroBSCRM_performanceTest_results( 'plugin-load' );

		// here we basically wait for init so we can check user is wp admin
		// ... only saving perf logs if defined + wp admin
		add_action( 'shutdown', 'zeroBSCRM_init_perfTest' );
	}
}

// ================ / Main Include ====================================
// ====================================================================
