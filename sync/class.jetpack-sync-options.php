<?php


class Jetpack_Sync_Options {

	static $options = array(
		'blogname',
	);

	static $check_sum_id = 'options_check_sum';

	static $sync = array();
	static $delete = array();

	static function init() {
		foreach ( self::$options as $option ) {
			self::register( $option );
		}
	}

	static function register( $option ) {
		add_action( "add_option_{$option}",    array( __CLASS__, 'add_option'   ) );
		add_action( "update_option_{$option}", array( __CLASS__, 'update_option' ) );
		add_action( "delete_option_{$option}", array( __CLASS__, 'delete_option' ) );
	}

	static function add_option( $option ) {
		self::$sync[] = $option;
	}

	static function update_option() {
		$prefix = 'update_option_';
		$option = substr( current_filter(), strlen( $prefix ) );
		if ( current_filter() === $option ) {
			return;
		}
		self::$sync[] = $option;
	}

	static function delete_option( $option ) {
		self::$delete[] = $option;
	}

	static function get_all() {
		return array_combine( self::$options, array_map( 'get_option', self::$options ) );
	}

	static function get_to_sync() {
		return array_combine( self::$sync, array_map( 'get_option', self::$sync ) );
	}

	static function get_to_delete() {
		return array_combine( self::$delete, array_map( 'get_option', self::$delete ) );
	}

}
