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
		 * Anytime WordPress saves update data, we'll want to update our jetpack option as well
		 */
		if ( is_main_site() ) {
			add_filter( 'wp_get_update_data', array( $this, 'save_update_data' ), 10, 1 );
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
	 * Filter for wp_get_update_data that doesn't actually filter anything
	 * Used to save a Jetpack_Option when ever new updates are detected
	 *
	 */
	function save_update_data( $update_data ) {
		global $wp_version;

		// If we are not on the main site, no need to save.
		if ( ! is_main_site() ) {
			return $update_data;
		}

		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		$updates['wp_version'] = isset( $wp_version ) ? $wp_version : null;

		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && $cur->response === 'upgrade' ) {
				$updates['wp_update_version'] = $cur->current;
			}
		}

		$updates['site_is_vcs'] = (bool) $this->is_vcs();
		Jetpack_Options::update_option( 'updates', $updates );
		return $update_data;
	}

	/**
	 * Finds out if a site is using a version control system.
	 * We'll store that information as a transient with a 24 expiration.
	 * We only need to check once per day.
	 *
	 * @return string ( '1' | '0' )
	 */
	function is_vcs() {
		$is_vcs = get_transient( 'jetpack_site_is_vcs' );

		if ( false === $is_vcs ) {
			include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			$updater = new WP_Automatic_Updater();
			$is_vcs  = strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
			// transients should not be empty
			if ( empty( $is_vcs ) ) {
				$is_vcs = '0';
			}
			set_transient( 'jetpack_site_is_vcs', $is_vcs, DAY_IN_SECONDS );
		}

		return $is_vcs;
	}
}
Jetpack_Autoupdate::init();