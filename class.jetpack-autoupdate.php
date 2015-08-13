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

		if ( is_main_site() ) {
			// Anytime WordPress saves update data, we'll want to update our Jetpack option as well.
			add_action( 'set_site_transient_update_plugins', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_themes', array( $this, 'save_update_data' ) );
			add_action( 'set_site_transient_update_core', array( $this, 'save_update_data' ) );

			// Anytime a connection to jetpack is made, sync the update data
			add_action( 'jetpack_site_registered', array( $this, 'save_update_data' ) );

			// Anytime the Jetpack Version changes, sync the the update data
			add_action( 'updating_jetpack_version', array( $this, 'save_update_data' ) );
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
	 *
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
	 *
	 * jetpack_update_details is saved in the following schema:
	 *
	 * array (
	 *      'update_core'       => (array) The contents of the update_core transient.
	 *      'update_themes'     => (array) The contents of the update_themes transient.
	 *      'update_plugins'    => (array) The contents of the update_plugins transient.
	 * )
	 *
	 */
	function save_update_data() {

		if ( ! current_user_can( 'update_plugins' ) ) {
			// `wp_get_updated_data` will not return useful information if a user cannot manage plugins.
			// We should should therefore bail to avoid saving incomplete data
			return;
		}

		global $wp_version;

		$update_data = wp_get_update_data();

		// Stores the current version of WordPress.
		$updates['wp_version'] = $wp_version;

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

		Jetpack_Options::update_option( 'updates', $updates );

		// Let's also store and sync more details about what updates are needed.
		$update_details = array(
			'update_core' => get_site_transient( 'update_core' ),
			'update_plugins' => get_site_transient( 'update_plugins' ),
			'update_themes' => get_site_transient( 'update_themes' ),
		);
		Jetpack_Options::update_option( 'update_details', $update_details );
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
