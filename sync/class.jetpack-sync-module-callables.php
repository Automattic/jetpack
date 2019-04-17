<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';

class Jetpack_Sync_Module_Callables extends Jetpack_Sync_Module {
	const CALLABLES_CHECKSUM_OPTION_NAME = 'jetpack_callables_sync_checksum';
	const CALLABLES_AWAIT_TRANSIENT_NAME = 'jetpack_sync_callables_await';

	private $callable_whitelist;

	public function name() {
		return 'functions';
	}

	public function set_defaults() {
		if ( is_multisite() ) {
			$this->callable_whitelist = array_merge( Jetpack_Sync_Defaults::get_callable_whitelist(), Jetpack_Sync_Defaults::get_multisite_callable_whitelist() );
		} else {
			$this->callable_whitelist = Jetpack_Sync_Defaults::get_callable_whitelist();
		}
	}

	public function init_listeners( $callable ) {
		add_action( 'jetpack_sync_callable', $callable, 10, 2 );
		add_action( 'current_screen', array( $this, 'set_plugin_action_links' ), 9999 ); // Should happen very late

		// For some options, we should always send the change right away!
		$always_send_updates_to_these_options = array(
			'jetpack_active_modules',
			'home',
			'siteurl',
			'jetpack_sync_error_idc',
			'paused_plugins',
			'paused_themes',
		);
		foreach ( $always_send_updates_to_these_options as $option ) {
			add_action( "update_option_{$option}", array( $this, 'unlock_sync_callable' ) );
			add_action( "delete_option_{$option}", array( $this, 'unlock_sync_callable' ) );
		}

		// Provide a hook so that hosts can send changes to certain callables right away.
		// Especially useful when a host uses constants to change home and siteurl.
		add_action( 'jetpack_sync_unlock_sync_callable', array( $this, 'unlock_sync_callable' ) );

		// get_plugins and wp_version
		// gets fired when new code gets installed, updates etc.
		add_action( 'upgrader_process_complete', array( $this, 'unlock_plugin_action_link_and_callables' ) );
		add_action( 'update_option_active_plugins', array( $this, 'unlock_plugin_action_link_and_callables' ) );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_callables', $callable );
	}

	public function init_before_send() {
		add_action( 'jetpack_sync_before_send_queue_sync', array( $this, 'maybe_sync_callables' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_callables', array( $this, 'expand_callables' ) );
	}

	public function reset_data() {
		delete_option( self::CALLABLES_CHECKSUM_OPTION_NAME );
		delete_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME );

		$url_callables = array( 'home_url', 'site_url', 'main_network_site_url' );
		foreach ( $url_callables as $callable ) {
			delete_option( Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable );
		}
	}

	function set_callable_whitelist( $callables ) {
		$this->callable_whitelist = $callables;
	}

	function get_callable_whitelist() {
		return $this->callable_whitelist;
	}

	public function get_all_callables() {
		// get_all_callables should run as the master user always.
		$current_user_id = get_current_user_id();
		wp_set_current_user( Jetpack_Options::get_option( 'master_user' ) );
		$callables = array_combine(
			array_keys( $this->get_callable_whitelist() ),
			array_map( array( $this, 'get_callable' ), array_values( $this->get_callable_whitelist() ) )
		);
		wp_set_current_user( $current_user_id );
		return $callables;
	}

	private function get_callable( $callable ) {
		return call_user_func( $callable );
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		/**
		 * Tells the client to sync all callables to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand callables (should always be true)
		 */
		do_action( 'jetpack_full_sync_callables', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	public function estimate_full_sync_actions( $config ) {
		return 1;
	}

	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_callables' );
	}

	public function unlock_sync_callable() {
		delete_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME );
	}

	public function unlock_plugin_action_link_and_callables() {
		delete_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_transient( 'jetpack_plugin_api_action_links_refresh' );
		add_filter( 'jetpack_check_and_send_callables', '__return_true' );
	}

	public function set_plugin_action_links() {
		if (
			! class_exists( 'DOMDocument' ) ||
			! function_exists( 'libxml_use_internal_errors' ) ||
			! function_exists( 'mb_convert_encoding' )
		) {
			return;
		}

		$current_screeen = get_current_screen();

		$plugins_action_links = array();
		// Is the transient lock in place?
		$plugins_lock = get_transient( 'jetpack_plugin_api_action_links_refresh', false );
		if ( ! empty( $plugins_lock ) && ( isset( $current_screeen->id ) && $current_screeen->id !== 'plugins' ) ) {
			return;
		}
		$plugins = array_keys( Jetpack_Sync_Functions::get_plugins() );
		foreach ( $plugins as $plugin_file ) {
			/**
			 *  Plugins often like to unset things but things break if they are not able to.
			 */
			$action_links = array(
				'deactivate' => '',
				'activate'   => '',
				'details'    => '',
				'delete'     => '',
				'edit'       => '',
			);
			/** This filter is documented in src/wp-admin/includes/class-wp-plugins-list-table.php */
			$action_links = apply_filters( 'plugin_action_links', $action_links, $plugin_file, null, 'all' );
			/** This filter is documented in src/wp-admin/includes/class-wp-plugins-list-table.php */
			$action_links           = apply_filters( "plugin_action_links_{$plugin_file}", $action_links, $plugin_file, null, 'all' );
			$action_links           = array_filter( $action_links );
			$formatted_action_links = null;
			if ( ! empty( $action_links ) && count( $action_links ) > 0 ) {
				$dom_doc = new DOMDocument();
				foreach ( $action_links as $action_link ) {
					// The @ is not enough to suppress errors when dealing with libxml,
					// we have to tell it directly how we want to handle errors.
					libxml_use_internal_errors( true );
					$dom_doc->loadHTML( mb_convert_encoding( $action_link, 'HTML-ENTITIES', 'UTF-8' ) );
					libxml_use_internal_errors( false );

					$link_elements = $dom_doc->getElementsByTagName( 'a' );
					if ( $link_elements->length == 0 ) {
						continue;
					}

					$link_element = $link_elements->item( 0 );
					if ( $link_element->hasAttribute( 'href' ) && $link_element->nodeValue ) {
						$link_url = trim( $link_element->getAttribute( 'href' ) );

						// Add the full admin path to the url if the plugin did not provide it
						$link_url_scheme = wp_parse_url( $link_url, PHP_URL_SCHEME );
						if ( empty( $link_url_scheme ) ) {
							$link_url = admin_url( $link_url );
						}

						$formatted_action_links[ $link_element->nodeValue ] = $link_url;
					}
				}
			}
			if ( $formatted_action_links ) {
				$plugins_action_links[ $plugin_file ] = $formatted_action_links;
			}
		}
		// Cache things for a long time
		set_transient( 'jetpack_plugin_api_action_links_refresh', time(), DAY_IN_SECONDS );
		update_option( 'jetpack_plugin_api_action_links', $plugins_action_links );
	}

	public function should_send_callable( $callable_checksums, $name, $checksum ) {
		$idc_override_callables = array(
			'main_network_site',
			'home_url',
			'site_url',
		);
		if ( in_array( $name, $idc_override_callables ) && Jetpack_Options::get_option( 'migrate_for_idc' ) ) {
			return true;
		}

		return ! $this->still_valid_checksum( $callable_checksums, $name, $checksum );
	}

	public function maybe_sync_callables() {
		if ( ! apply_filters( 'jetpack_check_and_send_callables', false ) ) {
			if ( ! is_admin() || Jetpack_Sync_Settings::is_doing_cron() ) {
				return;
			}

			if ( get_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME ) ) {
				return;
			}
		}

		set_transient( self::CALLABLES_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_callables_wait_time );

		$callables = $this->get_all_callables();

		if ( empty( $callables ) ) {
			return;
		}

		$callable_checksums = (array) Jetpack_Options::get_raw_option( self::CALLABLES_CHECKSUM_OPTION_NAME, array() );
		$has_changed = false;
		// only send the callables that have changed
		foreach ( $callables as $name => $value ) {
			$checksum = $this->get_check_sum( $value );
			// explicitly not using Identical comparison as get_option returns a string
			if ( ! is_null( $value ) && $this->should_send_callable( $callable_checksums, $name, $checksum ) ) {
				/**
				 * Tells the client to sync a callable (aka function) to the server
				 *
				 * @since 4.2.0
				 *
				 * @param string The name of the callable
				 * @param mixed The value of the callable
				 */
				do_action( 'jetpack_sync_callable', $name, $value );
				$callable_checksums[ $name ] = $checksum;
				$has_changed = true;
			} else {
				$callable_checksums[ $name ] = $checksum;
			}
		}
		if ( $has_changed ) {
			Jetpack_Options::update_raw_option( self::CALLABLES_CHECKSUM_OPTION_NAME, $callable_checksums );
		}

	}

	public function expand_callables( $args ) {
		if ( $args[0] ) {
			$callables           = $this->get_all_callables();
			$callables_checksums = array();
			foreach ( $callables as $name => $value ) {
				$callables_checksums[ $name ] = $this->get_check_sum( $value );
			}
			Jetpack_Options::update_raw_option( self::CALLABLES_CHECKSUM_OPTION_NAME, $callables_checksums );
			return $callables;
		}

		return $args;
	}
}
