<?php

// Shared logic between Jetpack admin pages
abstract class Jetpack_Admin_Page {
	// Add page specific actions given the page hook
	abstract function add_page_actions( $hook );

	// Create a menu item for the page and returns the hook
	abstract function get_page_hook();

	// Enqueue and localize page specific scripts
	abstract function page_admin_scripts();

	// Render page specific HTML
	abstract function page_render();

	/**
	 * Should we block the page rendering because the site is in IDC?
	 * @var bool
	 */
	static $block_page_rendering_for_idc;

	/**
	 * Flag to know if we already checked the plan.
	 *
	 * @since 4.4.0
	 *
	 * @var bool
	 */
	static $plan_checked = false;

	/**
	 * Function called after admin_styles to load any additional needed styles.
	 *
	 * @since 4.3.0
	 */
	function additional_styles() {}

	function __construct() {
		$this->jetpack = Jetpack::init();
		self::$block_page_rendering_for_idc = (
			Jetpack::validate_sync_error_idc_option() && ! Jetpack_Options::get_option( 'safe_mode_confirmed' )
		);
	}

	function add_actions() {

		// If user is not an admin and site is in Dev Mode, don't do anything
		if ( ! current_user_can( 'manage_options' ) && Jetpack::is_development_mode() ) {
			return;
		}

		// Don't add in the modules page unless modules are available!
		if ( $this->dont_show_if_not_active && ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			return;
		}

		// Initialize menu item for the page in the admin
		$hook = $this->get_page_hook();

		// Attach hooks common to all Jetpack admin pages based on the created
		// hook
		add_action( "load-$hook",                array( $this, 'admin_help'      ) );
		add_action( "load-$hook",                array( $this, 'admin_page_load' ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'      ) );

		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );

		if ( ! self::$block_page_rendering_for_idc ) {
			add_action( "admin_print_styles-$hook", array( $this, 'additional_styles' ) );
		}

		// Check if the site plan changed and deactivate modules accordingly.
		add_action( 'current_screen', array( $this, 'check_plan_deactivate_modules' ) );

		// Attach page specific actions in addition to the above
		$this->add_page_actions( $hook );
	}

	function admin_head() {
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
			/**
			 * Fires in the <head> of a particular Jetpack configuation page.
			 *
			 * The dynamic portion of the hook name, `$_GET['configure']`,
			 * refers to the slug of module, such as 'stats', 'sso', etc.
			 * A complete hook for the latter would be
			 * 'jetpack_module_configuation_head_sso'.
			 *
			 * @since 3.0.0
			 */
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
		}
	}

	// Render the page with a common top and bottom part, and page specific content
	function render() {
		// We're in an IDC: we need a decision made before we show the UI again.
		if ( self::$block_page_rendering_for_idc ) {
			return;
		}

		$this->page_render();
	}

	function admin_help() {
		$this->jetpack->admin_help();
	}

	function admin_page_load() {
		// This is big.  For the moment, just call the existing one.
		$this->jetpack->admin_page_load();
	}

	function admin_page_top() {
		include_once( JETPACK__PLUGIN_DIR . '_inc/header.php' );
	}

	function admin_page_bottom() {
		include_once( JETPACK__PLUGIN_DIR . '_inc/footer.php' );
	}

	// Add page specific scripts and jetpack stats for all menu pages
	function admin_scripts() {
		$this->page_admin_scripts(); // Delegate to inheriting class
		add_action( 'admin_footer', array( $this->jetpack, 'do_stats' ) );
	}

	// Enqueue the Jetpack admin stylesheet
	function admin_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		wp_enqueue_style( 'jetpack-admin', plugins_url( "css/jetpack-admin{$min}.css", JETPACK__PLUGIN_FILE ), array( 'genericons' ), JETPACK__VERSION . '-20121016' );
		wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-admin', 'suffix', $min );
	}

	/**
	 * Checks if WordPress version is too old to have REST API.
	 *
	 * @since 4.3
	 *
	 * @return bool
	 */
	function is_wp_version_too_old() {
		global $wp_version;
		return ( ! function_exists( 'rest_api_init' ) || version_compare( $wp_version, '4.4-z', '<=' ) );
	}

	/**
	 * Checks if REST API is enabled.
	 *
	 * @since 4.4.2
	 *
	 * @return bool
	 */
	function is_rest_api_enabled() {
		return
			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			apply_filters( 'rest_enabled', true ) &&
			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			apply_filters( 'rest_jsonp_enabled', true ) &&
			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			apply_filters( 'rest_authentication_errors', true );
	}

	/**
	 * Checks the site plan and deactivates modules that were active but are no longer included in the plan.
	 *
	 * @since 4.4.0
	 *
	 * @param $page
	 *
	 * @return bool|array
	 */
	function check_plan_deactivate_modules( $page ) {
		if (
			Jetpack::is_development_mode()
			|| ! in_array(
				$page->base,
				array(
					'toplevel_page_jetpack',
					'admin_page_jetpack_modules',
					'jetpack_page_vaultpress',
					'jetpack_page_stats',
					'jetpack_page_akismet-key-config'
				)
			)
			|| true === self::$plan_checked
		) {
			return false;
		}

		self::$plan_checked = true;
		$previous = get_option( 'jetpack_active_plan', '' );
		$response = rest_do_request( new WP_REST_Request( 'GET', '/jetpack/v4/site' ) );

		if ( ! is_object( $response ) || $response->is_error() ) {

			// If we can't get information about the current plan we don't do anything
			self::$plan_checked = true;
			return;
		}

		$current = $response->get_data();
		$current = json_decode( $current['data'] );

		$to_deactivate = array();
		if ( isset( $current->plan->product_slug ) ) {
			if (
				empty( $previous )
				|| ! isset( $previous['product_slug'] )
				|| $previous['product_slug'] !== $current->plan->product_slug
			) {
				$active = Jetpack::get_active_modules();
				switch ( $current->plan->product_slug ) {
					case 'jetpack_free':
						$to_deactivate = array( 'seo-tools', 'videopress', 'google-analytics', 'wordads' );
						break;
					case 'jetpack_personal':
					case 'jetpack_personal_monthly':
						$to_deactivate = array( 'seo-tools', 'videopress', 'google-analytics', 'wordads' );
						break;
					case 'jetpack_premium':
					case 'jetpack_premium_monthly':
						$to_deactivate = array( 'seo-tools', 'google-analytics' );
						break;
				}
				$to_deactivate = array_intersect( $active, $to_deactivate );
				if ( ! empty( $to_deactivate ) ) {
					Jetpack::update_active_modules( array_filter( array_diff( $active, $to_deactivate ) ) );
				}
			}
		}
		return array(
			'previous'   => $previous,
			'current'    => $current,
			'deactivate' => $to_deactivate
		);
	}
}
