<?php
/**
 * Hooks class class file for the Jetpack Beta plugin.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Jetpack;
use Language_Pack_Upgrader;
use Plugin_Upgrader;
use WP_Ajax_Upgrader_Skin;
use WP_Error;

/**
 * Hooks class class file for the Jetpack Beta plugin.
 */
class Hooks {

	/**
	 * Singleton class instance.
	 *
	 * @var static
	 */
	protected static $instance = null;

	/**
	 * WP Options string: jetpack_beta_active
	 *
	 * @var string
	 */
	protected static $option = 'jetpack_beta_active';

	/**
	 * WP Options string: jetpack_beta_dev_currently_installed
	 *
	 * @var string
	 */
	protected static $option_dev_installed = 'jetpack_beta_dev_currently_installed';

	/**
	 * WP Options string: jp_beta_autoupdate
	 *
	 * @var string
	 */
	protected static $option_autoupdate = 'jp_beta_autoupdate';

	/**
	 * WP Options string: jp_beta_email_notifications
	 *
	 * @var string
	 */
	protected static $option_email_notif = 'jp_beta_email_notifications';

	/**
	 * WP-Cron string: jetpack_beta_autoupdate_hourly_cron
	 *
	 * @var string
	 */
	protected static $auto_update_cron_hook = 'jetpack_beta_autoupdate_hourly_cron';

	/**
	 * Main Instance
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'maybe_plugins_update_transient' ) );
		add_filter( 'upgrader_post_install', array( $this, 'upgrader_post_install' ), 10, 3 );

		add_action( 'admin_bar_menu', array( $this, 'admin_bar_menu' ) );
		add_action( 'deactivate_plugin', array( $this, 'plugin_deactivated' ), 10, 2 );

		add_action( 'upgrader_process_complete', array( $this, 'upgrader_process_complete' ), 10, 2 );

		add_filter( 'plugin_action_links_' . JETPACK_PLUGIN_FILE, array( $this, 'remove_activate_stable' ) );
		add_filter( 'plugin_action_links_' . JETPACK_DEV_PLUGIN_FILE, array( $this, 'remove_activate_dev' ) );

		add_filter( 'network_admin_plugin_action_links_' . JETPACK_PLUGIN_FILE, array( $this, 'remove_activate_stable' ) );
		add_filter( 'network_admin_plugin_action_links_' . JETPACK_DEV_PLUGIN_FILE, array( $this, 'remove_activate_dev' ) );

		add_filter( 'all_plugins', array( $this, 'update_all_plugins' ) );

		add_filter( 'plugins_api', array( $this, 'get_plugin_info' ), 10, 3 );

		add_action( 'jetpack_beta_autoupdate_hourly_cron', array( self::class, 'run_autoupdate' ) );

		add_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );

		if ( is_admin() ) {
			self::maybe_schedule_autoupdate();
			Admin::init();
		}
	}

	/**
	 * Fired when the upgrader process is complete; sets option jetpack_beta_dev_currently_installed
	 *
	 * @param WP_Upgrader $upgrader          - An upgrader instance.
	 * @param array       $updates_completed - Array of bulk item update data.
	 */
	public function upgrader_process_complete( $upgrader, $updates_completed ) {
		if ( ! isset( $updates_completed['plugins'] ) ) {
			return;
		}

		if ( 'update' === $updates_completed['action'] &&
			'plugin' === $updates_completed['type'] &&
		in_array( JETPACK_DEV_PLUGIN_FILE, $updates_completed['plugins'], true ) ) {
			list( $branch, $section ) = Utils::get_branch_and_section_dev();
			if ( Utils::should_update_dev_to_master() ) {
				list( $branch, $section ) = array( 'master', 'master' );
			}
			update_option( self::$option_dev_installed, array( $branch, $section, Utils::get_manifest_data( $branch, $section ) ) );
		}
	}

	/**
	 * If Jetpack or JP Dev plugin is network activated, update active_plugins option.
	 */
	public static function is_network_enabled() {
		if ( Utils::is_network_active() ) {
			add_filter( 'option_active_plugins', array( self::class, 'override_active_plugins' ) );
		}
	}

	/**
	 * This filter is only applied if Jetpack is network activated,
	 * makes sure that you can't have Jetpack or Jetpack Dev plugins versions loaded.
	 *
	 * @param array $active_plugins - Currently activated plugins.
	 *
	 * @return array Updated array of active plugins.
	 */
	public static function override_active_plugins( $active_plugins ) {
		$new_active_plugins = array();
		foreach ( $active_plugins as $active_plugin ) {
			if ( ! Utils::is_jetpack_plugin( $active_plugin ) ) {
				$new_active_plugins[] = $active_plugin;
			}
		}
		return $new_active_plugins;
	}

	/**
	 * Actions taken when the Jetpack Beta plugin is deactivated.
	 *
	 * @param string $plugin       - Plugin path being deactivated.
	 */
	public function plugin_deactivated( $plugin ) {
		if ( ! Utils::is_jetpack_plugin( $plugin ) ) {
			return;
		}

		delete_option( self::$option );
	}

	/**
	 * Filter JP Dev plugin action links.
	 *
	 * @param array $actions - Array of plugin action links.
	 */
	public function remove_activate_dev( $actions ) {
		if ( is_plugin_active( JETPACK_PLUGIN_FILE ) || Utils::is_network_active() ) {
			$actions['activate'] = __( 'Plugin Already Active', 'jetpack-beta' );
		}
		return $actions;
	}

	/**
	 * Filter JP Stable plugin action links.
	 *
	 * @param array $actions - Array of plugin action links.
	 */
	public function remove_activate_stable( $actions ) {
		if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) || Utils::is_network_active() ) {
			$actions['activate'] = __( 'Plugin Already Active', 'jetpack-beta' );
		}
		return $actions;
	}

	/**
	 * Filters plugins to list in the Plugins list table.
	 *
	 * @param array $plugins - Array of arrays of plugin data.
	 *
	 * @return array Updated array of plugin data.
	 */
	public function update_all_plugins( $plugins ) {
		// WP.com requests away show regular plugin.
		if ( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ) {
			// Ensure that Jetpack reports the version it's using on account of the Jetpack Beta plugin to Calypso.
			if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) ) {
				$plugins[ JETPACK_PLUGIN_FILE ]['Version'] = $plugins[ JETPACK_DEV_PLUGIN_FILE ]['Version'];
			}
			unset( $plugins[ JETPACK_DEV_PLUGIN_FILE ] );
			return $plugins;
		}

		if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) ) {
			unset( $plugins[ JETPACK_PLUGIN_FILE ] );
		} else {
			unset( $plugins[ JETPACK_DEV_PLUGIN_FILE ] );
		}
		return $plugins;
	}

	/**
	 * Filter WordPress.org Plugins API results.
	 *
	 * @param false|object|array $false    - The result object or array. Default false.
	 * @param string             $action   - The type of information being requested from the Plugin Installation API.
	 * @param object             $response - Plugin API arguments.
	 */
	public function get_plugin_info( $false, $action, $response ) {

		// Check if this call API is for the right plugin.
		if ( ! isset( $response->slug ) || JETPACK_DEV_PLUGIN_SLUG !== $response->slug ) {
			return false;
		}
		$update_date  = null;
		$download_zip = null;
		$dev_data     = Utils::get_dev_installed();
		if ( isset( $dev_data[2] ) ) {
			$update_date  = $dev_data[2]->update_date;
			$download_zip = $dev_data[2]->download_url;
		}
		// Update tags.
		$response->slug          = JETPACK_DEV_PLUGIN_SLUG;
		$response->plugin        = JETPACK_DEV_PLUGIN_SLUG;
		$response->name          = 'Jetpack | ' . Utils::get_jetpack_plugin_pretty_version( true );
		$response->plugin_name   = 'Jetpack | ' . Utils::get_jetpack_plugin_pretty_version( true );
		$response->version       = Utils::get_jetpack_plugin_version( true );
		$response->author        = 'Automattic';
		$response->homepage      = 'https://jetpack.com/contact-support/beta-group/';
		$response->downloaded    = false;
		$response->last_updated  = $update_date;
		$response->sections      = array( 'description' => Admin::to_test_content() );
		$response->download_link = $download_zip;
		return $response;
	}

	/**
	 * Run on activation to flush update cache.
	 */
	public static function activate() {
		// Don't do anyting funnly.
		if ( defined( 'DOING_CRON' ) ) {
			return;
		}
		delete_site_transient( 'update_plugins' );
	}

	/**
	 * Handler ran for Jetpack Beta plugin deactivation hook.
	 */
	public static function deactivate() {
		// Don't do anyting funnly.
		if ( defined( 'DOING_CRON' ) ) {
			return;
		}

		self::clear_autoupdate_cron();
		Utils::delete_all_transiants();
		add_action( 'shutdown', array( self::class, 'switch_active' ), 5 );
		add_action( 'shutdown', array( self::class, 'remove_dev_plugin' ), 20 );
		delete_option( self::$option );
	}

	/**
	 * When Jetpack Beta plugin is deactivated, remove the jetpack-dev plugin directory and cleanup.
	 */
	public static function remove_dev_plugin() {
		if ( is_multisite() ) {
			return;
		}

		// Delete the jetpack dev plugin.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		if ( ! WP_Filesystem( $creds ) ) {
			// Any problems and we exit.
			return;
		}
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			return;
		}

		$working_dir = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_DEV_PLUGIN_SLUG;
		// Delete the folder JETPACK_BETA_PLUGIN_FOLDER.
		if ( $wp_filesystem->is_dir( $working_dir ) ) {
			$wp_filesystem->delete( $working_dir, true );
		}
		// Since we are removing this dev plugin we should also clean up this data.
		delete_option( self::$option_dev_installed );
	}

	/**
	 * Build the "Jetpack Beta" admin bar menu items.
	 */
	public function admin_bar_menu() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return;
		}

		// Nothing got activated yet.
		if ( ! Utils::get_option() ) {
			return;
		}

		$args = array(
			'id'     => 'jetpack-beta_admin_bar',
			'title'  => 'Jetpack Beta',
			'parent' => 'top-secondary',
			'href'   => current_user_can( 'update_plugins' ) ? Utils::admin_url() : '',
		);
		$wp_admin_bar->add_node( $args );

		// Add a child item to our parent item.
		$args = array(
			'id'     => 'jetpack-beta_version',
			// translators: %s: active Jetpack plugin branch/tag.
			'title'  => sprintf( __( 'Running %s', 'jetpack-beta' ), Utils::get_jetpack_plugin_pretty_version() ),
			'parent' => 'jetpack-beta_admin_bar',
		);

		$wp_admin_bar->add_node( $args );

		if ( Utils::get_plugin_slug() === JETPACK_DEV_PLUGIN_SLUG ) {
			// Highlight the menu if you are running the BETA Versions..
			echo sprintf( '<style>#wpadminbar #wp-admin-bar-jetpack-beta_admin_bar { background: %s; }</style>', esc_attr( JETPACK_GREEN ) );
		}

		$args = array(
			'id'     => 'jetpack-beta_report',
			'title'  => __( 'Report Bug', 'jetpack-beta' ),
			'href'   => JETPACK_BETA_REPORT_URL,
			'parent' => 'jetpack-beta_admin_bar',
		);
		$wp_admin_bar->add_node( $args );

		list( $branch, $section ) = Utils::get_branch_and_section();
		if ( 'pr' === $section ) {
			$args = array(
				'id'     => 'jetpack-beta_report_more_info',
				'title'  => __( 'More Info ', 'jetpack-beta' ),
				'href'   => Utils::get_url( $branch, $section ),
				'parent' => 'jetpack-beta_admin_bar',
			);
			$wp_admin_bar->add_node( $args );
		}
	}

	/**
	 * Filters `update_plugins` transient.
	 *
	 * @param object $transient - Plugin update data.
	 */
	public function maybe_plugins_update_transient( $transient ) {
		if ( ! isset( $transient->no_update ) ) {
			return $transient;
		}

		// Do not try to update things that do not exist.
		if ( ! file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_DEV_PLUGIN_FILE ) ) {
			return $transient;
		}

		// Do not look for update if we are stable branch.
		if ( Utils::is_on_stable() ) {
			return $transient;
		}

		// Lets always grab the latest.
		delete_site_transient( 'jetpack_beta_manifest' );

		// Check if there is a new version.
		if ( Utils::should_update_dev_to_master() ) {
			// If response is false, don't alter the transient.
			$transient->response[ JETPACK_DEV_PLUGIN_FILE ] = Utils::get_jepack_dev_master_update_response();
			// Unset the that it doesn't need an update.
			unset( $transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] );
		} elseif ( Utils::should_update_dev_version() ) {
			// If response is false, don't alter the transient.
			$transient->response[ JETPACK_DEV_PLUGIN_FILE ] = Utils::get_jepack_dev_update_response();
			// Unset the that it doesn't need an update.
			unset( $transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] );
		} else {
			unset( $transient->response[ JETPACK_DEV_PLUGIN_FILE ] );
			if ( isset( $transient->no_update ) ) {
				$transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] = Utils::get_jepack_dev_update_response();
			}
		}

		return $transient;
	}

	/**
	 * Moves the newly downloaded folder into jetpack-dev.
	 *
	 * @param bool  $worked      - Installation response.
	 * @param array $hook_extras - Extra args passed to hooked filters.
	 * @param array $result      - Installation result data.
	 *
	 * @return WP_Error
	 */
	public function upgrader_post_install( $worked, $hook_extras, $result ) {
		global $wp_filesystem;

		if (
		! isset( $hook_extras['plugin'] )
		|| JETPACK_DEV_PLUGIN_FILE !== $hook_extras['plugin']
		) {
			return $worked;
		}

		if ( $wp_filesystem->move( $result['destination'], WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_DEV_PLUGIN_SLUG, true ) ) {
			return $worked;
		} else {
			return new WP_Error();
		}
	}

	/**
	 * Switch active JP plugin version when JP Beta plugin is deactivated.
	 * This needs to happen on `shutdown`, otherwise it doesn't work.
	 */
	public static function switch_active() {
		Utils::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE );
	}

	/**
	 * Clear scheduled WP-Cron jobs on plugin deactivation.
	 */
	public static function clear_autoupdate_cron() {
		if ( ! is_main_site() ) {
			return;
		}
		wp_clear_scheduled_hook( self::$auto_update_cron_hook );

		if ( function_exists( 'wp_unschedule_hook' ) ) { // New in WP `4.9`.
			wp_unschedule_hook( self::$auto_update_cron_hook );
		}
	}

	/**
	 * Schedule plugin update jobs.
	 */
	public static function schedule_hourly_autoupdate() {
		wp_clear_scheduled_hook( self::$auto_update_cron_hook );
		wp_schedule_event( time(), 'hourly', self::$auto_update_cron_hook );
	}

	/**
	 * Determine if plugin update jobs should be scheduled.
	 */
	public static function maybe_schedule_autoupdate() {
		if ( ! Utils::is_set_to_autoupdate() ) {
			return;
		}

		if ( ! is_main_site() ) {
			return;
		}
		$has_schedule_already = wp_get_schedule( self::$auto_update_cron_hook );
		if ( ! $has_schedule_already ) {
			self::schedule_hourly_autoupdate();
		}
	}

	/**
	 * The jetpack_beta_autoupdate_hourly_cron job - does not update Stable.
	 */
	public static function run_autoupdate() {
		if ( ! Utils::is_set_to_autoupdate() ) {
			return;
		}

		if ( ! is_main_site() ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins(); // Check for Plugin updates.
		ob_end_clean();
		$plugins = array();
		if (
		! Utils::is_on_stable() &&
		( Utils::should_update_dev_to_master() || Utils::should_update_dev_version() )
		) {
			add_filter( 'upgrader_source_selection', array( self::class, 'check_for_main_files' ), 10, 2 );

			// If response is false, don't alter the transient.
			$plugins[] = JETPACK_DEV_PLUGIN_FILE;
		}
		$autupdate = AutoupdateSelf::instance();
		if ( $autupdate->has_newer_version() ) {
			$plugins[] = JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php';
		}

		if ( empty( $plugins ) ) {
			return;
		}

		// Unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( Language_Pack_Upgrader::class, 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );

		$skin = new WP_Ajax_Upgrader_Skin();
		// The Automatic_Upgrader_Skin skin shouldn't output anything.
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->init();
		// This avoids the plugin to be deactivated.
		// Using bulk upgrade puts the site into maintenance mode during the upgrades.
		$result = $upgrader->bulk_upgrade( $plugins );
		$errors = $upgrader->skin->get_errors();
		$log    = $upgrader->skin->get_upgrade_messages();

		if ( is_wp_error( $errors ) && $errors->get_error_code() ) {
			return $errors;
		}

		if ( $result && ! defined( 'JETPACK_BETA_SKIP_EMAIL' ) && Utils::is_set_to_email_notifications() ) {
			self::send_autoupdate_email( $plugins, $log );
		}
	}

	/**
	 * Builds and sends an email about succesfull plugin autoupdate.
	 *
	 * @param Array  $plugins - List of plugins that were updated.
	 * @param String $log     - Upgrade message from core's plugin upgrader.
	 */
	private static function send_autoupdate_email( $plugins, $log ) {
		$admin_email = get_site_option( 'admin_email' );

		if ( empty( $admin_email ) ) {
			return;
		}

		// Calling empty() on a function return value crashes in PHP < 5.5.
		// Thus we assign the return value explicitly and then check with empty().
		$bloginfo_name = get_bloginfo( 'name' );
		$site_title    = ! empty( $bloginfo_name ) ? get_bloginfo( 'name' ) : get_site_url();
		$what_updated  = 'Jetpack Beta Tester Plugin';
		// translators: %s: The site title.
		$subject = sprintf( __( '[%s] Autoupdated Jetpack Beta Tester', 'jetpack-beta' ), $site_title );

		if ( in_array( JETPACK_DEV_PLUGIN_FILE, $plugins, true ) ) {
			$subject = sprintf(
				// translators: %1$s: site title, %2$s: pretty plugin version (eg 9.3).
				__( '[%1$s] Autoupdated Jetpack %2$s ', 'jetpack-beta' ),
				$site_title,
				Utils::get_jetpack_plugin_pretty_version()
			);

			$what_updated = sprintf(
				// translators: $1$s: pretty plugin version, $2$s: raw plugin version (eg 9.3.2-beta).
				__( 'Jetpack %1$s (%2$s)', 'jetpack-beta' ),
				Utils::get_jetpack_plugin_pretty_version(),
				Utils::get_jetpack_plugin_version()
			);

			if ( count( $plugins ) > 1 ) {
				$subject = sprintf(
					// translators: %1$s: site title, %2$s: pretty plugin version.
					__( '[%1$s] Autoupdated Jetpack %2$s and the Jetpack Beta Tester', 'jetpack-beta' ),
					$site_title,
					Utils::get_jetpack_plugin_pretty_version()
				);

				$what_updated = sprintf(
					// translators: $1$s: pretty plugin version, $2$s: raw plugin version.
					__( 'Jetpack %1$s (%2$s) and the Jetpack Beta Tester', 'jetpack-beta' ),
					Utils::get_jetpack_plugin_pretty_version(),
					Utils::get_jetpack_plugin_version()
				);
			}
		}

		$message = sprintf(
			// translators: %1$s: site url, $2$s: text of what has updated.
			__( 'Howdy! Your site at %1$s has autoupdated %2$s.', 'jetpack-beta' ),
			home_url(),
			$what_updated
		);
		$message .= "\n\n";

		$what_changed = Utils::what_changed();
		if ( $what_changed ) {
			$message .= __( 'What changed?', 'jetpack-beta' );
			$message .= wp_strip_all_tags( $what_changed );
		}

		$message .= __( 'During the autoupdate the following happened:', 'jetpack-beta' );
		$message .= "\n\n";
		// Can only reference the About screen if their update was successful.
		$log      = array_map( 'html_entity_decode', $log );
		$message .= ' - ' . implode( "\n - ", $log );
		$message .= "\n\n";

		// Adds To test section. for PR's it's a PR description, for master/RC - it's a to_test.md file contents.
		$message .= Admin::to_test_content();
		$message .= "\n\n";

		wp_mail( $admin_email, $subject, $message );
	}

	/**
	 * This checks intends to fix errors in our build server when Jetpack.
	 *
	 * @param string $source        - Source path.
	 * @param string $remote_source - Remote path.
	 *
	 * @return WP_Error
	 */
	public static function check_for_main_files( $source, $remote_source ) {
		if ( $source === $remote_source . '/jetpack-dev/' ) {
			if ( ! file_exists( $source . 'jetpack.php' ) ) {
				return new WP_Error( 'plugin_file_does_not_exist', __( 'Main Plugin File does not exist', 'jetpack-beta' ) );
			}
			if ( ! file_exists( $source . '_inc/build/static.html' ) ) {
				return new WP_Error( 'static_admin_page_does_not_exist', __( 'Static Admin Page File does not exist', 'jetpack-beta' ) );
			}
			if ( ! file_exists( $source . '_inc/build/admin.js' ) ) {
				return new WP_Error( 'admin_page_does_not_exist', __( 'Admin Page File does not exist', 'jetpack-beta' ) );
			}
			// It has happened that sometimes a generated bundle from the master branch ends up with an empty
			// vendor directory. Used to be a problem in the beta building process.
			if ( Utils::is_dir_empty( $source . 'vendor' ) ) {
				return new WP_Error( 'vendor_dir_is_empty', __( 'The dependencies dir (vendor) is empty', 'jetpack-beta' ) );
			}
		}

		return $source;
	}

	/**
	 * Callback function to include Jetpack beta options into Jetpack sync whitelist.
	 *
	 * @param Array $whitelist List of whitelisted options to sync.
	 */
	public function add_to_options_whitelist( $whitelist ) {
		$whitelist[] = self::$option;
		$whitelist[] = self::$option_dev_installed;
		$whitelist[] = self::$option_autoupdate;
		$whitelist[] = self::$option_email_notif;
		return $whitelist;
	}

	/**
	 * Custom error handler to intercept errors and log them using Jetpack's own logger.
	 *
	 * @param int    $errno   - Error code.
	 * @param string $errstr  - Error message.
	 * @param string $errfile - File name where the error happened.
	 * @param int    $errline - Line in the code.
	 *
	 * @return bool Whether to make the default handler handle the error as well.
	 */
	public static function custom_error_handler( $errno, $errstr, $errfile, $errline ) {

		if ( class_exists( Jetpack::class ) && method_exists( Jetpack::class, 'log' ) ) {
			$error_string = sprintf( '%s, %s:%d', $errstr, $errfile, $errline );

			// Only adding to log if the message is related to Jetpack.
			if ( false !== stripos( $error_string, 'jetpack' ) ) {
				Jetpack::log( $errno, $error_string );
			}
		}

		/**
		 * The error_reporting call returns current error reporting level as an integer. Bitwise
		 * AND lets us determine whether the current error is included in the current error
		 * reporting level
		 */
		if ( ! ( error_reporting() & $errno ) ) { // phpcs:ignore WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_error_reporting,WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_error_reporting

			// If this error is not being reported in the current settings, stop reporting here by returning true.
			return true;
		}

		// Returning false makes the error go through the standard error handler as well.
		return false;
	}
}
