<?php
/**
 * Plans Library
 *
 * Fetch plans data from WordPress.com
 */

use Automattic\Jetpack\Connection\Client;

class Jetpack_Plans {
	/**
	 * Get a list of all available plans from WordPress.com
	 *
	 * @since 7.6.0
	 *
	 * @return array The plans list
	 */
	public static function get_plans() {
		$request = Client::wpcom_json_api_request_as_user(
			'/plans?_locale=' . get_user_locale(),
			'1.5',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => Jetpack::current_user_ip( true ),
				),
            ),
            null,
            'rest'
		);

		$body = wp_remote_retrieve_body( $request );
		if ( 200 === wp_remote_retrieve_response_code( $request ) ) {
			return json_decode( $body );
		} else {
			return $body;
		}
	}

	/**
	 * Get plan information for a plan given its slug
	 *
	 * @since 7.6.0
	 *
	 * @return object The plan object
	 */
	public static function get_plan( $plan_slug ) {
		foreach( self::get_plans() as $plan ) {
			if ( $plan_slug === $plan->product_slug ) {
				return $plan;
			}
		}
	}
}