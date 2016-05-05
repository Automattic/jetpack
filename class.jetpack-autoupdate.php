<?php

/**
 * Handles items that have been selected for automatic updates.
 * Hooks into WP_Automatic_Updater
 */
class Jetpack_Autoupdate {

	private $results = array();

	private $expected = array();

	private $success = array(
		'plugin' => array(),
		'theme' => array(),
	);

	private $failed = array(
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
		if ( Jetpack::is_module_active( 'manage' ) ) {
			add_filter( 'auto_update_plugin',  array( $this, 'autoupdate_plugin' ), 10, 2 );
			add_filter( 'auto_update_theme',   array( $this, 'autoupdate_theme' ), 10, 2 );
			add_filter( 'auto_update_core',    array( $this, 'autoupdate_core' ), 10, 2 );
			add_action( 'automatic_updates_complete', array( $this, 'automatic_updates_complete' ), 999, 1 );

			if ( Jetpack_Options::get_option( 'skip_version_control_check', false ) ) {
				add_filter( 'automatic_updates_is_vcs_checkout', array( $this, '__return_false'), 99 );
			}
		}
	}

	public function __return_false( $result ) {
		return false;
	}

	public function autoupdate_plugin( $update, $item ) {
		$autoupdate_plugin_list = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		if ( in_array( $item->plugin, $autoupdate_plugin_list ) ) {
			$this->expect( $item->plugin, 'plugin' );
 			return true;
		}
		return $update;
	}

	public function autoupdate_theme( $update, $item ) {
		$autoupdate_theme_list = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		if ( in_array( $item->theme , $autoupdate_theme_list) ) {
			$this->expect( $item->theme, 'theme' );
			return true;
		}
		return $update;
	}

	public function autoupdate_core( $update, $item ) {
		$autoupdate_core = Jetpack_Options::get_option( 'autoupdate_core', false );
		if ( $autoupdate_core ) {
			return $autoupdate_core;
		}
		return $update;
	}

	/**
	 * Stores the an item identifier to the expected array.
	 *
	 * @param string $item  Example: 'jetpack/jetpack.php' for type 'plugin' or 'twentyfifteen' for type 'theme'
	 * @param string $type 'plugin' or 'theme'
	 */
	private function expect( $item, $type ) {
		if ( ! isset( $this->expected[ $type ] ) ) {
			$this->expected[ $type ] = array();
		}
		$this->expected[ $type ][] = $item;
	}

	/**
	 * On completion of an automatic update, let's store the results.
	 *
	 * @param $results - Sent by WP_Automatic_Updater after it completes an autoupdate action. Results may be empty.
	 */
	public function automatic_updates_complete( $results ) {
		if ( empty( $this->expected ) ) {
			return;
		}
		$this->results = empty( $results ) ? self::get_possible_failures() : $results;

		add_action( 'shutdown', array( $this, 'bump_stats' ) );

		Jetpack::init();

		$items_to_log = array( 'plugin', 'theme' );
		foreach( $items_to_log as $items ) {
			$this->log_items( $items );
		}

		Jetpack::log( 'autoupdates', $this->get_log() );
	}

	public function get_log() {
		return array(
			'results'	=> $this->results,
			'failed'	=> $this->failed,
			'success'	=> $this->success
		);
	}

	/**
	 * Iterates through expected items ( plugins or themes ) and compares them to actual results.
	 *
	 * @param $items 'plugin' or 'theme'
	 */
	private function log_items( $items ) {

		if ( ! isset( $this->expected[ $items ] ) ) {
			return;
		}

		$item_results = $this->get_successful_updates( $items );

		if ( is_array( $this->expected[ $items ] ) ) {
			foreach( $this->expected[ $items ] as $item ) {
				if ( in_array( $item, $item_results ) ) {
						$this->success[ $items ][] = $item;
				} else {
						$this->failed[ $items ][] = $item;
				}
			}
		}
	}

	public function bump_stats() {
		$instance = Jetpack::init();
		$log = array();
		// Bump numbers
		if ( ! empty( $this->success['plugin'] ) ) {
			$instance->stat( 'autoupdates/plugin-success', count( $this->success['plugin'] ) );
			$log['plugins_success'] = $this->success['plugin'];
		}

		if ( ! empty( $this->failed['plugin'] ) ) {
			$instance->stat( 'autoupdates/plugin-fail', count( $this->failed['plugin'] ) );
			$log['plugins_failed'] = $this->failed['plugin'];
		}

		if ( ! empty( $this->success['theme'] ) ) {
			$instance->stat( 'autoupdates/theme-success', count( $this->success['theme'] ) );
			$log['themes_success'] = $this->success['theme'];
		}

		if ( ! empty( $this->failed['theme'] ) ) {
			$instance->stat( 'autoupdates/theme-fail', count( $this->failed['theme'] ) );
			$log['themes_failed'] = $this->failed['theme'];
		}

		$instance->do_stats( 'server_side' );

		// Send a more detailed log to logstash
		if ( ! empty( $log ) ) {
			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_Client( array(
				'user_id' => get_current_user_id()
			) );
			$log['blog_id'] = Jetpack_Options::get_option( 'id' );
			$xml->query( 'jetpack.debug_autoupdate', $log );
		}
	}

	/**
	 * Parses the autoupdate results generated by WP_Automatic_Updater and returns a simple array of successful items
	 *
	 * @param string $type 'plugin' or 'theme'
	 *
	 * @return array
	 */
	private function get_successful_updates( $type ) {
		$successful_updates = array();

		if ( ! isset( $this->results[ $type ] ) ) {
			return $successful_updates;
		}

		foreach( $this->results[ $type ] as $result ) {
			if ( $result->result ) {
				switch( $type ) {
					case 'theme':
						$successful_updates[] = $result->item->theme;
						break;
					case 'plugin':
						$successful_updates[] = $result->item->plugin;
				}
			}
		}

		return $successful_updates;
	}

	static function get_possible_failures() {
		$result = array();
		// Lets check some reasons why it might not be working as expected
		include_once( ABSPATH . '/wp-admin/includes/admin.php' );
		include_once( ABSPATH . '/wp-admin/includes/class-wp-upgrader.php' );
		$upgrader = new WP_Automatic_Updater;

		if ( $upgrader->is_disabled() ) {
			$result[] = 'autoupdates-disabled';
		}
		if ( ! is_main_site() ) {
			$result[] = 'is-not-main-site';
		}
		if ( ! is_main_network() ) {
			$result[] = 'is-not-main-network';
		}
		if ( $upgrader->is_vcs_checkout( ABSPATH ) ) {
			$result[] = 'site-on-vcs';
		}
		if ( $upgrader->is_vcs_checkout( WP_PLUGIN_DIR ) ) {
			$result[] = 'plugin-directory-on-vcs';
		}
		if ( $upgrader->is_vcs_checkout( WP_CONTENT_DIR ) ) {
			$result[] = 'content-directory-on-vcs';
		}
		$lock = get_option( 'auto_updater.lock' );
		if ( $lock > ( time() - HOUR_IN_SECONDS ) ) {
			$result[] = 'lock-is-set';
		}
		$skin = new Automatic_Upgrader_Skin;
		include_once( ABSPATH . 'wp-admin/includes/file.php' );
		include_once( ABSPATH . 'wp-admin/includes/template.php' );
		if ( ! $skin->request_filesystem_credentials( false, ABSPATH, false ) ) {
			$result[] = 'no-system-write-access';
		}
		if ( ! $skin->request_filesystem_credentials( false, WP_PLUGIN_DIR, false )  ) {
			$result[] = 'no-plugin-directory-write-access';
		}
		if ( ! $skin->request_filesystem_credentials( false,  WP_CONTENT_DIR, false ) ) {
			$result[] = 'no-wp-content-directory-write-access';
		}
		return $result;
	}

}
Jetpack_Autoupdate::init();
