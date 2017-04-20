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
		'theme'  => array(),
	);

	private $failed = array(
		'plugin' => array(),
		'theme'  => array(),
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
			add_filter( 'auto_update_theme', array( $this, 'autoupdate_theme' ), 10, 2 );
			add_filter( 'auto_update_core', array( $this, 'autoupdate_core' ), 10, 2 );
			add_filter( 'auto_update_translation', array( $this, 'autoupdate_translation' ), 10, 2 );
			add_action( 'automatic_updates_complete', array( $this, 'automatic_updates_complete' ), 999, 1 );
		}
	}

	public function autoupdate_translation( $update, $item ) {
		// Autoupdate all translations
		if ( Jetpack_Options::get_option( 'autoupdate_translations', false ) ) {
			return true;
		}
		
		// Themes
		$autoupdate_themes_translations = Jetpack_Options::get_option( 'autoupdate_themes_translations', array() );
		$autoupdate_theme_list          = Jetpack_Options::get_option( 'autoupdate_themes', array() );

		/*
		$item = {
		  "type":"theme",
		  "slug":"twentyfourteen",
		  "language":"en_CA",
		  "version":"1.8",
		  "updated":"2015-07-18 11:27:20",
		  "package":"https:\/\/downloads.wordpress.org\/translation\/theme\/twentyfourteen\/1.8\/en_CA.zip",
		  "autoupdate":true
		}
		*/
		if ( ( in_array( $item->slug, $autoupdate_themes_translations )
		       || in_array( $item->slug, $autoupdate_theme_list ) )
		     && 'theme' === $item->type
		) {
			$this->expect( $item->type + ':' + $item->slug, 'translation' );

			return true;
		}

		// Plugins
		$autoupdate_plugin_translations = Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() );
		$autoupdate_plugin_list         = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$plugin_files = array_unique( array_merge( $autoupdate_plugin_list, $autoupdate_plugin_translations ) );
		$plugin_slugs = array_map( array( __CLASS__, 'get_plugin_slug' ), $plugin_files );

		if ( in_array( $item->slug, $plugin_slugs )
		     && 'plugin' === $item->type
		) {
			$this->expect( $item->type + ':' + $item->slug, 'translation' );
			return true;
		}

		return $update;
	}

	public function autoupdate_theme( $update, $item ) {
		$autoupdate_theme_list = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		if ( in_array( $item->theme, $autoupdate_theme_list ) ) {
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
	 * @param string $item Example: 'jetpack/jetpack.php' for type 'plugin' or 'twentyfifteen' for type 'theme'
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

		$items_to_log = array( 'plugin', 'theme', 'translation' );
		foreach ( $items_to_log as $items ) {
			$this->log_items( $items );
		}

		Jetpack::log( 'autoupdates', $this->get_log() );
	}

	public function get_log() {
		return array(
			'results' => $this->results,
			'failed'  => $this->failed,
			'success' => $this->success
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
			foreach ( $this->expected[ $items ] as $item ) {
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
		$log      = array();
		// Bump numbers

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
			$xml            = new Jetpack_IXR_Client( array(
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

		foreach ( $this->results[ $type ] as $result ) {
			if ( $result->result ) {
				switch ( $type ) {
					case 'theme':
						$successful_updates[] = $result->item->theme;
						break;
					case 'translation':
						$successful_updates[] = $result->item->type + ':' + $result->item->slug;
						break;
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
		if ( ! $skin->request_filesystem_credentials( false, WP_PLUGIN_DIR, false ) ) {
			$result[] = 'no-plugin-directory-write-access';
		}
		if ( ! $skin->request_filesystem_credentials( false, WP_CONTENT_DIR, false ) ) {
			$result[] = 'no-wp-content-directory-write-access';
		}

		return $result;
	}

	static function get_plugin_slug( $plugin_file ) {
		$update_plugins   = get_site_transient( 'update_plugins' );
		if ( isset( $update_plugins->no_update ) ) {
			if ( isset( $update_plugins->no_update[ $plugin_file ] ) ) {
				$slug = $update_plugins->no_update[ $plugin_file ]->slug;
			}
		}
		if ( empty( $slug ) && isset( $update_plugins->response ) ) {
			if ( isset( $update_plugins->response[ $plugin_file ] ) ) {
				$slug = $update_plugins->response[ $plugin_file ]->slug;
			}
		}

		// Try to infer from the plugin file if not cached
		if ( empty( $slug) ) {
			$slug = dirname( $plugin_file );
			if ( '.' === $slug ) {
				$slug = preg_replace("/(.+)\.php$/", "$1", $plugin_file );
			}
		}
		return $slug;
	}

}

Jetpack_Autoupdate::init();
