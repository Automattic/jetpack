<?php

// handles plugins, themes, and core
class Jetpack_Autoupdate {

	private static $instance = null;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Autoupdate;
		}
		return self::$instance;
	}

	private function __construct() {
		add_filter( 'auto_update_plugin',  array( $this, 'autoupdate_plugin' ), 10, 2 );
		add_filter( 'auto_update_theme',   array( $this, 'autoupdate_theme' ), 10, 2 );
		add_filter( 'auto_update_core',    array( $this, 'autoupdate_core' ), 10, 2 );
	}

	function autoupdate_plugin( $update, $item ) {
		return $update;
	}

	function autoupdate_theme( $update, $item ) {
		return $update;
	}

	function autoupdate_core( $update, $item ) {
		return $update;
	}
}
Jetpack_Autoupdate::init();