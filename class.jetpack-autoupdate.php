<?php

// Update any plugins that have been flagged for automatic updates
class Jetpack_Autoupdate {

	private static $instance = null;
	protected $updates_allowed;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Autoupdate;
		}
		return self::$instance;
	}

	private function __construct() {
		$this->updates_allowed = Jetpack_Options::get_option( 'json_api_full_management', false );

		if ( $this->updates_allowed ) {
			add_filter( 'auto_update_plugin',  array( $this, 'autoupdate_plugin' ), 10, 2 );
			add_filter( 'auto_update_theme',   array( $this, 'autoupdate_theme' ), 10, 2 );
			add_filter( 'auto_update_core',    array( $this, 'autoupdate_core' ), 10, 2 );
		}

		/**
		 * Anytime WordPress saves update data, we'll want to update our Jetpack option as well.
		 */
		if ( is_main_site() ) {
			add_action( 'set_site_transient_update_plugins', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_themes', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_core', array( $this, 'save_update_data' ) );
		}

	}

	function autoupdate_plugin( $update, $item ) {
		$autoupdate_plugin_list = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		if ( in_array( $item->plugin, $autoupdate_plugin_list ) ) {
			return true;
		}

		return $update;
	}

	function autoupdate_theme( $update, $item ) {
		$autoupdate_theme_list = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		if ( in_array( $item->theme , $autoupdate_theme_list) ) {
			return true;
		}
		return $update;
	}

	function autoupdate_core( $update, $item ) {
		$autoupdate_core = Jetpack_Options::get_option( 'autoupdate_core', false );
		if ( $autoupdate_core ) {
			return $autoupdate_core;
		}
		return $update;
	}

	/**
	 * Calculates available updates and stores them to a Jetpack Option
	 * Update data is saved in the following schema:
	 *
	 * array (
	 *      'plugins' => (int) number of plugin updates available,
	 *      'themes' => (int) number of theme updates available,
	 *      'wordpress' => (int) number of wordpress core updates available,
	 *      'translations' => (int) number of translation updates available,
	 *      'total' => (int) total of all available updates,
	 *      'wp_version' => (string) the current version of WordPress that is running,
	 *      'wp_update_version' => (string) the latest available version of WordPress, only present if a WordPress update is needed
	 *      'site_is_version_controlled' => (bool) is the site under version control
	 * )
	 */
	function save_update_data() {
		global $wp_version;

		$update_data = wp_get_update_data();

		// stores the individual update counts as well as the total count
		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		// stores the current version of WordPress
		$updates['wp_version'] = $wp_version;

		// if we need to update WordPress core, let's find the latest version number
		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && $cur->response === 'upgrade' ) {
				$updates['wp_update_version'] = $cur->current;
			}
		}

		$updates['site_is_version_controlled'] = (bool) $this->is_version_controlled();
		Jetpack_Options::update_option( 'updates', $updates );
	}

	/**
	 * Finds out if a site is using a version control system.
	 * We'll store that information as a transient with a 24 expiration.
	 * We only need to check once per day.
	 *
	 * @return string ( '1' | '0' )
	 */
	function is_version_controlled() {
		$is_version_controlled = get_transient( 'jetpack_site_is_vcs' );

		if ( false === $is_version_controlled ) {
			include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			$updater = new WP_Automatic_Updater();
			$is_version_controlled  = strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
			// transients should not be empty
			if ( empty( $is_version_controlled ) ) {
				$is_version_controlled = '0';
			}
			set_transient( 'jetpack_site_is_vcs', $is_version_controlled, DAY_IN_SECONDS );
		}

		return $is_version_controlled;
	}
}
Jetpack_Autoupdate::init();