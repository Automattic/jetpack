<?php

class Jetpack_Sync_Module_Options extends Jetpack_Sync_Module {
	private $options_whitelist, $options_contentless;

	public function name() {
		return 'options';
	}

	public function init_listeners( $callable ) {
		// options
		add_action( 'added_option', $callable, 10, 2 );
		add_action( 'updated_option', $callable, 10, 3 );
		add_action( 'deleted_option', $callable, 10, 1 );

		// Sync Core Icon: Detect changes in Core's Site Icon and make it syncable.
		add_action( 'add_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'update_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'delete_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );

		$whitelist_option_handler = array( $this, 'whitelist_options' );
		add_filter( 'jetpack_sync_before_enqueue_deleted_option', $whitelist_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_added_option', $whitelist_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_updated_option', $whitelist_option_handler );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_options', $callable );
	}

	public function init_before_send() {
		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_options', array( $this, 'expand_options' ) );
	}

	public function set_defaults() {
		$this->update_options_whitelist();
		$this->update_options_contentless();
	}

	public function set_late_default() {

		/** This filter is already documented in json-endpoints/jetpack/class.wpcom-json-api-get-option-endpoint.php */
		$late_options = apply_filters( 'jetpack_options_whitelist', array() );
		if ( ! empty( $late_options ) && is_array( $late_options ) ) {
			$this->options_whitelist = array_merge( $this->options_whitelist, $late_options );
		}
	}

	function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		/**
		 * Tells the client to sync all options to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand options (should always be true)
		 */
		do_action( 'jetpack_full_sync_options', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	public function estimate_full_sync_actions( $config ) {
		return 1;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_options' );
	}

	// Is public so that we don't have to store so much data all the options twice.
	function get_all_options() {
		$options       = array();
		$random_string = wp_generate_password();
		foreach ( $this->options_whitelist as $option ) {
			$option_value = get_option( $option, $random_string );
			if ( $option_value !== $random_string ) {
				$options[ $option ] = $option_value;
			}
		}

		// add theme mods
		$theme_mods_option = 'theme_mods_' . get_option( 'stylesheet' );
		$theme_mods_value  = get_option( $theme_mods_option, $random_string );
		if ( $theme_mods_value === $random_string ) {
			return $options;
		}
		$this->filter_theme_mods( $theme_mods_value );
		$options[ $theme_mods_option ] = $theme_mods_value;
		return $options;
	}

	function update_options_whitelist() {
		$this->options_whitelist = Jetpack_Sync_Defaults::get_options_whitelist();
	}

	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function get_options_whitelist() {
		return $this->options_whitelist;
	}

	function update_options_contentless() {
		$this->options_contentless = Jetpack_Sync_Defaults::get_options_contentless();
	}

	function get_options_contentless() {
		return $this->options_contentless;
	}

	function whitelist_options( $args ) {
		// Reject non-whitelisted options
		if ( ! $this->is_whitelisted_option( $args[0] ) ) {
			return false;
		}

		// filter our weird array( false ) value for theme_mods_*
		if ( 'theme_mods_' === substr( $args[0], 0, 11 ) ) {
			$this->filter_theme_mods( $args[1] );
			if ( isset( $args[2] ) ) {
				$this->filter_theme_mods( $args[2] );
			}
		}

		// Set value(s) of contentless option to empty string(s)
		if ( $this->is_contentless_option( $args[0] ) ) {
			// Create a new array matching length of $args, containing empty strings
			$empty    = array_fill( 0, count( $args ), '' );
			$empty[0] = $args[0];
			return $empty;
		}

		return $args;
	}

	function is_whitelisted_option( $option ) {
		return in_array( $option, $this->options_whitelist ) || 'theme_mods_' === substr( $option, 0, 11 );
	}

	private function is_contentless_option( $option ) {
		return in_array( $option, $this->options_contentless );
	}

	private function filter_theme_mods( &$value ) {
		if ( is_array( $value ) && isset( $value[0] ) ) {
			unset( $value[0] );
		}
	}

	function jetpack_sync_core_icon() {
		$url = get_site_icon_url();

		require_once JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php';
		// If there's a core icon, maybe update the option.  If not, fall back to Jetpack's.
		if ( ! empty( $url ) && $url !== jetpack_site_icon_url() ) {
			// This is the option that is synced with dotcom
			Jetpack_Options::update_option( 'site_icon_url', $url );
		} elseif ( empty( $url ) ) {
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
	}

	public function expand_options( $args ) {
		if ( $args[0] ) {
			return $this->get_all_options();
		}

		return $args;
	}
}
