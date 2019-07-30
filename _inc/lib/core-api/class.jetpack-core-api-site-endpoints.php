<?php

use Automattic\Jetpack\Connection\Client;

/**
 * This is the endpoint class for `/site` endpoints.
 */
class Jetpack_Core_API_Site_Endpoint {

	/**
	 * Returns the result of `/sites/%s/features` endpoint call.
	 *
	 * @return object $features has 'active' and 'available' properties each of which contain feature slugs.
	 *                  'active' is a simple array of slugs that are active on the current plan.
	 *                  'available' is an object with keys that represent feature slugs and values are arrays
	 *                     of plan slugs that enable these features
	 */
	public static function get_features() {

		// Make the API request
		$request  = sprintf( '/sites/%d/features', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		// Decode the results
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned
		if ( ! is_array( $results ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Site features correctly received.', 'jetpack' ),
				'data'    => wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * Check that the current user has permissions to request information about this site.
	 *
	 * @since 5.1.0
	 *
	 * @return bool
	 */
	public static function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}

	public static function get_benefits() {
		global $wpdb;

		$benefits = [];

		$stats = stats_get_from_restapi( array( 'fields' => 'stats' ) );

		// TODO: better threshold
		if ( $stats->stats->visitors > 0 ) {
			$benefits[] = [
				'name'        => 'jetpack-stats',
				'title'       => 'Jetpack Stats',
				'description' => 'Visitors tracked by Jetpack this year',
				'value'       => $stats->stats->visitors,
			];
		}

		if ( Jetpack::is_module_active( 'protect' ) ) {
			$protect = get_site_option( 'jetpack_protect_blocked_attempts' );
			if ( $protect > 0 ) {
				$benefits[] = [
					'name'        => 'protect',
					'title'       => 'Brute force protection',
					'description' => 'The number of malicious login attempts blocked by Jetpack',
					'value'       => $protect,
				];
			}
		}

		// TODO: are followers_blog and followers_comments unique?
		$followers = $stats->stats->followers_blog; // + $stats->stats->followers_comments;
		// TODO: better threshold
		if ( $followers > 0 ) {
			$benefits[] = [
				'name'        => 'subscribers',
				'title'       => 'Subscribers',
				'description' => 'People subscribed to your updates through Jetpack',
				'value'       => $followers,
			];
		}

		$vaultpress = new VaultPress();
		if ( $vaultpress->is_registered() ) {
			$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) );
			if ( $data->features->backups && $data->backups->stats->revisions > 0 ) {
				$benefits[] = [
					'name'        => 'jetpack-backup',
					'title'       => 'Jetpack Backup',
					'description' => 'The number of times Jetpack has backed up your site and kept it safe',
					'value'       => $data->backups->stats->revisions,
				];
			}
		}

		if ( Jetpack::is_module_active( 'contact-form' ) ) {
			$contact_form_count = array_sum( get_object_vars( wp_count_posts( 'feedback' ) ) );
			if ( $contact_form_count > 0 ) {
				$benefits[] = [
					'name'        => 'contact-form-feedback',
					'title'       => 'Contact Form Feedback',
					'description' => 'Form submissions stored by Jetpack',
					'value'       => $contact_form_count,
				];
			}
		}

		if ( Jetpack::is_module_active( 'photon' ) ) {
			$photon_count = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE post_mime_type IN ('image/jpeg', 'image/png', 'image/gif')" );
			if ( $photon_count > 0 ) {
				$benefits[] = [
					'name'        => 'image-hosting',
					'title'       => 'Image Hosting',
					'description' => 'Super-fast, mobile-ready images served by Jetpack',
					'value'       => $photon_count,
				];
			}
		}

		$videopress_count = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE post_mime_type = 'video/videopress'" );
		if ( $videopress_count > 0 ) {
			$benefits[] = [
				'name'        => 'video-hosting',
				'title'       => 'Video Hosting',
				'description' => 'Ad-free, lightning-fast videos delivered by Jetpack',
				'value'       => $videopress_count,
			];
		}

		if ( Jetpack::is_module_active( 'publicize' ) ) {
			$publicize = new Publicize();

			$connections           = $publicize->get_all_connections();
			$number_of_connections = count( $connections );

			if ( $number_of_connections > 0 ) {
				$benefits[] = [
					'name'        => 'publicize',
					'title'       => 'Publicize',
					'description' => 'Live social media site connections, powered by Jetpack',
					'value'       => count( $connections ),
				];
			}
		}

		// TODO: test this value
		// TODO: better threshold
		if ( $stats->stats->shares > 0 ) {
			$benefits[] = [
				'name'        => 'sharing',
				'title'       => 'Sharing',
				'description' => 'The number of times visitors have shared your posts with the world using Jetpack',
				'value'       => $stats->stats->shares,
			];
		}

		// ***********************
		// WPCOM data:
		// ***********************
		// $benefits[] = [
		// 'name' => 'wordads',
		// 'title' => 'WordAds',
		// 'description' => 'The money you’ve earned by displaying Jetpack WordAds',
		// 'value' => 'TODO: can be retrieved from wpcom endpoint /sites/%s/wordads/earnings'
		// ];
		// $benefits[] = [
		// 'name' => 'likes',
		// 'title' => 'Likes',
		// 'description' => 'Jetpack-powered likes you’ve received on your posts',
		// 'value' => 'TODO See wp-content/mu-plugins/likes/likes.php and public.api/rest/wpcom-json-endpoints/class.wpcom-json-api-list-post-likes-endpoint.php'
		// ];
		// ***********************
		// Will require input from others
		// ***********************
		// $benefits[] = [
		// 'name' => 'paypal-payments',
		// 'title' => 'Paypal Payments',
		// 'description' => 'The money you’ve earned from your Jetpack-powered PayPal button',
		// 'value' => 'TODO'
		// ];
		// ***********************
		// Difficult data:
		// ***********************
		// $benefits[] = [
		// 'name' => 'contact-forms',
		// 'title' => 'Contact Forms',
		// 'description' => 'Live Jetpack forms on your site right now',
		// 'value' => 'TODO'
		// ];
		// $benefits[] = [
		// 'name' => 'galleries',
		// 'title' => 'Galleries',
		// 'description' => 'Beautiful image galleries powered by Jetpack',
		// 'value' => 'TODO'
		// ***********************
		// Might not exist
		// ***********************
		// $benefits[] = [
		// 'name'        => 'jetpack-scan',
		// 'title'       => 'Jetpack Scan',
		// 'description' => 'The number of times Jetpack has scanned your site for viruses and malicious files',
		// 'value'       => 'TODO',
		// ];
		return rest_ensure_response(
			[
				'code'    => 'success',
				'message' => esc_html__( 'Site benefits correctly received.', 'jetpack' ),
				'data'    => json_encode( $benefits ),
			]
		);
	}
}

// Example of calling a wpcom API:
// $response = Client::wpcom_json_api_request_as_user(
// 'jetpack-user-tracking',
// '2',
// array(
// 'method'  => 'GET',
// 'headers' => array(
// 'X-Forwarded-For' => Jetpack::current_user_ip( true ),
// ),
// )
// );
//
// if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
// return new WP_Error(
// 'failed_to_fetch_data',
// esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
// array( 'status' => 500 )
// );
// }
//
// $results = json_decode( $response['body'], true );
