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
 * Handler for POST lcp/update. Expects the following body params:
 * - success: boolean - False if the whole LCP job failed.
 * - message: string - Error message if success is false.
 * - data: object - All results from the LCP job:
 *
 * Each data key contains:
 * - key: string - The key of the page.
 * - url: string - The URL of the page.
 * - devices: object - The LCP data for both mobile and desktop.
 *
 * Each device key contains:
 * - success: boolean - False if this device key failed.
 * - element: string - The selector of the LCP element.
 * - type: string - The type of the LCP element. Either 'img' or 'background-image'.
 * - url: string - Only for 'img' elements. The URL of LCP element.
 * - html: string - The HTML of the LCP element.
 * - report: object - The full report of the LCP element.
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

		// Update each page.
		foreach ( $pages as $entry ) {
			if ( $entry['success'] ) {
				$state->set_page_success( $entry['key'] );
			} else {
				$errors = array();
				foreach ( $entry['reports'] as $report ) {
					if ( false === $report['success'] && ! empty( $report['message'] ) ) {
						$errors[] = array(
							// @TODO: Add a type and meta here (and the Cloud) after Beta release to further explain the error.
							'message' => $report['message'] ?? __( 'An unknown error occurred', 'jetpack-boost' ),
						);
					}
				}

				$state->set_page_errors( $entry['key'], $errors );
			}

			// Store the LCP data for this page.
			$storage->store_lcp( $entry['key'], $entry['reports'] );

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
