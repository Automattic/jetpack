<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;

class Site_Urls implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		global $wpdb;

		$results = $wpdb->get_results( "SELECT ID, post_modified FROM {$wpdb->posts} WHERE post_status = 'publish' ORDER BY post_modified DESC LIMIT 0, 1000" );

		$urls = array();
		foreach ( $results as $result ) {
			$urls[] = array(
				'url'      => get_permalink( $result->ID ),
				'modified' => $result->post_modified,
			);
		}

		return rest_ensure_response( $urls );
	}

	public function permissions() {
		return array(
			// @TODO - implement.
		);
	}

	public function name() {
		return '/site-urls';
	}
}
