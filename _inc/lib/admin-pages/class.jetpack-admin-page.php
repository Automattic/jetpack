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

	function __construct() {
		$this->jetpack = Jetpack::init();
	}

	function add_actions() {
		/**
		 * Don't add in the modules page unless modules are available!
		 */
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

		add_action( "admin_footer-$hook",        array( $this, 'module_modal_js_template' ) );

		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );

		// Attach page specific actions in addition to the above
		$this->add_page_actions( $hook );
	}

	function admin_head() {
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
		}
	}

	// Render the page with a common top and bottom part, and page specific
	// content
	function render() {
		$this->admin_page_top();
		$this->page_render();
		$this->admin_page_bottom();
	}

	function admin_help() {
		$this->jetpack->admin_help();
	}

	function admin_page_load() {
		// This is big.  For the moment, just call the existing one.
		$this->jetpack->admin_page_load();
	}

	// Load underscore template for the landing page and settings page modal
	function module_modal_js_template() {
		Jetpack::init()->load_view( 'admin/module-modal-template.php' );
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

		wp_enqueue_style( 'jetpack-google-fonts', '//fonts.googleapis.com/css?family=Open+Sans:400italic,400,700,600,800' );

		wp_enqueue_style( 'jetpack-admin', plugins_url( "css/jetpack-admin{$min}.css", JETPACK__PLUGIN_FILE ), array( 'genericons' ), JETPACK__VERSION . '-20121016' );
		wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-admin', 'suffix', $min );
	}
}
?>
