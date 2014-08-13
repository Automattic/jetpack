<?php
include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_Landing_Page extends Jetpack_Admin_Page {
	protected $dont_show_if_not_active = false;

	function get_page_hook() {
		// @todo: Remove in Jetpack class itself.
		remove_action( 'admin_menu', array( $this->jetpack, 'admin_menu' ), 999 );

		$title = _x( 'Jetpack', 'The menu item label', 'jetpack' );

		list( $jetpack_version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
		if (
			$jetpack_version
		&&
			$jetpack_version != JETPACK__VERSION
		&&
			( $new_modules = Jetpack::get_default_modules( $jetpack_version, JETPACK__VERSION ) )
		&&
			is_array( $new_modules )
		&&
			( $new_modules_count = count( $new_modules ) )
		&&
			( Jetpack::is_active() || Jetpack::is_development_mode() )
		) {
			$new_count_i18n = number_format_i18n( $new_modules_count );
			$span_title     = esc_attr( sprintf( _n( 'One New Jetpack Module', '%s New Jetpack Modules', $new_modules_count, 'jetpack' ), $new_count_i18n ) );
			$format         = _x( 'Jetpack %s', 'The menu item label with a new module count as %s', 'jetpack' );
			$update_markup  = "<span class='update-plugins count-{$new_modules_count}' title='$span_title'><span class='update-count'>$new_count_i18n</span></span>";
			$title          = sprintf( $format, $update_markup );
		}

		// Add the main admin Jetpack menu with possible information about new
		// modules
		add_menu_page( 'Jetpack', $title, 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), 'div' );
		// also create the submenu 
		return add_submenu_page( 'jetpack', $title, $title, 'jetpack_admin_page', 'jetpack' );
	}

	function add_page_actions( $hook ) {
		// Add landing page specific underscore templates
		add_action( "admin_footer-$hook",        array( $this, 'js_templates' ) );
		do_action( 'jetpack_admin_menu', $hook );

		// Place the Jetpack menu item on top and others in the order they
		// appear
		add_filter( 'custom_menu_order',         '__return_true' );
		add_filter( 'menu_order',                array( $this, 'jetpack_menu_order' ) );
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' )
				$jp_menu_order[] = $item;

			if ( $index == 0 )
				$jp_menu_order[] = 'jetpack';
		}

		return $jp_menu_order;
	}

	function js_templates() {
		Jetpack::init()->load_view( 'admin/landing-page-templates.php' );
	}

	function page_render() {
		// Handle redirects to configuration pages
		if ( ! empty( $_GET['configure'] ) ) {
			return $this->render_nojs_configurable();
		}

		global $current_user;

		$is_connected      = Jetpack::is_active();
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );
		$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );

		if ( Jetpack::is_development_mode() ) {
			$is_connected      = true;
			$is_user_connected = true;
			$is_master_user    = false;
		}

		// Set template data for the admin page template
		$data = array(
			'is_connected' => $is_connected,
			'is_user_connected' => $is_user_connected,
			'is_master_user' => $is_master_user
		);
		Jetpack::init()->load_view( 'admin/admin-page.php', $data );
	}

	// Render the configuration page for the module if it exists and an error
	// screen if the module is not configurable
	function render_nojs_configurable() {
		echo '<div class="clouds-sm"></div>';
		echo '<div class="wrap configure-module">';

		$module_name = preg_replace( '/[^\da-z\-]+/', '', $_GET['configure'] );
		if ( Jetpack::is_module( $module_name ) && current_user_can( 'jetpack_configure_modules' ) ) {
			Jetpack::admin_screen_configure_module( $module_name );
		} else {
			echo '<h2>' . esc_html__( 'Error, bad module.', 'jetpack' ) . '</h2>';
		}

		echo '</div><!-- /wrap -->';
	}

	function page_admin_scripts() {
		// Enqueue jp.js and localize it
		wp_enqueue_script( 'jetpack-js', plugins_url( '_inc/jp.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery', 'wp-util' ), JETPACK__VERSION . '-20121111' );
		wp_localize_script(
			'jetpack-js',
			'jetpackL10n',
			array(
				'ays_disconnect'    => __( "This will deactivate all Jetpack modules.\nAre you sure you want to disconnect?", 'jetpack' ),
				'ays_unlink'        => __( "This will prevent user-specific modules such as Publicize, Notifications and Post By Email from working.\nAre you sure you want to unlink?", 'jetpack' ),
				'ays_dismiss'       => __( "This will deactivate Jetpack.\nAre you sure you want to deactivate Jetpack?", 'jetpack' ),
				'view_all_features' => __( 'View all Jetpack features', 'jetpack' ),
				'no_modules_found'  => sprintf( __( 'Sorry, no modules were found for the search term "%s"', 'jetpack' ), '{term}' ),
				'modules'           => array_values( Jetpack_Admin::init()->get_modules() ),
				'currentVersion'    => JETPACK__VERSION,
			)
		);
	}
}
?>
