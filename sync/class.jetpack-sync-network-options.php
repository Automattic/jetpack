<?php


class Jetpack_Sync_Network_Options {

	static $options = array(
		'site_name',
	);

	static $check_sum_id = 'network_options_check_sum';

	static $sync = array();
	static $delete = array();

	static function init() {
		foreach ( self::$options as $option ) {
			self::register( $option );
		}
	}

	static function register( $option ) {
		add_action( "add_site_option_{$option}",    array( __CLASS__, 'update_option' ), 10, 1 );
		add_action( "update_site_option_{$option}", array( __CLASS__, 'update_option' ), 10, 1 );
		add_action( "delete_site_option_{$option}", array( __CLASS__, 'delete_option' ), 10, 1 );
	}

	static function update_option( $option ) {
		self::$sync[] = $option;
		Jetpack_Sync::schedule_sync();
	}

	static function delete_option( $option ) {
		self::$delete[] = $option;
		Jetpack_Sync::schedule_sync();
	}

	static function get_all() {
		return array_combine( self::$options, array_map( 'get_site_option', self::$options ) );
	}

	static function get_to_sync() {
		self::$sync = array_unique( self::$sync );
		if ( empty( self::$sync ) ) {
			return null;
		}
		return array_combine( self::$sync, array_map( 'get_site_option', self::$sync ) );
	}

	static function get_to_delete() {
		return array_unique( self::$delete );
	}
}
