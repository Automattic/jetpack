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

		add_filter( 'plugin_action_links', array( $this, 'remove_activate_link' ), 10, 2 );
		add_filter( 'network_admin_plugin_action_links', array( $this, 'remove_activate_link' ), 10, 2 );

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
	 * Filter: Inject dev plugins into `update_plugins` transient.
	 *
	 * Filter for `pre_set_site_transient_update_plugins`.
	 *
	 * We need to somehow inject our dev plugins into the list of plugins needing update
	 * when an update is available. This is the way: catch the setting of the relevant
	 * transient and add them in.
	 *
	 * @param object $transient Plugin update data.
	 */
	public function maybe_plugins_update_transient( $transient ) {
		if ( ! isset( $transient->no_update ) ) {
			return $transient;
		}

		foreach ( Plugin::get_plugin_file_map() as $nondev => $dev ) {
			unset( $transient->response[ $dev ] );
			unset( $transient->no_update[ $dev ] );

			// If the dev version is active, populate it into the transient.
			if ( is_plugin_active( $dev ) ) {
				list( $response, $no_update ) = Plugin::get_plugin( dirname( $nondev ) )->dev_upgrader_response();
				if ( $response ) {
					$transient->response[ $dev ] = $response;
				}
				if ( $no_update ) {
					$transient->no_update[ $dev ] = $no_update;
				}
			}
		}

		return $transient;
	}

	/**
	 * Filter: Called after the upgraded package has been installed.
	 *
	 * Filter for `upgrader_post_install`.
	 *
	 * We need to preserve the dev_info data across the upgrade. We do that by having
	 * `maybe_plugins_update_transient()` include the info string in the transient, and
	 * then this hook writes it to the filesystem post-upgrade.
	 *
	 * @param bool  $worked Installation response.
	 * @param array $hook_extras Extra args passed to hooked filters.
	 * @param array $result Installation result data.
	 * @return bool|WP_Error
	 */
	public function upgrader_post_install( $worked, $hook_extras, $result ) {
		global $wp_filesystem;

		if ( ! isset( $hook_extras['plugin'] ) ) {
			return $worked;
		}

		$updates = get_plugin_updates();
		if ( isset( $updates[ $hook_extras['plugin'] ]->update->jpbeta_info ) ) {
			$info = $updates[ $hook_extras['plugin'] ]->update->jpbeta_info;
			$wp_filesystem->put_contents(
				$result['remote_destination'] . '/.jpbeta.json',
				wp_json_encode( $info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
			);
		}

		return $worked;
	}

	/**
	 * If `is_multisite()`, filter the active_plugins option to ensure we don't have both
	 * dev and non-dev versions of a plugin enabled at the same time (one network and one not).
	 */
	public static function is_network_enabled() {
		if ( is_multisite() ) {
			if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
				require_once ABSPATH . '/wp-admin/includes/plugin.php';
			}
			add_filter( 'option_active_plugins', array( self::class, 'override_active_plugins' ) );
		}
	}

	/**
	 * Filter: If a managed plugin is enabled sitewide, do not allow the other version to be enabled non-sitewide.
	 *
	 * Filter for `option_active_plugins`, only added when `is_multisite()`.
	 *
	 * @param array $active_plugins Currently activated plugins.
	 * @return array Updated array of active plugins.
	 */
	public static function override_active_plugins( $active_plugins ) {
		$remove = array();
		foreach ( Plugin::get_plugin_file_map() as $nondev => $dev ) {
			if ( is_plugin_active_for_network( $nondev ) || is_plugin_active_for_network( $dev ) ) {
				$remove[] = $nondev;
				$remove[] = $dev;
			}
		}
		if ( $remove ) {
			$active_plugins = array_values( array_diff( $active_plugins, $remove ) );
		}
		return $active_plugins;
	}

	/**
	 * Filter: Replace activate links in the other copy of our activated plugins.
	 *
	 * Filter for `plugin_action_links` and `network_admin_plugin_action_links`.
	 *
	 * @param string[] $actions Array of plugin action links.
	 * @param string   $plugin_file Plugin file.
	 * @return $actions
	 */
	public function remove_activate_link( $actions, $plugin_file ) {
		if ( isset( $actions['activate'] ) ) {
			$map  = Plugin::get_plugin_file_map();
			$map += array_flip( $map );
			if ( isset( $map[ $plugin_file ] ) && is_plugin_active( $map[ $plugin_file ] ) ) {
				$actions['activate'] = __( 'Plugin Already Active', 'jetpack-beta' );
			}
		}
		return $actions;
	}

	/**
	 * Filter: Hide duplicate entries in the Plugins list table.
	 *
	 * Filter for `all_plugins`.
	 *
	 * @param array $plugins Array of arrays of plugin data.
	 * @return array Updated array of plugin data.
	 */
	public function update_all_plugins( $plugins ) {
		foreach ( Plugin::get_plugin_file_map() as $nondev => $dev ) {
			// WP.com requests away show regular plugin.
			if ( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ) {
				// Ensure that it reports the version it's using on account of the Jetpack Beta plugin to Calypso.
				if ( is_plugin_active( $dev ) ) {
					$plugins[ $nondev ]['Version'] = $plugins[ $dev ]['Version'];
				}
				unset( $plugins[ $dev ] );
			} elseif ( is_plugin_active( $dev ) ) {
				unset( $plugins[ $nondev ] );
			} else {
				unset( $plugins[ $dev ] );
			}
		}
		return $plugins;
	}

	/**
	 * Filter: WordPress.org Plugins API results.
	 *
	 * Filter for `plugins_api`.
	 *
	 * As the dev plugins aren't in the WordPress Plugin Directory, we need to fake
	 * up records for them so the upgrader will know how to upgrade them.
	 *
	 * @param false|object|array $result Result from plugins_api.
	 * @param string             $action The type of information being requested from the Plugin Installation API.
	 * @param object             $args Plugin API arguments.
	 * @return false|object|array $result
	 */
	public function get_plugin_info( $result, $action, $args ) {
		// Check if this is a 'plugin_information' request for a '-dev' plugin.
		if ( 'plugin_information' !== $action || substr( $args->slug, -4 ) !== '-dev' ) {
			return $result;
		}

		// Get the plugin, and return a mocked-up API response.
		$plugin = Plugin::get_plugin( substr( $args->slug, 0, -4 ) );
		return $plugin ? $plugin->dev_plugins_api_response( $result ) : $result;
	}

	/**
	 * Activation hook.
	 */
	public static function activate() {
		// Don't do anyting funnly.
		if ( defined( 'DOING_CRON' ) ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		wp_clean_plugins_cache( true );
	}

	/**
	 * Deactivation hook.
	 */
	public static function deactivate() {
		// Don't do anyting funnly.
		if ( defined( 'DOING_CRON' ) ) {
			return;
		}

		$plugins = Plugin::get_all_plugins();
		add_action(
			'shutdown',
			static function () use ( $plugins ) {
				foreach ( $plugins as $plugin ) {
					$plugin->select_active( 'stable' );
				}
			},
			5
		);
		add_action(
			'shutdown',
			static function () use ( $plugins ) {
				self::remove_dev_plugins( $plugins );
			},
			20
		);

		self::clear_autoupdate_cron();
		Utils::delete_all_transiants();
		delete_option( 'jetpack_beta_plugin_file_map' );
	}

	/**
	 * When Jetpack Beta plugin is deactivated, remove any dev plugins.
	 *
	 * @param Plugin[] $plugins Plugins to remove.
	 */
	private static function remove_dev_plugins( array $plugins ) {
		// Don't do it on multisite, in case some other site still has it active.
		if ( is_multisite() ) {
			return;
		}

		// Initialize the WP_Filesystem API.
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

		// Delete dev plugin dirs.
		foreach ( $plugins as $plugin ) {
			$working_dir = WP_PLUGIN_DIR . '/' . $plugin->dev_plugin_slug();
			if ( $wp_filesystem->is_dir( $working_dir ) ) {
				$wp_filesystem->delete( $working_dir, true );
			}
		}
	}

	/**
	 * Action: Build the "Jetpack Beta" admin bar menu items.
	 *
	 * Action for `admin_bar_menu`.
	 */
	public function admin_bar_menu() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		// If no managed plugins are active, we don't want to display anything.
		$any = array();
		foreach ( Plugin::get_plugin_file_map() as $nondev => $dev ) {
			if ( is_plugin_active( $nondev ) || is_plugin_active( $dev ) ) {
				$any = true;
				break;
			}
		}
		if ( ! $any ) {
			return;
		}

		// Add the main menu.
		$args = array(
			'id'     => 'jetpack-beta_admin_bar',
			'title'  => 'Jetpack Beta',
			'parent' => 'top-secondary',
			'href'   => current_user_can( 'update_plugins' ) ? Utils::admin_url() : '',
		);
		$wp_admin_bar->add_node( $args );

		// Add child items for each active plugin.
		$any_dev = false;
		foreach ( Plugin::get_all_plugins() as $slug => $plugin ) {
			if ( is_plugin_active( $plugin->plugin_file() ) ) {
				$is_dev   = false;
				$version  = $plugin->stable_pretty_version();
				$dev_info = null;
			} elseif ( is_plugin_active( $plugin->dev_plugin_file() ) ) {
				$is_dev   = true;
				$any_dev  = true;
				$version  = $plugin->dev_pretty_version();
				$dev_info = $plugin->dev_info();
			} else {
				continue;
			}

			// Add a child item to our parent item.
			$args = array(
				'id'     => 'jetpack-beta_version_' . $slug,
				// translators: %1$s: Plugin name. %2$s: Text denoting the active version.
				'title'  => sprintf( __( '%1$s: %2$s', 'jetpack-beta' ), $plugin->get_name(), $version ),
				'parent' => 'jetpack-beta_admin_bar',
			);
			if ( $is_dev ) {
				$args['meta'] = array( 'class' => 'jpbeta-highlight' );
			}
			$wp_admin_bar->add_node( $args );

			if ( current_user_can( 'update_plugins' ) ) {
				$args = array(
					'id'     => 'jetpack-beta_version_' . $slug . '_manage',
					// translators: %1$s: Plugin name. %2$s: Text denoting the active version.
					'title'  => __( 'Manage', 'jetpack-beta' ),
					'parent' => 'jetpack-beta_version_' . $slug,
					'href'   => Utils::admin_url( array( 'plugin' => $slug ) ),
				);
				$wp_admin_bar->add_node( $args );
			}

			$args = array(
				'id'     => 'jetpack-beta_version_' . $slug . '_report',
				'title'  => __( 'Report Bug', 'jetpack-beta' ),
				'parent' => 'jetpack-beta_version_' . $slug,
				'href'   => $plugin->bug_report_url(),
			);
			$wp_admin_bar->add_node( $args );

			if ( $dev_info && $dev_info->plugin_url ) {
				$args = array(
					'id'     => 'jetpack-beta_version_' . $slug . '_moreinfo',
					'title'  => __( 'More Info ', 'jetpack-beta' ),
					'parent' => 'jetpack-beta_version_' . $slug,
					'href'   => $dev_info->plugin_url,
				);
				$wp_admin_bar->add_node( $args );
			}
		}

		// Highlight the menu if you are running the BETA Versions..
		if ( $any_dev ) {
			$wp_admin_bar->add_node(
				array(
					'id'   => 'jetpack-beta_admin_bar',
					'meta' => array( 'class' => 'jpbeta-highlight' ),
				)
			);
			// Use Jetpack Green 50 rather than 40 for accessibility, per pcdRpT-if-p2.
			echo "<style>#wpadminbar #wp-admin-bar-jetpack-beta_admin_bar.jpbeta-highlight, #wpadminbar #wp-admin-bar-jetpack-beta_admin_bar .jpbeta-highlight { background: #008710; }\n";
			echo '#wpadminbar #wp-admin-bar-jetpack-beta_admin_bar.jpbeta-highlight > .ab-item, #wpadminbar #wp-admin-bar-jetpack-beta_admin_bar .jpbeta-highlight > .ab-item { color: white; }</style>';
		}
	}

	/**
	 * Clear scheduled WP-Cron jobs on plugin deactivation.
	 */
	private static function clear_autoupdate_cron() {
		if ( ! is_main_site() ) {
			return;
		}
		wp_clear_scheduled_hook( 'jetpack_beta_autoupdate_hourly_cron' );

		if ( function_exists( 'wp_unschedule_hook' ) ) { // New in WP `4.9`.
			wp_unschedule_hook( 'jetpack_beta_autoupdate_hourly_cron' );
		}
	}

	/**
	 * Schedule plugin update jobs, if appropriate.
	 */
	public static function maybe_schedule_autoupdate() {
		if ( ! is_main_site() || ! Utils::is_set_to_autoupdate() ) {
			return;
		}
		$has_schedule_already = wp_get_schedule( 'jetpack_beta_autoupdate_hourly_cron' );
		if ( ! $has_schedule_already ) {
			wp_clear_scheduled_hook( 'jetpack_beta_autoupdate_hourly_cron' );
			wp_schedule_event( time(), 'hourly', 'jetpack_beta_autoupdate_hourly_cron' );
		}
	}

	/**
	 * The jetpack_beta_autoupdate_hourly_cron job - does not update Stable.
	 */
	public static function run_autoupdate() {
		if ( ! is_main_site() || ! Utils::is_set_to_autoupdate() ) {
			return;
		}

		$plugins = array_keys( Utils::plugins_needing_update() );
		if ( ! $plugins ) {
			return;
		}

		// Unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( Language_Pack_Upgrader::class, 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );

		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		$skin     = new WP_Ajax_Upgrader_Skin();
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

		$site_title = get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url();
		// translators: %s: The site title.
		$subject = sprintf( __( '[%s] Jetpack Beta Tester auto-updates', 'jetpack-beta' ), $site_title );

		$message = sprintf(
			// translators: %1$s: site url, $2$s: text of what has updated.
			__( 'Howdy! Your site at %1$s has autoupdated some plugins.', 'jetpack-beta' ),
			home_url()
		);
		$message .= "\n\n";

		// translators: %1$s: Plugin name. %2$s: pretty plugin version, %3$s: raw plugin version (eg 9.3.2-beta).
		$fmt = __( '%1$s updated to %2$s (%3$s)', 'jetpack-beta' );
		$fmt = " - $fmt\n";

		if ( in_array( JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php', $plugins, true ) ) {
			$file     = WP_PLUGIN_DIR . '/' . JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php';
			$tmp      = get_plugin_data( $file, false, false );
			$message .= sprintf(
				$fmt,
				'Jetpack Beta Tester',
				$tmp['Version'],
				$tmp['Version']
			);
		}

		foreach ( Plugin::get_all_plugins() as $plugin ) {
			if ( ! in_array( $plugin->dev_plugin_file(), $plugins, true ) ) {
				continue;
			}

			$file     = WP_PLUGIN_DIR . '/' . $plugin->dev_plugin_file();
			$tmp      = get_plugin_data( $file, false, false );
			$message .= sprintf(
				$fmt,
				$plugin->get_name(),
				$plugin->dev_pretty_version(),
				$tmp['Version']
			);

			$dev_info = $plugin->dev_info();
			if ( $dev_info && $dev_info->plugin_url ) {
				$message .= "   $dev_info->plugin_url\n";
			}
		}

		$message .= "\n";
		$message .= __( 'During the autoupdate the following happened:', 'jetpack-beta' );
		$message .= "\n\n";
		// Can only reference the About screen if their update was successful.
		$log      = array_map( 'html_entity_decode', $log );
		$message .= ' - ' . implode( "\n - ", $log );
		$message .= "\n\n";

		wp_mail( $admin_email, $subject, $message );
	}

	/**
	 * Callback function to include Jetpack beta options into Jetpack sync whitelist.
	 *
	 * @param Array $whitelist List of whitelisted options to sync.
	 */
	public function add_to_options_whitelist( $whitelist ) {
		$whitelist = array_merge( $whitelist, Utils::options_to_sync() );
		return $whitelist;
	}

	/**
	 * Custom error handler to intercept errors and log them using Jetpack's own logger.
	 *
	 * @param int    $errno   - Error code.
	 * @param string $errstr  - Error message.
	 * @param string $errfile - File name where the error happened.
	 * @param int    $errline - Line in the code.
	 * @return bool Whether to make the default handler handle the error as well.
	 */
	public static function custom_error_handler( $errno, $errstr, $errfile, $errline ) {
		if ( method_exists( Jetpack::class, 'log' ) ) {
			$error_string = sprintf( '%s, %s:%d', $errstr, $errfile, $errline );

			// Only adding to log if the message is related to Jetpack.
			if ( false !== stripos( $error_string, 'jetpack' ) ) {
				Jetpack::log( $errno, $error_string );
			}
		}

		// Returning false makes the error go through the standard error handler as well.
		return false;
	}
}
