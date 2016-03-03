<?php

class Jetpack_Options_Sync {

	static $options_to_sync = array();

	static $sync = array();
	static $delete = array();

	static function init() {

		foreach ( self::$options_to_sync as $option ) {
			self::init_option( $option );
		}
	}

	static function init_option( $option ) {
		add_action( "delete_option_{$option}", array( __CLASS__, 'delete_option' ) );
		add_action( "update_option_{$option}", array( __CLASS__, 'update_option' ) );
		add_action( "add_option_{$option}",    array( __CLASS__, 'add_option'   ) );
	}

	static function delete_option( $option ) {
		self::$delete[] = $option;
	}

	static function update_option() {
		$option = current_filter();
		$prefix = 'update_option_';
		if ( 0 !== strpos( $option, $prefix ) ) {
			return;
		}
		$option = substr( $option, strlen( $prefix ) );
		self::$sync[] = $option;
	}

	static function add_option( $option ) {
		self::$sync[] = $option;
	}

	static function options_to_delete() {
		return array_unique( self::$delete );
	}

	static function options_to_sync() {
		return array_unique( self::$sync );
	}
}