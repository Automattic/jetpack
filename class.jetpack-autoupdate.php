<?php

/**
 * Handles items that have been selected for automatic updates.
 * Hooks into WP_Automatic_Updater
 */
class Jetpack_Autoupdate {

	public $updates_allowed;
	public $jetpack;
	public $autoupdate_results;
	public $is_updating = false;

	public $autoupdate_expected = array(
		'plugin'=> array(),
		'theme' => array(),
	);

	public $log = array(
		'plugin' => array(),
		'theme' => array(),
	);

	private static $instance = null;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Autoupdate;
		}
		return self::$instance;
	}

	private function __construct() {
		$this->updates_allowed = Jetpack::is_module_active( 'manage' );

		// Only run automatic updates if a user as opted in by activating the manage module.
		if ( $this->updates_allowed ) {
			add_filter( 'auto_update_plugin',  array( $this, 'autoupdate_plugin' ), 10, 2 );
			add_filter( 'auto_update_theme',   array( $this, 'autoupdate_theme' ), 10, 2 );
			add_filter( 'auto_update_core',    array( $this, 'autoupdate_core' ), 10, 2 );
			add_action( 'automatic_updates_complete', array( $this, 'automatic_updates_complete' ), 10, 1 );
			add_action( 'shutdown', array( $this, 'log_results' ) );
		}

		// Anytime WordPress saves update data, we'll want to update our Jetpack option as well.
		if ( is_main_site() ) {
			add_action( 'set_site_transient_update_plugins', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_themes', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_core', array( $this, 'save_update_data' ) );
		}

	}

	function autoupdate_plugin( $update, $item ) {
		$autoupdate_plugin_list = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		if ( in_array( $item->plugin, $autoupdate_plugin_list ) ) {
			$this->expect( $item->plugin );
 			return true;
		}

		return $update;
	}

	function autoupdate_theme( $update, $item ) {
		$autoupdate_theme_list = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		if ( in_array( $item->theme , $autoupdate_theme_list) ) {
			$this->expect( $item->theme, $type = 'theme' );
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
	 * Stores the an item identifier to the autoupdate_expected array.
	 *
	 * @param string $item  Example: 'jetpack/jetpack.php' for type 'plugin' or 'twentyfifteen' for type 'theme'
	 * @param string $type 'plugin' or 'theme'
	 */
	function expect( $item, $type='plugin' ) {
		$this->is_updating = true;
		$this->autoupdate_expected[ $type ][] = $item;
	}

	/**
	 * Calculates available updates and saves them to a Jetpack Option
	 * Update data is saved in the following schema:
	 *
	 * array (
	 *      'plugins'                       => (int) number of plugin updates available
	 *      'themes'                        => (int) number of theme updates available
	 *      'wordpress'                     => (int) number of wordpress core updates available
	 *      'translations'                  => (int) number of translation updates available
	 *      'total'                         => (int) total of all available updates
	 *      'wp_version'                    => (string) the current version of WordPress that is running
	 *      'wp_update_version'             => (string) the latest available version of WordPress, only present if a WordPress update is needed
	 *      'site_is_version_controlled'    => (bool) is the site under version control
	 * )
	 */
	function save_update_data() {
		global $wp_version;

		$update_data = wp_get_update_data();

		// Stores the individual update counts as well as the total count.
		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		// Stores the current version of WordPress.
		$updates['wp_version'] = $wp_version;

		// If we need to update WordPress core, let's find the latest version number.
		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && 'upgrade' === $cur->response ) {
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

	/**
	 * On completion of an automatic update, let's store the results.
	 *
	 * @param $results - Sent by WP_Automatic_Updater after it completes an autoupdate action. Results may be empty.
	 */
	function automatic_updates_complete( $results ) {
		$this->autoupdate_results = $results;
	}

	/**
	 * On shutdown, let's check to see if we've preformed an automatic update.
	 * If so, let's compare the expected results to the actual results, and log our findings.
	 *
	 * Results are logged locally via Jetpack::log(), and globally via Jetpack::do_stats()
	 */
	function log_results() {

		if ( $this->is_updating ) {

			$this->jetpack = Jetpack::init();
			$items_to_log = array( 'plugin', 'theme' );

			foreach( $items_to_log as $items ) {
				$this->log_items( $items );
			}

			$this->jetpack->do_stats( 'server_side' );
			$this->jetpack->log( 'autoupdates', $this->log );
		}
	}

	/**
	 * Iterates through expected items ( plugins or themes ) and compares them to actual results.
	 *
	 * @param $items 'plugin' or 'theme'
	 */
	function log_items( $items ) {
		$items_updated = 0;
		$items_failed  = 0;
		$item_results  = $this->get_successful_updates( $items );

		foreach( $this->autoupdate_expected[ $items ] as $item ) {
			if ( in_array( $item, $item_results ) ) {
				$items_updated++;
				$this->log[ $items ][ $item ] = true;
			} else {
				$items_failed++;
				$this->log[ $items ][ $item ] = new WP_Error( "$items-fail", $this->get_error_message( $item, $type = $items ) );
			}
		}

		if ( $items_updated ) {
			$this->jetpack->stat( "autoupdates/$items-success", $items_updated );
		}

		if ( $items_failed ) {
			$this->jetpack->stat( "autoupdates/$items-fail", $items_failed );
		}

	}

	/**
	 * Parses the autoupdate results generated by WP_Automatic_Updater and returns a simple array of successful items
	 *
	 * @param string $type 'plugin' or 'theme'
	 *
	 * @return array
	 */
	private function get_successful_updates( $type = 'plugin' ) {
		$successful_updates = array();

		if ( ! isset( $this->autoupdate_results[ $type ] ) ) {
			return $successful_updates;
		}

		foreach( $this->autoupdate_results[ $type ] as $result ) {
			if ( $result->result ) {
				switch( $type ) {
					case 'theme':
						$successful_updates[] = $result->item->theme;
						break;
					default:
						$successful_updates[] = $result->item->plugin;
				}
			}
		}

		return $successful_updates;
	}

	/**
	 * Cycles through results generated by WP_Automatic_Updater to find the messages for the given item and item type.
	 *
	 * @param $item Example: 'jetpack/jetpack.php' for type 'plugin' or 'twentyfifteen' for type 'theme'
	 * @param string $type 'plugin' or 'theme'
	 *
	 * @return bool|string
	 */
	private function get_error_message( $item, $type = 'plugin' ) {
		if ( ! isset( $this->autoupdate_results[ $type ] ) ) {
			return false;
		}
		foreach( $this->autoupdate_results[ $type ] as $result ) {
			switch( $type ) {
				case 'theme':
					$id = $result->item->theme;
					break;
				default:
					$id = $result->item->plugin;
			}
			if ( $id == $item && isset( $result->messages ) ) {
				return implode( ', ', $result->messages );
			}
		}
		return false;
	}

}
Jetpack_Autoupdate::init();