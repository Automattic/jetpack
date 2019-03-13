<?php


// Build the Jetpack admin menu as a whole
class Jetpack_Admin {

	/**
	 * @var Jetpack_Admin
	 **/
	private static $instance = null;

	/**
	 * @var Jetpack
	 **/
	private $jetpack;

	static function init() {
		if( isset( $_GET['page'] ) && $_GET['page'] === 'jetpack' ) {
			add_filter( 'nocache_headers', array( 'Jetpack_Admin', 'add_no_store_header' ), 100 );
		}

		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Admin;
		}
		return self::$instance;
	}

	static function add_no_store_header( $headers ) {
		$headers['Cache-Control'] .= ', no-store';
		return $headers;
	}

	private function __construct() {
		$this->jetpack = Jetpack::init();

		jetpack_require_lib( 'admin-pages/class.jetpack-react-page' );
		$this->jetpack_react = new Jetpack_React_Page;

		jetpack_require_lib( 'admin-pages/class.jetpack-settings-page' );
		$this->fallback_page = new Jetpack_Settings_Page;

		add_action( 'admin_menu',                    array( $this->jetpack_react, 'add_actions' ), 998 );
		add_action( 'jetpack_admin_menu',            array( $this->jetpack_react, 'jetpack_add_dashboard_sub_nav_item' ) );
		add_action( 'jetpack_admin_menu',            array( $this->jetpack_react, 'jetpack_add_settings_sub_nav_item' ) );
		add_action( 'jetpack_admin_menu',            array( $this, 'admin_menu_debugger' ) );
		add_action( 'jetpack_admin_menu',            array( $this->fallback_page, 'add_actions' ) );

		// Add redirect to current page for activation/deactivation of modules
		add_action( 'jetpack_pre_activate_module',   array( $this, 'fix_redirect' ), 10, 2 );
		add_action( 'jetpack_pre_deactivate_module', array( $this, 'fix_redirect' ) );

		// Add module bulk actions handler
		add_action( 'jetpack_unrecognized_action',   array( $this, 'handle_unrecognized_action' ) );
	}

	static function sort_requires_connection_last( $module1, $module2 ) {
		if ( $module1['requires_connection'] == $module2['requires_connection'] ) {
			return 0;
		} elseif ( $module1['requires_connection'] ) {
			return 1;
		} elseif ( $module2['requires_connection'] ) {
			return -1;
		}

		return 0;
	}

	// Produce JS understandable objects of modules containing information for
	// presentation like description, name, configuration url, etc.
	function get_modules() {
		include_once( JETPACK__PLUGIN_DIR . 'modules/module-info.php' );
		$available_modules = Jetpack::get_available_modules();
		$active_modules    = Jetpack::get_active_modules();
		$modules           = array();
		$jetpack_active = Jetpack::is_active() || Jetpack::is_development_mode();
		$overrides = Jetpack_Modules_Overrides::instance();
		foreach ( $available_modules as $module ) {
			if ( $module_array = Jetpack::get_module( $module ) ) {
				/**
				 * Filters each module's short description.
				 *
				 * @since 3.0.0
				 *
				 * @param string $module_array['description'] Module description.
				 * @param string $module Module slug.
				 */
				$short_desc = apply_filters( 'jetpack_short_module_description', $module_array['description'], $module );
				// Fix: correct multibyte strings truncate with checking for mbstring extension
				$short_desc_trunc = ( function_exists( 'mb_strlen' ) )
							? ( ( mb_strlen( $short_desc ) > 143 )
								? mb_substr( $short_desc, 0, 140 ) . '...'
								: $short_desc )
							: ( ( strlen( $short_desc ) > 143 )
								? substr( $short_desc, 0, 140 ) . '...'
								: $short_desc );

				$module_array['module']            = $module;
				$module_array['activated']         = ( $jetpack_active ? in_array( $module, $active_modules ) : false );
				$module_array['deactivate_nonce']  = wp_create_nonce( 'jetpack_deactivate-' . $module );
				$module_array['activate_nonce']    = wp_create_nonce( 'jetpack_activate-' . $module );
				$module_array['available']         = self::is_module_available( $module_array );
				$module_array['short_description'] = $short_desc_trunc;
				$module_array['configure_url']     = Jetpack::module_configuration_url( $module );
				$module_array['override']          = $overrides->get_module_override( $module );

				ob_start();
				/**
				 * Allow the display of a "Learn More" button.
				 * The dynamic part of the action, $module, is the module slug.
				 *
				 * @since 3.0.0
				 */
				do_action( 'jetpack_learn_more_button_' . $module );
				$module_array['learn_more_button'] = ob_get_clean();

				ob_start();
				/**
				 * Allow the display of information text when Jetpack is connected to WordPress.com.
				 * The dynamic part of the action, $module, is the module slug.
				 *
				 * @since 3.0.0
				 */
				do_action( 'jetpack_module_more_info_' . $module );

				/**
				* Filter the long description of a module.
	 			*
	 			* @since 3.5.0
	 			*
	 			* @param string ob_get_clean() The module long description.
				* @param string $module The module name.
	 			*/
				$module_array['long_description'] = apply_filters( 'jetpack_long_module_description', ob_get_clean(), $module );

				ob_start();
				/**
				 * Filter the search terms for a module
				 *
				 * Search terms are typically added to the module headers, under "Additional Search Queries".
				 *
				 * Use syntax:
				 * function jetpack_$module_search_terms( $terms ) {
				 *  $terms = _x( 'term 1, term 2', 'search terms', 'jetpack' );
				 *  return $terms;
				 * }
				 * add_filter( 'jetpack_search_terms_$module', 'jetpack_$module_search_terms' );
				 *
				 * @since 3.5.0
				 *
				 * @param string The search terms (comma separated).
				 */
				echo apply_filters( 'jetpack_search_terms_' . $module, $module_array['additional_search_queries'] );
				$module_array['search_terms'] = ob_get_clean();

				$module_array['configurable'] = false;
				if (
					current_user_can( 'manage_options' ) &&
					/**
					 * Allow the display of a configuration link in the Jetpack Settings screen.
					 *
					 * @since 3.0.0
					 *
					 * @param string $module Module name.
					 * @param bool false Should the Configure module link be displayed? Default to false.
					 */
					apply_filters( 'jetpack_module_configurable_' . $module, false )
				) {
					$module_array['configurable'] = sprintf( '<a href="%1$s">%2$s</a>', esc_url( $module_array['configure_url'] ), __( 'Configure', 'jetpack' ) );
				}

				$modules[ $module ] = $module_array;
			}
		}

		uasort( $modules, array( $this->jetpack, 'sort_modules' ) );

		if ( ! Jetpack::is_active() ) {
			uasort( $modules, array( __CLASS__, 'sort_requires_connection_last' ) );
		}

		return $modules;
	}

	static function is_module_available( $module ) {
		if ( ! is_array( $module ) || empty( $module ) )
			return false;

		/**
		 * We never want to show VaultPress as activatable through Jetpack.
		 */
		if ( 'vaultpress' === $module['module'] ) {
			return false;
		}

		if ( Jetpack::is_development_mode() ) {
			return ! ( $module['requires_connection'] );
		} else {
			if ( ! Jetpack::is_active() ) {
				return false;
			}

			return Jetpack::active_plan_supports( $module['module'] );
		}
	}

	function handle_unrecognized_action( $action ) {
		switch( $action ) {
			case 'bulk-activate' :
				if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
					break;
				}

				$modules = (array) $_GET['modules'];
				$modules = array_map( 'sanitize_key', $modules );
				check_admin_referer( 'bulk-jetpack_page_jetpack_modules' );
				foreach( $modules as $module ) {
					Jetpack::log( 'activate', $module );
					Jetpack::activate_module( $module, false );
				}
				// The following two lines will rarely happen, as Jetpack::activate_module normally exits at the end.
				wp_safe_redirect( wp_get_referer() );
				exit;
			case 'bulk-deactivate' :
				if ( ! current_user_can( 'jetpack_deactivate_modules' ) ) {
					break;
				}

				$modules = (array) $_GET['modules'];
				$modules = array_map( 'sanitize_key', $modules );
				check_admin_referer( 'bulk-jetpack_page_jetpack_modules' );
				foreach ( $modules as $module ) {
					Jetpack::log( 'deactivate', $module );
					Jetpack::deactivate_module( $module );
					Jetpack::state( 'message', 'module_deactivated' );
				}
				Jetpack::state( 'module', $modules );
				wp_safe_redirect( wp_get_referer() );
				exit;
			default:
				return;
		}
	}

	function fix_redirect( $module, $redirect = true ) {
		if ( ! $redirect ) {
			return;
		}
		if ( wp_get_referer() ) {
			add_filter( 'wp_redirect', 'wp_get_referer' );
		}
	}

	function admin_menu_debugger() {
		jetpack_require_lib( 'debugger' );
		Jetpack_Debugger::disconnect_and_redirect();
		$debugger_hook = add_submenu_page(
			null,
			__( 'Debugging Center', 'jetpack' ),
			'',
			'manage_options',
			'jetpack-debugger',
			array( $this, 'wrap_debugger_page' )
		);
		add_action( "admin_head-$debugger_hook", array( 'Jetpack_Debugger', 'jetpack_debug_admin_head' ) );
	}

	function wrap_debugger_page( ) {
		nocache_headers();
		if ( ! current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
		Jetpack_Admin_Page::wrap_ui( array( $this, 'debugger_page' ) );
	}

	function debugger_page() {
		jetpack_require_lib( 'debugger' );
		Jetpack_Debugger::jetpack_debug_display_handler();
	}
}
Jetpack_Admin::init();
