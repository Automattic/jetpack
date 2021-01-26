<?php

/**
 * Jurassic Ninja site creator.
 */
class Jetpack_Beta_JN_Creator {
	private static $create_url          = 'https://jurassic.ninja/wp-json/jurassic.ninja/create';
	private static $transient_status    = 'jn-creator-status';
	private static $transient_site_info = 'jn-creator-site-info';

	public static function do_stuff() {
		$jn_creator = new self();
		$jn_creator->update_process_status( 'in-process' );
		$site_url = $jn_creator->request_site();
		$jn_creator->extract_site_credentials( $site_url );
		$jn_creator->persist_site_info();
		$jn_creator->update_process_status( 'done' );
		error_log( 'DONE' );
		error_log( $jn_creator->jurassic_password );
		return $jn_creator->jurassic_password;
	}

	/**
	 * Returns site creation status. it might be one of the following:
	 *  - false - if process not started OR expired
	 *  - in-process - once process was started
	 *  - done - when process is done, and site info persisted
	 */
	public static function get_process_status() {
		return get_transient( self::$transient_status );
	}

	/**
	 * Returns site info as an associated array. Returns false if site info is not available
	 */
	public static function get_site_info() {
		return get_transient( self::$transient_site_info );
	}

	/**
	 * Sends API request to create new JN site.
	 */
	private function request_site() {
		$args = array(
			'timeout'     => 300,
			'headers'     => [ 'Content-Type' => 'application/json; charset=utf-8' ],
			'body'        => wp_json_encode( [ 'jetpack-beta' => true, 'shortlived' => true ] ),
			'method'      => 'POST',
			'data_format' => 'body',
		);
		$response = wp_remote_post( self::$create_url, $args );
		$site_url = json_decode( $response['body'] )->data->url;
		return $site_url;
	}

	/**
	 * Sends an GET request to the new created JN site and extracts site credentials from the response HTML
	 */
	private function extract_site_credentials( $site_url ) {
		$response = wp_remote_get( $site_url );
		error_log( 'SITE' );
		error_log( print_r( $response['body'], 1 ) );
		$this->extract_credentials_from_html( $response['body'] );
	}

	/**
	 * Parses HTML and tries to extract some JN credentials into instance variables
	 */
	private function extract_credentials_from_html( $html ) {
		$doc = new DOMDocument();
		$doc->loadHTML( $html, LIBXML_NOWARNING | LIBXML_NOERROR );

		$this->jurassic_url      = $doc->getElementById( 'jurassic_url' )->childNodes[0]->data;
		$this->jurassic_password = $doc->getElementById( 'jurassic_password' )->childNodes[0]->data;
		$this->jurassic_username = $doc->getElementById( 'jurassic_username' )->childNodes[0]->data;

		return $this->jurassic_password;
	}

	private function persist_site_info() {
		$site_info = [
			'jurassic_url'      => $this->jurassic_url,
			'jurassic_password' => $this->jurassic_password,
			'jurassic_username' => $this->jurassic_username,
		];
		set_transient( self::$transient_site_info, $site_info, 60 * 60 * 24 * 7 ); // 7 Days expiration time
	}

	private function update_process_status( $status ) {
		set_transient( self::$transient_status, $status, 10 * 60 ); // 10 Minute expiration time
	}
}
