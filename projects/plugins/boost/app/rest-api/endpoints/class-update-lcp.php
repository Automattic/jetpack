<?php
/**
 * Save generated LCP data.
 *
 * This endpoint is used by WP.com to push the generated LCP data to the boost plugin.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Storage;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;
use WP_REST_Server;

/**
 * Handler for POST cloud-css/update. Expects the following body params:
 * - success: boolean - False if the whole Critical CSS job failed.
 * - message: string containing an error message if success is false.
 * - providers: Object containing one result for each key:
 *
 * Each provider key contains:
 * - success: boolean - False if this provider key failed.
 * - data: Either a successful CSS block, or a CSS error.
 *
 * Each CSS block looks like:
 * - css: string - containing CSS data.
 *
 * Each CSS error looks like:
 * - urls: Object describing each URL which failed. Keys are URLs.
 *
 * Each URL failure looks like:
 * - message: string - containing an error message.
 * - type: string - machine readable error type.
 * - meta: Object - JSON string compatible object containing extra metadata for consumption in the UI.
 */
class Update_LCP implements Endpoint {

	public function name() {
		return 'lcp/update';
	}

	public function request_methods() {
		return WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$state          = new LCP_State();
		$storage        = new LCP_Storage();
		$params         = $request->get_params();
		$pages          = empty( $params['data'] ) || ! is_array( $params['data'] ) ? array() : $params['data'];
		$api_successful = array( 'success' => true );

		// If success is false, the whole LCP generation process failed.
		if ( empty( $params['success'] ) ) {
			if ( empty( $params['message'] ) || ! is_string( $params['message'] ) ) {
				$error = __( 'An unknown error occurred', 'jetpack-boost' );
			} else {
				$error = $params['message'];
			}

			$state->set_error( $error );
			$state->save();

			return $api_successful;
		}

		// @TODO: handle bad payload coming from the Cloud.

		// Update each page.
		foreach ( $pages as $entry ) {
			// Mark the page as successfully analyzed as we don't know what to do if mobile fails but desktop succeeds.
			$state->set_page_success( $entry['key'] );

			// Store the LCP data for this page.
			$storage->store_lcp( $entry['key'], $entry['devices'] );

			// Failures must have an array of urls.
			// @TODO: figure out what to do with failures.
		}

		// Save the state changes.
		$state->save();

		return $api_successful;
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}
}
