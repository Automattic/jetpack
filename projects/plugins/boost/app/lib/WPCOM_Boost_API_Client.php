<?php
namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Boost_API_Client;

class WPCOM_Boost_API_Client implements Boost_API_Client {

	/**
	 * @inheritDoc
	 */
	public function post( $path, $payload = array() ) {
		return Utils::send_wpcom_request(
			'POST',
			$this->get_api_path( $path ),
			null,
			$payload
		);
	}

	public function get( $path, $query = array() ) {
		return Utils::send_wpcom_request(
			'GET',
			add_query_arg( $query, $this->get_api_path( $path ) )
		);
	}

	private function get_api_path( $path ) {
		$blog_id = (int) \Jetpack_Options::get_option( 'id' );

		return sprintf( '/sites/%d/jetpack-boost/%s', $blog_id, $path );
	}
}
