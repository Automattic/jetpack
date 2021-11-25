<?php
/**
 * The Search Plan class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;

/**
 * Registers the REST routes for Search.
 */
class Plan {
	const JETPACK_SEARCH_PLAN_INFO_OPTION_KEY = 'jetpack_search_plan_info';

	/**
	 * Refresh plan info stored in options
	 */
	public function get_plan_info_from_wpcom() {
		$blog_id  = Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/jetpack-search/plan',
			'2'
		);

		// store plan in options.
		$this->update_search_plan_info( $response );

		return $response;
	}

	/**
	 * Get plan info.
	 *
	 * @param {bool} $force_refresh - Default to false. Set true to load from WPCOM.
	 */
	public function get_plan_info( $force_refresh = false ) {
		if ( $force_refresh ) {
			$this->get_plan_info_from_wpcom();
		}
		$plan_info = get_option( self::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		if ( false === $plan_info && ! $force_refresh ) {
			$plan_info = $this->get_plan_info( true );
		}
		return $plan_info;
	}

	/**
	 * Please use `supports_instant_search` instead.
	 *
	 * @deprecated
	 */
	public function has_jetpack_search_product() {
		return (bool) get_option( 'has_jetpack_search_product' );
	}

	/**
	 * Returns true if plan supports Instant Search.
	 */
	public function supports_instant_search() {
		$plan_info = $this->get_plan_info();
		return isset( $plan_info['supports_instant_search'] ) && $plan_info['supports_instant_search'];
	}

	/**
	 * Returns true if the plan support either Instant Search or Classic Search.
	 */
	public function supports_search() {
		$plan_info = $this->get_plan_info();
		return isset( $plan_info['supports_search'] ) && $plan_info['supports_search'];
	}

	/**
	 * Returns true if the plan only supports Classic Search.
	 */
	public function supports_only_classic_search() {
		$plan_info = $this->get_plan_info();
		return isset( $plan_info['supports_only_classic_search'] ) && $plan_info['supports_only_classic_search'];
	}

	/**
	 * Update `has_jetpack_search_product` regarding the plan information
	 *
	 * @param array|WP_Error $response - Resopnse from WPCOM.
	 */
	public function update_search_plan_info( $response ) {
		if ( is_wp_error( $response ) ) {
			return null;
		}
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $status_code || ! isset( $body['supports_instant_search'] ) ) {
			return null;
		}
		// set option whether has Jetpack Search plan for capability reason.
		if ( get_option( 'has_jetpack_search_product' ) !== (bool) $body['supports_instant_search'] ) {
			update_option( 'has_jetpack_search_product', (bool) $body['supports_instant_search'] );
		}
		update_option( self::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $body );
	}

}
