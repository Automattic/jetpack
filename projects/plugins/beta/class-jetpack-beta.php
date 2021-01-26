<?php
/**
 * Primary class file for the Jetpack Beta plugin.
 *
 * @package Jetpack Beta
 */

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_Beta
 */
class Jetpack_Beta {

	/**
	 * Singleton Jetpack_Beta class instance.
	 *
	 * @var Jetpack_Beta
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

		add_action( 'jetpack_beta_autoupdate_hourly_cron', array( 'Jetpack_Beta', 'run_autoupdate' ) );

		add_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );

		if ( is_admin() ) {
			require JPBETA__PLUGIN_DIR . 'class-jetpack-beta-admin.php';
			self::maybe_schedule_autoupdate();
			Jetpack_Beta_Admin::init();
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
			list( $branch, $section ) = self::get_branch_and_section_dev();
			if ( self::should_update_dev_to_master() ) {
				list( $branch, $section ) = array( 'master', 'master' );
			}
			update_option( self::$option_dev_installed, array( $branch, $section, self::get_manifest_data( $branch, $section ) ) );
		}
	}

	/**
	 * If Jetpack or JP Dev plugin is network activated, update active_plugins option.
	 */
	public static function is_network_enabled() {
		if ( self::is_network_active() ) {
			add_filter( 'option_active_plugins', array( 'Jetpack_Beta', 'override_active_plugins' ) );
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
			if ( ! self::is_jetpack_plugin( $active_plugin ) ) {
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
		if ( ! self::is_jetpack_plugin( $plugin ) ) {
			return;
		}

		delete_option( self::$option );
	}

	/**
	 * Checks if passed plugin matches JP or JP Dev paths.
	 *
	 * @param string $plugin - A plugin path.
	 */
	public static function is_jetpack_plugin( $plugin ) {
		return in_array( $plugin, array( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE ), true );
	}

	/**
	 * Filter JP Dev plugin action links.
	 *
	 * @param array $actions - Array of plugin action links.
	 */
	public function remove_activate_dev( $actions ) {
		if ( is_plugin_active( JETPACK_PLUGIN_FILE ) || self::is_network_active() ) {
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
		if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) || self::is_network_active() ) {
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
		$dev_data     = self::get_dev_installed();
		if ( isset( $dev_data[2] ) ) {
			$update_date  = $dev_data[2]->update_date;
			$download_zip = $dev_data[2]->download_url;
		}
		// Update tags.
		$response->slug          = JETPACK_DEV_PLUGIN_SLUG;
		$response->plugin        = JETPACK_DEV_PLUGIN_SLUG;
		$response->name          = 'Jetpack | ' . self::get_jetpack_plugin_pretty_version( true );
		$response->plugin_name   = 'Jetpack | ' . self::get_jetpack_plugin_pretty_version( true );
		$response->version       = self::get_jetpack_plugin_version( true );
		$response->author        = 'Automattic';
		$response->homepage      = 'https://jetpack.com/contact-support/beta-group/';
		$response->downloaded    = false;
		$response->last_updated  = $update_date;
		$response->sections      = array( 'description' => Jetpack_Beta_Admin::to_test_content() );
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
	 * Returns active Jetpack plugin file partial path string (jetpack/jetpack.php|jetpack-dev/jetpack.php).
	 */
	public static function get_plugin_file() {
		return self::get_plugin_slug() . '/jetpack.php';
	}

	/**
	 * Returns active plugin slug string (jetpack|jetpack-dev).
	 */
	public static function get_plugin_slug() {
		$installed = self::get_branch_and_section();
		if ( empty( $installed ) || 'stable' === $installed[1] || 'tags' === $installed[1] ) {
			return 'jetpack';
		}
		return JETPACK_DEV_PLUGIN_SLUG;
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
		self::delete_all_transiants();
		add_action( 'shutdown', array( __CLASS__, 'switch_active' ), 5 );
		add_action( 'shutdown', array( __CLASS__, 'remove_dev_plugin' ), 20 );
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
	 * Builds URL to the admin area for the current site and specified query param.
	 *
	 * @param string $query - Path relative to the admin URL.
	 */
	public static function admin_url( $query = '?page=jetpack-beta' ) {
		return ( self::is_network_active() )
		? network_admin_url( 'admin.php' . $query )
		: admin_url( 'admin.php' . $query );
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
		if ( ! self::get_option() ) {
			return;
		}

		$args = array(
			'id'     => 'jetpack-beta_admin_bar',
			'title'  => 'Jetpack Beta',
			'parent' => 'top-secondary',
			'href'   => current_user_can( 'update_plugins' ) ? self::admin_url() : '',
		);
		$wp_admin_bar->add_node( $args );

		// Add a child item to our parent item.
		$args = array(
			'id'     => 'jetpack-beta_version',
			// translators: %s: active Jetpack plugin branch/tag.
			'title'  => sprintf( __( 'Running %s', 'jetpack-beta' ), self::get_jetpack_plugin_pretty_version() ),
			'parent' => 'jetpack-beta_admin_bar',
		);

		$wp_admin_bar->add_node( $args );

		if ( self::get_plugin_slug() === JETPACK_DEV_PLUGIN_SLUG ) {
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

		list( $branch, $section ) = self::get_branch_and_section();
		if ( 'pr' === $section ) {
			$args = array(
				'id'     => 'jetpack-beta_report_more_info',
				'title'  => __( 'More Info ', 'jetpack-beta' ),
				'href'   => self::get_url( $branch, $section ),
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
		if ( self::is_on_stable() ) {
			return $transient;
		}

		// Lets always grab the latest.
		delete_site_transient( 'jetpack_beta_manifest' );

		// Check if there is a new version.
		if ( self::should_update_dev_to_master() ) {
			// If response is false, don't alter the transient.
			$transient->response[ JETPACK_DEV_PLUGIN_FILE ] = self::get_jepack_dev_master_update_response();
			// Unset the that it doesn't need an update.
			unset( $transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] );
		} elseif ( self::should_update_dev_version() ) {
			// If response is false, don't alter the transient.
			$transient->response[ JETPACK_DEV_PLUGIN_FILE ] = self::get_jepack_dev_update_response();
			// Unset the that it doesn't need an update.
			unset( $transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] );
		} else {
			unset( $transient->response[ JETPACK_DEV_PLUGIN_FILE ] );
			if ( isset( $transient->no_update ) ) {
				$transient->no_update[ JETPACK_DEV_PLUGIN_FILE ] = self::get_jepack_dev_update_response();
			}
		}

		return $transient;
	}

	/**
	 * Determine if JP dev version should be updated.
	 */
	public static function should_update_dev_version() {
		return version_compare( self::get_new_jetpack_version( true ), self::get_jetpack_plugin_version( true ), '>' );
	}

	/**
	 * Build plugin update data response for dev plugin.
	 */
	public static function get_jepack_dev_update_response() {
		$response              = new stdClass();
		$response->id          = JETPACK_DEV_PLUGIN_SLUG;
		$response->plugin      = JETPACK_DEV_PLUGIN_SLUG;
		$response->new_version = self::get_new_jetpack_version( true );
		$response->slug        = JETPACK_DEV_PLUGIN_SLUG;
		$response->url         = self::get_url_dev();
		$response->package     = self::get_install_url_dev();
		return $response;
	}

	/**
	 * Build plugin update data response for JP dev master.
	 */
	public static function get_jepack_dev_master_update_response() {
		$response = self::get_jepack_dev_update_response();

		$master_manifest       = self::get_manifest_data( 'master', 'master' );
		$response->new_version = $master_manifest->version;
		$response->url         = self::get_url( 'master', 'master' );
		$response->package     = $master_manifest->download_url;
		return $response;
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
	 * Get the active JP or JP Dev plugin version.
	 *
	 * @param bool $is_dev_version - If dev plugin version is being queried.
	 *
	 * @return string|0 Plugin version.
	 */
	public static function get_jetpack_plugin_version( $is_dev_version = false ) {
		if ( $is_dev_version ) {
			$info = self::get_jetpack_plugin_info_dev();
		} else {
			$info = self::get_jetpack_plugin_info();
		}

		return isset( $info['Version'] ) ? $info['Version'] : 0;
	}

	/**
	 * Get WP Option: jetpack_beta_active
	 */
	public static function get_option() {
		return get_option( self::$option );
	}

	/**
	 * Get WP Option: jetpack_beta_dev_currently_installed
	 */
	public static function get_dev_installed() {
		return get_option( self::$option_dev_installed );
	}

	/**
	 * Get active Jetpack branch/section.
	 */
	public static function get_branch_and_section() {
		$option = (array) self::get_option();
		if ( false === $option[0] ) {
			// See if the Jetpack plugin is enabled.
			if ( is_plugin_active( JETPACK_PLUGIN_FILE ) ) {
				return array( 'stable', 'stable' );
			}
			return array( false, false );
		}
		// Branch and section.
		return $option;
	}

	/**
	 * Check if Jetpack version is 'stable' version.
	 */
	public static function is_on_stable() {
		$branch_and_section = self::get_branch_and_section();
		if ( empty( $branch_and_section[0] ) || 'stable' === $branch_and_section[0] ) {
			return true;
		}
		return false;
	}

	/**
	 * Check if Jetpack active version is a tag version.
	 */
	public static function is_on_tag() {
		$option = (array) self::get_option();
		if ( isset( $option[1] ) && 'tags' === $option[1] ) {
			return true;
		}
		return false;
	}

	/**
	 * Get active Jetpack Dev branch/section.
	 */
	public static function get_branch_and_section_dev() {
		$option = (array) self::get_dev_installed();
		if ( false !== $option[0] && isset( $option[1] ) ) {
			return array( $option[0], $option[1] );
		}
		if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) ) {
			return array( 'stable', 'stable' );
		}
		return array( false, false );
	}

	/**
	 * Massage JP plugin version string.
	 *
	 * @param bool $is_dev_version - If JP Dev version is being queried.
	 */
	public static function get_jetpack_plugin_pretty_version( $is_dev_version = false ) {
		if ( $is_dev_version ) {
			list( $branch, $section ) = self::get_branch_and_section_dev();
		} else {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( ! $section ) {
			return '';
		}

		if ( 'master' === $section ) {
			return 'Bleeding Edge';
		}

		if ( 'stable' === $section ) {
			return 'Latest Stable';
		}

		if ( 'tags' === $section ) {
			return sprintf(
				// translators: %1$s: a tagged Jetpack plugin version.
				__( 'Public release (<a href="https://plugins.trac.wordpress.org/browser/jetpack/tags/%1$s" target="_blank" rel="noopener noreferrer">available on WordPress.org</a>)', 'jetpack-beta' ),
				esc_attr( $branch )
			);
		}

		if ( 'rc' === $section ) {
			return 'Release Candidate';
		}

		if ( 'pr' === $section ) {
			$branch = str_replace( '-', ' ', $branch );
			return 'Feature Branch: ' . str_replace( '_', ' / ', $branch );
		}

		return self::get_jetpack_plugin_version();
	}

	/**
	 * Fetch latest Jetpack version.
	 *
	 * @param bool $is_dev_version - If JP Dev version is being queried.
	 */
	public static function get_new_jetpack_version( $is_dev_version = false ) {
		$manifest = self::get_beta_manifest();
		if ( $is_dev_version ) {
			list( $branch, $section ) = self::get_branch_and_section_dev();
		} else {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'master' === $section && isset( $manifest->{$section}->version ) ) {
			return $manifest->{$section}->version;
		}

		if ( 'rc' === $section && isset( $manifest->{$section}->version ) ) {
			return $manifest->{$section}->version;
		}

		if ( isset( $manifest->{$section} ) &&
		isset( $manifest->{$section}->{$branch} ) &&
		isset( $manifest->{$section}->{$branch}->version )
		) {
			return $manifest->{$section}->{$branch}->version;
		}
		return 0;
	}

	/**
	 * Get JP Dev plugin repo URL.
	 */
	public static function get_url_dev() {
		list( $branch, $section ) = self::get_branch_and_section_dev();
		return self::get_url( $branch, $section );
	}

	/**
	 * Get JP plugin repo URL.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_url( $branch = null, $section = null ) {
		if ( is_null( $section ) ) {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'master' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/master-build';
		}

		if ( 'rc' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/' . $section . '-build';
		}

		if ( 'pr' === $section ) {
			$manifest = self::get_beta_manifest();
			return isset( $manifest->{$section}->{$branch}->pr )
			? JETPACK_GITHUB_URL . '/pull/' . $manifest->{$section}->{$branch}->pr
			: JETPACK_DEFAULT_URL;
		}
		return JETPACK_DEFAULT_URL;
	}

	/**
	 * Get install URL for JP dev.
	 */
	public static function get_install_url_dev() {
		list( $branch, $section ) = self::get_branch_and_section_dev();
		return self::get_install_url( $branch, $section );
	}

	/**
	 * Get install URL for JP.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_install_url( $branch = null, $section = null ) {
		if ( is_null( $section ) ) {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'stable' === $section ) {
			$org_data = self::get_org_data();
			return $org_data->download_link;
		} elseif ( 'tags' === $section ) {
			$org_data = self::get_org_data();
			return $org_data->versions->{$branch} ? $org_data->versions->{$branch} : false;
		}
		$manifest = self::get_beta_manifest( true );

		if ( 'master' === $section && isset( $manifest->{$section}->download_url ) ) {
			return $manifest->{$section}->download_url;
		}

		if ( 'rc' === $section ) {
			if ( isset( $manifest->{$section}->download_url ) ) {
				return $manifest->{$section}->download_url;
			}
			$branches = array_keys( (array) $manifest->{$section} );
			foreach ( $branches as $branch ) {
				if ( isset( $manifest->{$section}->{$branch}->download_url ) ) {
					return $manifest->{$section}->{$branch}->download_url;
				}
			}
			return null;
		}

		if ( isset( $manifest->{$section}->{$branch}->download_url ) ) {
			return $manifest->{$section}->{$branch}->download_url;
		}
		return null;
	}

	/**
	 * Get stable JP version plugin data.
	 */
	public static function get_jetpack_plugin_info_stable() {
		return self::get_jetpack_plugin_info( JETPACK_PLUGIN_FILE );
	}

	/**
	 * Get dev JP version plugin data.
	 */
	public static function get_jetpack_plugin_info_dev() {
		return self::get_jetpack_plugin_info( JETPACK_DEV_PLUGIN_FILE );
	}

	/**
	 * Get JP plugin data.
	 *
	 * @param mixed $plugin_file - JP or JP Dev plugin path.
	 */
	public static function get_jetpack_plugin_info( $plugin_file = null ) {

		if ( is_null( $plugin_file ) ) {
			$plugin_file = self::get_plugin_file();
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugin_file_path = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_file;

		if ( file_exists( $plugin_file_path ) ) {
			return get_plugin_data( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_file );
		}

		return null;
	}

	/**
	 * Switch active JP plugin version when JP Beta plugin is deactivated.
	 * This needs to happen on `shutdown`, otherwise it doesn't work.
	 */
	public static function switch_active() {
		self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE );
	}

	/**
	 * Fetch the Jetpack beta manifest.
	 *
	 * @param bool $force_refresh - Whether to bypass cached response.
	 */
	public static function get_beta_manifest( $force_refresh = false ) {
		return self::get_remote_data( JETPACK_BETA_MANIFEST_URL, 'manifest', $force_refresh );
	}

	/**
	 * Fetch WordPress.org Jetpack plugin info.
	 */
	public static function get_org_data() {
		return self::get_remote_data( JETPACK_ORG_API_URL, 'org_data' );
	}

	/**
	 * Helper function used to fetch remote data from WordPress.org, GitHub, and betadownload.jetpack.me
	 *
	 * @param string $url       - Url being fetched.
	 * @param string $transient - Transient name (manifest|org_data|github_commits_).
	 * @param bool   $bypass    - Whether to bypass cached response.
	 */
	public static function get_remote_data( $url, $transient, $bypass = false ) {
		$prefix = 'jetpack_beta_';
		$cache  = get_site_transient( $prefix . $transient );
		if ( $cache && ! $bypass ) {
			return $cache;
		}

		$remote_manifest = wp_remote_get( $url );

		if ( is_wp_error( $remote_manifest ) ) {
			return false;
		}

		$cache = json_decode( wp_remote_retrieve_body( $remote_manifest ) );
		set_site_transient( $prefix . $transient, $cache, MINUTE_IN_SECONDS * 15 );

		return $cache;
	}

	/**
	 * Delete set transients when plugin is deactivated.
	 */
	public static function delete_all_transiants() {
		$prefix = 'jetpack_beta_';

		delete_site_transient( $prefix . 'org_data' );
		delete_site_transient( $prefix . 'manifest' );

		delete_site_transient( Jetpack_Beta_Autoupdate_Self::TRANSIENT_NAME );

	}

	/**
	 * Install & activate JP for the given branch/section.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function install_and_activate( $branch, $section ) {
		// Cleanup previous version of the beta plugin.
		if ( file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack-pressable-beta' ) ) {
			// Delete the Jetpack dev plugin.
			require_once ABSPATH . 'wp-admin/includes/file.php';
			$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
			if ( ! WP_Filesystem( $creds ) ) {
				// Any problems and we exit.
				return new WP_error( 'Filesystem Problem' );
			}
			global $wp_filesystem;
			if ( ! $wp_filesystem ) {
				return new WP_error( '$wp_filesystem is not global' );
			}

			$working_dir = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack-pressable-beta';
			// Delete the folder `JETPACK_BETA_PLUGIN_FOLDER`.
			if ( $wp_filesystem->is_dir( $working_dir ) ) {
				$wp_filesystem->delete( $working_dir, true );
			}
			// Deactivate the plugin.
			self::replace_active_plugin( 'jetpack-pressable-beta/jetpack.php' );
		}

		if ( 'stable' === $section &&
		file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_PLUGIN_FILE ) ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );
			self::update_option( $branch, $section );
			return;
		}

		if ( self::get_branch_and_section_dev() === array( $branch, $section )
		&& file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_DEV_PLUGIN_FILE ) ) {
			self::replace_active_plugin( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE, true );
			self::update_option( $branch, $section );
			return;
		}

		self::proceed_to_install_and_activate(
			self::get_install_url( $branch, $section ),
			self::get_plugin_slug( $section ),
			$section
		);
		self::update_option( $branch, $section );
	}

	/**
	 * Update to the latest version.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function update_plugin( $branch, $section ) {
		self::proceed_to_install(
			self::get_install_url( $branch, $section ),
			self::get_plugin_slug( $section ),
			$section
		);

		if ( 'stable' !== $section ) {
			update_option( self::$option_dev_installed, array( $branch, $section, self::get_manifest_data( $branch, $section ) ) );
		}
	}

	/**
	 * Helper function to update installed version option.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function update_option( $branch, $section ) {
		if ( 'stable' !== $section ) {
			update_option( self::$option_dev_installed, array( $branch, $section, self::get_manifest_data( $branch, $section ) ) );
		}
		update_option( self::$option, array( $branch, $section ) );
	}

	/**
	 * Return manifest info for specififed branch/section.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_manifest_data( $branch, $section ) {
		$installed             = get_option( self::$option_dev_installed );
		$current_manifest_data = isset( $installed[2] ) ? $installed[2] : false;

		$manifest_data = self::get_beta_manifest();

		if ( ! isset( $manifest_data->{$section} ) ) {
			return $current_manifest_data;
		}

		if ( 'master' === $section ) {
			return $manifest_data->{$section};
		}

		if ( 'rc' === $section ) {
			return $manifest_data->{$section};
		}

		if ( isset( $manifest_data->{$section}->{$branch} ) ) {
			return $manifest_data->{$section}->{$branch};
		}

		return $current_manifest_data;
	}

	/**
	 * Install specified plugin version.
	 *
	 * @param string $url           - Url for plugin version.
	 * @param string $plugin_folder - Path JP or JP Dev plugin folder.
	 * @param string $section       - Section.
	 */
	public static function proceed_to_install_and_activate( $url, $plugin_folder, $section ) {
		self::proceed_to_install( $url, $plugin_folder, $section );

		if ( 'stable' === $section || 'tags' === $section ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );
		} else {
			self::replace_active_plugin( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE, true );
		}
	}

	/**
	 * Download plugin files.
	 *
	 * @param string $url           - Url for plugin version.
	 * @param string $plugin_folder - Path JP or JP Dev plugin folder.
	 * @param string $section       - Section.
	 */
	public static function proceed_to_install( $url, $plugin_folder, $section ) {
		$temp_path = download_url( $url );

		if ( is_wp_error( $temp_path ) ) {
			// translators: %1$s: download url, %2$s: error message.
			wp_die( wp_kses_post( sprintf( __( 'Error Downloading: <a href="%1$s">%1$s</a> - Error: %2$s', 'jetpack-beta' ), $url, $temp_path->get_error_message() ) ) );
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		/* initialize the API */
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			wp_die( esc_html( __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) ) );
		}

		global $wp_filesystem;
		if ( 'stable' === $section || 'tags' === $section ) {
			$plugin_path = WP_PLUGIN_DIR;
		} else {
			$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
		}

		$result = unzip_file( $temp_path, $plugin_path );

		if ( is_wp_error( $result ) ) {
			// translators: %1$s: error message.
			wp_die( esc_html( sprintf( __( 'Error Unziping file: Error: %1$s', 'jetpack-beta' ), $result->get_error_message() ) ) );
		}
	}

	/**
	 * Check if plugin is network activated.
	 */
	public static function is_network_active() {
		if ( ! is_multisite() ) {
			return false;
		}

		if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
			return false;
		}

		if ( is_plugin_active_for_network( JETPACK_PLUGIN_FILE ) || is_plugin_active_for_network( JETPACK_DEV_PLUGIN_FILE ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Swap plugin files.
	 *
	 * @param string $current_plugin      - Current plugin path.
	 * @param string $replace_with_plugin - Plugin path to replace with.
	 * @param bool   $force_activate      - Whether to force activate plguin.
	 */
	public static function replace_active_plugin( $current_plugin, $replace_with_plugin = null, $force_activate = false ) {
		// The autoloader sets the cache in a shutdown hook. Clear it after the autoloader sets it.
		add_action( 'shutdown', array( __CLASS__, 'clear_autoloader_plugin_cache' ), 99 );

		if ( self::is_network_active() ) {
			$new_active_plugins     = array();
			$network_active_plugins = get_site_option( 'active_sitewide_plugins' );
			foreach ( $network_active_plugins as $plugin => $date ) {
				$key                        = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
				$new_active_plugins[ $key ] = $date;
			}
			update_site_option( 'active_sitewide_plugins', $new_active_plugins );
			return;
		}

		$active_plugins     = (array) get_option( 'active_plugins', array() );
		$new_active_plugins = array();

		if ( empty( $replace_with_plugin ) ) {
			$new_active_plugins = array_diff( $active_plugins, array( $current_plugin ) );
		} else {
			foreach ( $active_plugins as $plugin ) {
				$new_active_plugins[] = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
			}
		}

		if ( $force_activate && ! in_array( $replace_with_plugin, $new_active_plugins, true ) ) {
			$new_active_plugins[] = $replace_with_plugin;
		}
		update_option( 'active_plugins', $new_active_plugins );
	}

	/**
	 * Check if `stable` should be updated.
	 *
	 * @return bool
	 */
	public static function should_update_stable_version() {
		// Pressable Jetpack version is manage via Pressable.
		if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
			return false;
		}
		// Check if we are Jetpack plugin is installed via git.
		if ( file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack/.git' ) ) {
			return false;
		}

		// Check if running a tag directly from svn.
		if ( self::is_on_tag() ) {
			return false;
		}

		$updates = get_site_transient( 'update_plugins' );

		if ( isset( $updates->response, $updates->response[ JETPACK_PLUGIN_FILE ] ) ) {
			return true;
		}
		$org_data    = self::get_org_data();
		$plugin_data = self::get_jetpack_plugin_info_stable();

		return ( isset( $plugin_data['Version'], $org_data->version )
			&& $org_data->version !== $plugin_data['Version'] );
	}

	/**
	 * Here we are checking if the DEV branch that we are currenly on is not something that is available in the manifest
	 * Meaning that the DEV branch was merged into master and so we need to update it.
	 *
	 * @return bool
	 */
	public static function should_update_dev_to_master() {
		list( $branch, $section ) = self::get_branch_and_section_dev();

		if ( false === $branch || 'master' === $section || 'rc' === $section || 'tags' === $section ) {
			return false;
		}
		$manifest = self::get_beta_manifest();
		return ! isset( $manifest->{$section}->{$branch} );
	}

	/**
	 * Get WP Option: jp_beta_autoupdate
	 */
	public static function is_set_to_autoupdate() {
		return get_option( self::$option_autoupdate, false );
	}

	/**
	 * Get WP Option: jp_beta_email_notifications
	 */
	public static function is_set_to_email_notifications() {
		return get_option( self::$option_email_notif, true );
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
		if ( ! self::is_set_to_autoupdate() ) {
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
	 * Get "What changed" info for display.
	 *
	 * @return string|false
	 */
	public static function what_changed() {
		$commit = self::get_version_commit();
		if ( $commit ) {
			$html        = '';
			$commit_data = self::get_commit_data_from_github( $commit );
			if ( isset( $commit_data->commit->message ) ) {
				$html .= sprintf(
					__( "\n %1\$s \n\n[Commit](%2\$s)", 'jetpack-beta' ),
					esc_html( $commit_data->commit->message ),
					esc_url( $commit_data->html_url )
				);
				"\n\n";
			}
			if ( ! empty( $commit_data->files ) ) {
				$html .= "\n\n";
				// translators: %d: number of files changed.
				$html .= sprintf( _n( '%d file changed ', '%d files changed', count( $commit_data->files ), 'jetpack-beta' ) );
				$html .= "\n";
				foreach ( $commit_data->files as $file ) {
					$added_deleted_changed = array();
					if ( $file->additions ) {
						$added_deleted_changed[] = '+' . $file->additions;
					}
					if ( $file->deletions ) {
						$added_deleted_changed[] = '-' . $file->deletions;
					}
					$html .= sprintf( "- %s ... (%s %s) \n", esc_html( $file->filename ), esc_html( $file->status ), implode( ' ', $added_deleted_changed ) );
				}
				$html .= "\n\n";
			}
			if ( ! empty( $html ) ) {
				return $html;
			}
		}
		return false;
	}

	/**
	 * Get version commit if available.
	 *
	 * @return string|false
	 */
	public static function get_version_commit() {
		$split_version = explode( '-', self::get_jetpack_plugin_version() );
		if ( isset( $split_version[3] ) ) {
			return $split_version[3];
		}
		return false;
	}

	/**
	 * Fetch commit data from GitHub.
	 *
	 * @param string $commit - The commit to fetch.
	 */
	public static function get_commit_data_from_github( $commit ) {
		return self::get_remote_data( JETPACK_GITHUB_API_URL . 'commits/' . $commit, 'github_commits_' . $commit );
	}

	/**
	 * The jetpack_beta_autoupdate_hourly_cron job.
	 */
	public static function run_autoupdate() {
		if ( ! self::is_set_to_autoupdate() ) {
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
		! self::is_on_stable() &&
		( self::should_update_dev_to_master() || self::should_update_dev_version() )
		) {
			add_filter( 'upgrader_source_selection', array( 'Jetpack_Beta', 'check_for_main_files' ), 10, 2 );

			// If response is false, don't alter the transient.
			$plugins[] = JETPACK_DEV_PLUGIN_FILE;
		}
		$autupdate = Jetpack_Beta_Autoupdate_Self::instance();
		if ( $autupdate->has_never_version() ) {
			$plugins[] = JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php';
		}

		if ( empty( $plugins ) ) {
			return;
		}

		// Unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
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

		if ( $result && ! defined( 'JETPACK_BETA_SKIP_EMAIL' ) && self::is_set_to_email_notifications() ) {
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

		// In case the code is called in a scope different from wp-admin.
		require_once JPBETA__PLUGIN_DIR . 'class-jetpack-beta-admin.php';

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
				self::get_jetpack_plugin_pretty_version()
			);

			$what_updated = sprintf(
				// translators: $1$s: pretty plugin version, $2$s: raw plugin version (eg 9.3.2-beta).
				__( 'Jetpack %1$s (%2$s)', 'jetpack-beta' ),
				self::get_jetpack_plugin_pretty_version(),
				self::get_jetpack_plugin_version()
			);

			if ( count( $plugins ) > 1 ) {
				$subject = sprintf(
					// translators: %1$s: site title, %2$s: pretty plugin version.
					__( '[%1$s] Autoupdated Jetpack %2$s and the Jetpack Beta Tester', 'jetpack-beta' ),
					$site_title,
					self::get_jetpack_plugin_pretty_version()
				);

				$what_updated = sprintf(
					// translators: $1$s: pretty plugin version, $2$s: raw plugin version.
					__( 'Jetpack %1$s (%2$s) and the Jetpack Beta Tester', 'jetpack-beta' ),
					self::get_jetpack_plugin_pretty_version(),
					self::get_jetpack_plugin_version()
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

		$what_changed = self::what_changed();
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
		$message .= Jetpack_Beta_Admin::to_test_content();
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
			if ( self::is_dir_empty( $source . 'vendor' ) ) {
				return new WP_Error( 'vendor_dir_is_empty', __( 'The dependencies dir (vendor) is empty', 'jetpack-beta' ) );
			}
		}

		return $source;
	}

	/**
	 * Checks if a dir is empty.
	 *
	 * @param [type] $dir The absolute directory path to check.
	 * @return boolean
	 */
	public static function is_dir_empty( $dir ) {
		return ( count( scandir( $dir ) ) === 2 );
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

		if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'log' ) ) {
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

	/**
	 * Clears the autoloader transient.
	 */
	public static function clear_autoloader_plugin_cache() {
		delete_transient( 'jetpack_autoloader_plugin_paths' );
	}
}
