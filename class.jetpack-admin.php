<?php

class Jetpack_Admin {

	function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ), 998 );
	}

	function admin_menu() {
		// @todo: Remove in Jetpack class itself.
		remove_action( 'admin_menu', array( Jetpack::init(), 'admin_menu' ), 999 );

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
		} else {
			$title          = _x( 'Jetpack', 'The menu item label', 'jetpack' );
		}

		$hook = add_menu_page( 'Jetpack', $title, 'read', 'jetpack', array( $this, 'admin_page' ), 'div' );

		$debugger_hook = add_submenu_page( null, __( 'Jetpack Debugging Center', 'jetpack' ), '', 'manage_options', 'jetpack-debugger', array( Jetpack::init(), 'debugger_page' ) );
		add_action( "admin_head-$debugger_hook", array( 'Jetpack_Debugger', 'jetpack_debug_admin_head' ) );

		add_action( "load-$hook",                array( Jetpack::init(), 'admin_page_load' ) );
		add_action( "admin_head-$hook",          array( Jetpack::init(), 'admin_head' ) );
		add_filter( 'custom_menu_order',         array( Jetpack::init(), 'admin_menu_order' ) );
		add_filter( 'menu_order',                array( Jetpack::init(), 'jetpack_menu_order' ) );
		add_action( "admin_print_styles-$hook",  array( Jetpack::init(), 'admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( Jetpack::init(), 'admin_scripts' ) );

		do_action( 'jetpack_admin_menu', $hook );

	}

	function admin_page() {
		
	}

	function modules_page() {
		
	}

}
new Jetpack_Admin;
