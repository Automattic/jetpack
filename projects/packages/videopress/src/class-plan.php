<?php
/**
 * The Plan class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * The Plan class.
 */
class Plan {
	/**
	 * Return the product data provided by the /products wpcom endpoint
	 *
	 * @param string $wpcom_product_slug - The product slug.
	 * @return array
	 */
	public static function get_product( $wpcom_product_slug = 'jetpack_videopress' ) {
		$request_url   = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );

		if ( 200 === $response_code ) {
			$products = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
			return $products->{$wpcom_product_slug};
		}

		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-videopress-pkg' ),
			array(
				'status'  => $response_code,
				'request' => $wpcom_request,
			)
		);
	}
}
