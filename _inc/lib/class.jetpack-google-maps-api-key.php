<?php

class Jetpack_Google_Maps_Api_Key {
	static $option_key = 'jetpack_google_maps_api_data';

	// return back the api key
	function get( $key ) {
		if ( ! empty( $key ) ) {
			return $key;
		}
		$api_key = get_option( self::$option_key, false );
		if ( $api_key ) {
			if ( isset( $api_key->expires ) && $api_key->expires < time() ) {
				$this->maybe_refresh_on_shutdown();
			}
			return $api_key->key;
		}
		if ( false === $api_key ) {
			$this->maybe_refresh_on_shutdown();
		}

		return $key;
	}

	function maybe_refresh_on_shutdown() {
		if ( ! has_action('shutdown', array( $this, 'refresh' ) ) ){
			add_action( 'shutdown', array( $this, 'refresh' ) );
		}
	}

	function refresh() {
		$data = $this->remote_get();
		if ( $data ) {
			update_option( self::$option_key, $data );
		}
	}

	private function set_transient() {
		set_transient( self::$option_key . '_temp', time(), HOUR_IN_SECONDS );
	}

	function remote_get() {
		if ( get_transient( self::$option_key . '_temp' ) ) {
			return false;
		}

		// Make the API request
		$request = sprintf( '/sites/%d/google-maps-api', Jetpack_Options::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '2', array(), null, 'wpcom' );
		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			$this->set_transient();
			return false;
		}

		$response = json_decode( $response['body'] );
		if ( isset( $response->code ) ) {
			$this->set_transient();
			return false;
		}

		return $response;
	}

	function init() {
		add_filter( 'jetpack_google_maps_api_key', array( $this, 'get' ) );
	}
}
