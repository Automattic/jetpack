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
		require_once( ABSPATH . 'wp-includes/pluggable.php' );
		get_currentuserinfo();

		$this->updates_allowed = Jetpack::is_module_active( 'manage' );
		// Only run automatic updates if a user as opted in by activating the manage module.
		if ( $this->updates_allowed ) {
			add_filter( 'auto_update_plugin',  array( $this, 'autoupdate_plugin' ), 10, 2 );
			add_filter( 'auto_update_theme',   array( $this, 'autoupdate_theme' ), 10, 2 );
			add_filter( 'auto_update_core',    array( $this, 'autoupdate_core' ), 10, 2 );
			add_action( 'automatic_updates_complete', array( $this, 'automatic_updates_complete' ), 10, 1 );
			add_action( 'shutdown', array( $this, 'log_results' ) );
		}

		$jetpack = Jetpack::init();
		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			$jetpack->sync->mock_option( 'updates', array( $this, 'get_updates' ) );
		}

		$jetpack->sync->mock_option( 'update_details', array( $this, 'get_update_details' ) );

		// Anytime WordPress saves update data, we'll want to sync update data
		add_action( 'set_site_transient_update_plugins', array( $this, 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_themes', array( $this, 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_core', array( $this, 'refresh_update_data' ) );

		// Anytime a connection to jetpack is made, sync the update data
		add_action( 'jetpack_site_registered', array( $this, 'refresh_update_data' ) );

		// Anytime the Jetpack Version changes, sync the the update data
		add_action( 'updating_jetpack_version', array( $this, 'refresh_update_data' ) );

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
	 * jetpack_updates is saved in the following schema:
	 *
	 * array (
	 *      'plugins'                       => (int) Number of plugin updates available.
	 *      'themes'                        => (int) Number of theme updates available.
	 *      'wordpress'                     => (int) Number of WordPress core updates available.
	 *      'translations'                  => (int) Number of translation updates available.
	 *      'total'                         => (int) Total of all available updates.
	 *      'wp_update_version'             => (string) The latest available version of WordPress, only present if a WordPress update is needed.
	 * )
	 * @return array
	 */
	function get_updates() {
		$update_data = wp_get_update_data();

		// Stores the individual update counts as well as the total count.
		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		// If we need to update WordPress core, let's find the latest version number.
		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && 'upgrade' === $cur->response ) {
				$updates['wp_update_version'] = $cur->current;
			}
		}
		return isset( $updates ) ? $updates : array();
	}

	function get_update_details() {
		$update_details = array(
			'update_core' => get_site_transient( 'update_core' ),
			'update_plugins' => get_site_transient( 'update_plugins' ),
			'update_themes' => get_site_transient( 'update_themes' ),
		);
		return $update_details;
	}

	function refresh_update_data() {
		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			do_action( 'add_option_jetpack_updates', 'jetpack_updates', $this->get_updates() );
		}
		do_action( 'add_option_jetpack_update_details', 'jetpack_update_details', $this->get_update_details() );
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
		$num_items_updated = 0;
		$num_items_failed  = 0;
		$item_results      = $this->get_successful_updates( $items );
		$items_failed      = array();

		foreach( $this->autoupdate_expected[ $items ] as $item ) {
			if ( in_array( $item, $item_results ) ) {
				$num_items_updated++;
				$this->log[ $items ][ $item ] = true;
			} else {
				$num_items_failed++;
				$this->log[ $items ][ $item ] = new WP_Error( "$items-fail", $this->get_error_message( $item, $type = $items ) );
				$items_failed[] = $item;
			}
		}

		if ( $num_items_updated ) {
			$this->jetpack->stat( "autoupdates/$items-success", $num_items_updated );
		}

		if ( $num_items_failed ) {
			// bump stats
			$this->jetpack->stat( "autoupdates/$items-fail", $num_items_failed );
			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_Client( array(
				'user_id' => get_current_user_id()
			) );
			$request = array(
				'plugins' => $items_failed,
				'blog_id' => Jetpack_Options::get_option( 'id' ),
			);
			$xml->query( 'jetpack.debug_autoupdate', $request );
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
