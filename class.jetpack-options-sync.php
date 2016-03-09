<?php

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/jetpack/class.jetpack-json-api-endpoint.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/jetpack/class.jetpack-json-api-get-options-endpoint.php';

class Jetpack_Options_Sync {

	static $sync_all = array();
	static $sync = array();
	static $delete = array();

	static function init() {
		foreach (  Jetpack_JSON_API_Get_Options_Endpoint::$options as $option ) {
			self::init_option( $option );
		}
	}

	static function init_option( $option ) {
		add_action( "delete_option_{$option}", array( __CLASS__, 'delete_option' ) );
		add_action( "update_option_{$option}", array( __CLASS__, 'update_option' ) );
		add_action( "add_option_{$option}",    array( __CLASS__, 'add_option'   ) );
	}

	static function init_mock_option( $mock_option, $callback ) {
		// The mock options get pre-fiexed with jetpack
		self::init_option(  'jetpack_' . $mock_option );

		add_filter( 'pre_option_jetpack_'. $mock_option, $callback );
		// This shouldn't happen but if it does we return the same as before.
		add_filter( 'option_jetpack_'. $mock_option, $callback );


		self::$sync_all[] = $mock_option;
	}

	static function sync_mock_option( $mock_option ) {
		self::$sync[] = $mock_option;
	}

	static function all() {
		self::$sync = array_merge( self::$sync, self::$sync_all );
	}

	static function init_constant( $constant ) {
		self::$sync_all[] = $constant;
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

	/**
	 * Sync all the data related to site settings
	 */
	static function sync_site_settings() {

		// set the options to sync
		foreach ( $options as $option ) {
			self::init_option( $option );
		}

	}

	static function get_settings() {
		error_log(self::get_settings_api_url());
		return self::json_api( self::get_settings_api_url() );
	}

	static function json_api( $url, $method = 'GET' ) {
		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';

		$api = WPCOM_JSON_API::init( $method, $url, null, true );

		require_once( JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php' );
		require_once( JETPACK__PLUGIN_DIR . 'json-endpoints.php' );

		new Jetpack_JSON_API_Get_Options_Endpoint( array (
			'method' => 'GET',
			'description' => 'Get all options.',
			'group' => '__do_not_document',
			'stat' => 'option:update',
			'path' => '/sites/%s/options',
			'path_labels' => array(
				'$site' => '(int|string) Site ID or domain',
			),
			'query_parameters' => array(
				'options' => '(array) The names of the option, mock option and constants to retrieve.',
			),
			'response_format' => array(
				'options' => '(array) The value of the updated option.',
			),
			'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/options',
			'example_request_data' => array(
				'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
				'body' => array(
					'blogname' => 'My new blog name'
				),
			),
		) );

		return $api->serve( false, true );

	}

	static function get_settings_api_url() {
		return sprintf( 'https://' . JETPACK__WPCOM_JSON_API_HOST . '/rest/v1.1/sites/%1$d/options', Jetpack_Options::get_option( 'id' ) );
	}
}





