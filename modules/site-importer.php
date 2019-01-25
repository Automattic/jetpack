<?php

class Jetpack_Site_Importer_Module {
	static function admin_init() {
		if ( ! ( class_exists( 'Jetpack_Calypsoify' ) && Jetpack_Calypsoify::is_active() ) ) {
			// Don't do anything if we're not "calypsoified"
			return;
		}
		add_action( 'current_screen', array( 'Jetpack_Site_Importer_Module', 'current_screen' ) );
		add_filter( 'admin_url', array( 'Jetpack_Site_Importer_Module', 'admin_url_change_have_fun_link' ) );
	}

	static function is_import_screen() {
		global $pagenow;

		// $pagenow is probably enough for us
		// We may want additional "screen" info at some point, so putting here for ref
		// $screen = get_current_screen();
		// error_log( print_r( $screen, 1 ) );

		switch ( $pagenow ) {
			case 'import.php':
				return true;
			case 'admin.php':
				return isset( $_REQUEST['import'] ) && $_REQUEST['import'];
		}
	}

	static function get_current_importer() {
		if ( ! ( self::is_import_screen() && isset( $_REQUEST['import'] ) ) ) {
			return '';
		}
		return strtolower( $_REQUEST['import'] );
	}

	static function is_wordpress_importer() {
		return 'wordpress' === self::get_current_importer();
	}

	static function current_screen() {
		if ( ! self::is_wordpress_importer() ) {
			return;
		}

		error_log( "SUP WordPress Importer!!!!" );
		// @TODO <img src="all-the-things.png" />
	}

	static function admin_url_change_have_fun_link( $admin_url ) {
		if ( ! self::is_wordpress_importer() ) {
			return $admin_url;
		}

		if ( isset( $_GET['step'] ) && 2 === (int) $_GET['step'] ) {
			return 'https://wordpress.com/settings/'; // @TODO dynamic parts
		}

		return $admin_url;
	}
}

add_action( 'admin_init', array( 'Jetpack_Site_Importer_Module', 'admin_init' ) );
